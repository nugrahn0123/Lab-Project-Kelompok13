const express = require("express");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { createClient } = require("redis");
const { createHash } = require("crypto");
// Load .env dari root project jika DATABASE_URL belum di-set (lokal tanpa Docker)
if (!process.env.DATABASE_URL) {
  require("dotenv").config({ path: path.join(__dirname, "../../.env") });
}

const hashPw = (pw) => createHash("sha256").update(pw).digest("hex");

// Set search_path via PostgreSQL startup option — tidak ada race condition
const _dbUrl = new URL(process.env.DATABASE_URL);
_dbUrl.searchParams.set('options', '-c search_path=event_db,public');
const pool = new Pool({
  connectionString: _dbUrl.toString(),
  ssl: { rejectUnauthorized: false },
});
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const galat = (code, message) => ({ error: { code, message } });

// Redis cache-aside: data events jarang berubah, cocok di-cache
let redis = null;
async function connectRedis() {
  try {
    redis = createClient({
      url: process.env.REDIS_URL || "redis://redis:6379",
      socket: { reconnectStrategy: false }, // fail fast jika Redis tidak ada
    });
    redis.on("error", () => {}); // suppress retry errors
    await redis.connect();
    console.log("event-service: Redis terhubung");
  } catch (e) {
    console.warn("event-service: Redis tidak tersedia, lanjut tanpa cache");
    redis = null;
  }
}

// Jalankan migrasi maju-saja sebelum server siap menerima request
// Advisory lock (1001) mencegah race condition saat 3 replika startup bersamaan
async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(1001)');
    // Pastikan schema ada dan search_path benar SEBELUM migration
    await client.query('CREATE SCHEMA IF NOT EXISTS event_db');
    await client.query('SET search_path TO event_db, public');
    const migrDir = path.join(__dirname, "migrations");
    const files = fs.readdirSync(migrDir).filter(f => f.endsWith(".sql")).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrDir, file), "utf8");
      await client.query(sql);
      console.log(`event-service: migrasi ${file} selesai`);
    }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(1001)');
    client.release();
  }
}

// Seed 54 konser realistis Makassar — data nyata War Tiket Kelompok 13
async function seed() {
  try {
    const { rows: existing } = await pool.query("SELECT COUNT(*)::int AS n FROM events");
    if (existing[0].n > 0) {
      // Data sudah ada — lewati INSERT tapi tetap jalankan patch tanggal
      await patchEventDates();
      return;
    }

    // [id, nama, tanggal, venue, harga, kursi_tersisa, status]
    const events = [
      [1,  "Dewa 19 Reunion Tour — Makassar",                    "2025-03-15", "Celebes Convention Center (CCC), Makassar", 350000, 0,   "selesai"],
      [2,  "Westlife The Wild Dreams Tour — Makassar",           "2025-05-10", "Lapangan Karebosi, Makassar",                850000, 0,   "selesai"],
      [3,  "Tulus — Manusia Tour Makassar",                      "2025-07-21", "Trans Studio Makassar",                      450000, 0,   "selesai"],
      [4,  "Raisa — Batas Imaji Concert",                        "2025-09-05", "Celebes Convention Center (CCC), Makassar", 550000, 0,   "selesai"],
      [5,  "Iwan Fals & OI — Konser Anak Negeri",                "2025-10-17", "Lapangan Karebosi, Makassar",                150000, 0,   "selesai"],
      [6,  "Noah — Keterpisahan Tour",                           "2025-11-08", "Gedung Serbaguna Phinisi, Makassar",         300000, 0,   "selesai"],
      [7,  "Hindia — Aku Bukan Filantropi Live",                 "2025-11-22", "Pantai Losari Outdoor Stage, Makassar",      200000, 0,   "selesai"],
      [8,  "Bernadya — Salam Perpisahan Tour",                   "2025-12-06", "Trans Studio Makassar",                      375000, 0,   "selesai"],
      [9,  "Sheila On 7 — Tunggu Aku di Jakarta (Makassar Leg)", "2025-12-20", "Celebes Convention Center (CCC), Makassar", 400000, 0,   "selesai"],
      [10, "New Year Eve Concert — Makassar 2026",               "2025-12-31", "Lapangan Karebosi, Makassar",                125000, 0,   "selesai"],
      [11, "Kunto Aji — Mantra Mantra Tour Makassar",            "2026-01-17", "Trans Studio Makassar",                      220000, 0,   "selesai"],
      [12, "Isyana Sarasvati — Lexicon Live",                    "2026-02-14", "Gedung Serbaguna Phinisi, Makassar",         285000, 0,   "selesai"],
      [13, "Afgan — The Road Tour Makassar",                     "2026-02-28", "Celebes Convention Center (CCC), Makassar", 395000, 0,   "selesai"],
      [14, "Weird Genius — Lathi Live Experience",               "2026-03-14", "Trans Studio Makassar",                      250000, 0,   "selesai"],
      [15, "Ariel NOAH Solo Concert",                            "2026-03-28", "Lapangan Karebosi, Makassar",                350000, 0,   "selesai"],
      [16, "Raisa — Hari Ini Tour Makassar",                     "2026-04-11", "Celebes Convention Center (CCC), Makassar", 475000, 0,   "selesai"],
      [17, "Mocca — Friends Tour Makassar",                      "2026-04-25", "Trans Studio Makassar",                      165000, 0,   "selesai"],
      [18, "Kahitna — Cerita Cinta Tour",                        "2026-05-09", "Celebes Convention Center (CCC), Makassar", 420000, 0,   "selesai"],
      [19, "Payung Teduh — Kucari Kamu Tour",                    "2026-05-23", "Gedung Serbaguna Phinisi, Makassar",         215000, 0,   "selesai"],
      [20, "Rizky Febian — Cuek Tour Makassar",                  "2026-06-06", "Trans Studio Makassar",                      315000, 0,   "selesai"],
      [21, "Sal Priadi — Gajah Live Makassar",                   "2026-08-22", "Pantai Losari Outdoor Stage, Makassar",      230000, 5,   "aktif"],
      [22, "Lyodra — Bila Tour Makassar",                        "2026-08-22", "Celebes Convention Center (CCC), Makassar", 275000, 3,   "aktif"],
      [23, "Gilga Sahid — Lamunan Tour Makassar",                "2026-08-23", "Lapangan Karebosi, Makassar",                135000, 8,   "aktif"],
      // ── Agustus 2026 — war tiket aktif (kursi hampir habis)
      [24, "Pamungkas — To The Bone Live",                       "2026-08-23", "Trans Studio Makassar",                      275000, 4,   "aktif"],
      [25, "Maudy Ayunda — Perahu Kertas Anniversary Concert",   "2026-08-24", "Celebes Convention Center (CCC), Makassar", 385000, 2,   "aktif"],
      // ── Akhir Agustus — minggu ini
      [26, "Yura Yunita — Merakit Concert Makassar",             "2026-08-24", "Pantai Losari Outdoor Stage, Makassar",      250000, 25,  "aktif"],
      [27, "Maliq & D'Essentials — Wavelength Tour",             "2026-08-25", "Trans Studio Makassar",                      325000, 1,   "aktif"],
      [28, "Nadin Amizah — Amin Paling Serius Tour",             "2026-08-26", "Gedung Serbaguna Phinisi, Makassar",         295000, 40,  "aktif"],
      [29, "Fourtwnty — Zona Nyaman Live Makassar",              "2026-08-28", "Pantai Losari Outdoor Stage, Makassar",      180000, 6,   "aktif"],
      [30, "Nadhif Basalamah — Hanya Manusia Live",              "2026-10-03", "Celebes Convention Center (CCC), Makassar", 245000, 9,   "aktif"],
      [31, "Rendy Pandugo — My Way Tour",                        "2026-10-10", "Gedung Serbaguna Phinisi, Makassar",         225000, 55,  "aktif"],
      [32, "Stars and Rabbit — Live Makassar",                   "2026-10-17", "Pantai Losari Outdoor Stage, Makassar",      160000, 130, "aktif"],
      [33, "Juicy Luicy — Tanpa Tergesa Live",                   "2026-10-24", "Trans Studio Makassar",                      210000, 23,  "aktif"],
      [34, "Fiersa Besari — Garis Waktu Tour",                   "2026-10-31", "Lapangan Karebosi, Makassar",                120000, 400, "aktif"],
      [35, "Bunga Citra Lestari — Cinta Sejati Tour",            "2026-11-07", "Celebes Convention Center (CCC), Makassar", 465000, 1,   "aktif"],
      [36, "Ardhito Pramono — Bitterlove Live Makassar",         "2026-11-14", "Gedung Serbaguna Phinisi, Makassar",         205000, 62,  "aktif"],
      [37, "Danilla — Peradaban Tour",                           "2026-11-21", "Pantai Losari Outdoor Stage, Makassar",      170000, 145, "aktif"],
      [38, "Tipe-X — Ska Reggae Reunion Makassar",               "2026-11-28", "Trans Studio Makassar",                      175000, 90,  "aktif"],
      [39, "Endah N Rhesa — Roughly Happy Live",                 "2026-12-05", "Pantai Losari Outdoor Stage, Makassar",      150000, 180, "aktif"],
      [40, "Indonesian Idol Grand Concert — Makassar",           "2026-12-12", "Lapangan Karebosi, Makassar",                100000, 750, "aktif"],
      [41, "Pee Wee Gaskins — Dark Horses Tour Makassar",        "2026-12-19", "Gedung Serbaguna Phinisi, Makassar",         145000, 200, "aktif"],
      [42, "New Year Eve Concert — Makassar 2027",               "2026-12-31", "Lapangan Karebosi, Makassar",                150000, 600, "aktif"],
      // ── 2027
      [43, "Tulus — Aku Bukan Filantropi Tour 2027",             "2027-01-17", "Celebes Convention Center (CCC), Makassar", 500000, 300, "aktif"],
      [44, "HiVi! — Satu-Satunya Tour 2027",                     "2027-01-31", "Trans Studio Makassar",                      195000, 250, "aktif"],
      [45, "Elephant Kind — Beautiful Trance Tour",              "2027-02-14", "Gedung Serbaguna Phinisi, Makassar",         185000, 180, "aktif"],
      [46, "Hindia — Live Makassar 2027",                        "2027-02-28", "Pantai Losari Outdoor Stage, Makassar",      220000, 320, "aktif"],
      [47, "Bernadya — World Tour Makassar Stop",                "2027-03-14", "Celebes Convention Center (CCC), Makassar", 425000, 150, "aktif"],
      [48, "Feast — Beberapa Orang Memaafkan Live 2027",         "2027-03-28", "Trans Studio Makassar",                      140000, 280, "aktif"],
      [49, "Sheila On 7 — 30th Anniversary Tour Makassar",       "2027-04-10", "Lapangan Karebosi, Makassar",                450000, 500, "aktif"],
      [50, "White Shoes & The Couples Company — Live 2027",      "2027-04-24", "Gedung Serbaguna Phinisi, Makassar",         190000, 210, "aktif"],
      [51, "Pamungkas — World Tour 2027 Makassar",               "2027-05-08", "Celebes Convention Center (CCC), Makassar", 350000, 175, "aktif"],
      [52, "Kunto Aji — Live Makassar 2027",                     "2027-05-22", "Trans Studio Makassar",                      240000, 300, "aktif"],
      [53, "Ariel NOAH — Konser Spesial 2027",                   "2027-06-05", "Lapangan Karebosi, Makassar",                380000, 420, "aktif"],
      [54, "Raisa — Aku Bukan Milikmu Tour 2027",                "2027-06-19", "Celebes Convention Center (CCC), Makassar", 520000, 200, "aktif"],
    ];

    for (const [id, nama, tanggal, venue, harga, sisa, status] of events) {
      // kursi_total: sold-out → 1000, aktif → max(sisa+300, 1000) agar constraint terpenuhi
      const kursiTotal = sisa === 0 ? 1000 : Math.max(sisa + 300, 1000);
      await pool.query(
        `INSERT INTO events (id, nama, tanggal, venue, kota, harga, kursi_total, kursi_tersisa, status)
         OVERRIDING SYSTEM VALUE
         VALUES ($1, $2, $3, $4, 'Makassar', $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           tanggal       = EXCLUDED.tanggal,
           status        = EXCLUDED.status,
           kursi_total   = CASE WHEN events.status = 'selesai' THEN EXCLUDED.kursi_total   ELSE events.kursi_total   END,
           kursi_tersisa = CASE WHEN events.status = 'selesai' THEN EXCLUDED.kursi_tersisa ELSE events.kursi_tersisa END`,
        [id, nama, tanggal, venue, harga, kursiTotal, sisa, status]
      );
    }
    // Reset sequence agar INSERT berikutnya tidak bentrok dengan id 1-54
    await pool.query("SELECT setval(pg_get_serial_sequence('events', 'id'), 54)");
    await patchEventDates();
    console.log("event-service: seed 54 konser Makassar selesai ✓");
  } catch (e) {
    console.warn("event-service: seed gagal:", e.message);
  }
}

// Patch tanggal & status event agar selalu relevan — SELALU jalan di setiap restart
async function patchEventDates() {
  // [id, tanggal_baru, status_baru, sisa_jika_tadinya_selesai]
  const patches = [
    [21, "2026-08-22", "aktif", 5],
    [22, "2026-08-22", "aktif", 3],
    [23, "2026-08-23", "aktif", 8],
    [24, "2026-08-23", "aktif", 4],
    [25, "2026-08-24", "aktif", 2],
    [26, "2026-08-24", "aktif", 25],
    [27, "2026-08-25", "aktif", 1],
    [28, "2026-08-26", "aktif", 40],
    [29, "2026-08-28", "aktif", 6],
  ];
  for (const [id, tanggal, status, sisa] of patches) {
    await pool.query(
      `UPDATE events SET tanggal = $1, status = $2,
         kursi_tersisa = CASE WHEN kursi_tersisa = 0 THEN $3 ELSE kursi_tersisa END
       WHERE id = $4`,
      [tanggal, status, sisa, id]
    );
  }
  console.log("event-service: patch tanggal selesai ✓");
}

// GET /events — daftar konser berpaginasi dengan keyset untuk mobile (Lapisan 3)
// ?page=1&limit=20 → OFFSET (sederhana)
// ?after=<id>&limit=20 → keyset (stabil untuk mobile)
app.get("/events", async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 20));

    // Lapisan 3: keyset pagination lebih stabil di jaringan buruk
    if (req.query.after !== undefined) {
      const afterId = parseInt(req.query.after) || 0;
      const { rows } = await pool.query(
        "SELECT id, nama, tanggal, venue, kota, harga, kursi_tersisa FROM events WHERE id > $1 AND status = 'aktif' ORDER BY id LIMIT $2",
        [afterId, limit]
      );
      const total = (await pool.query("SELECT COUNT(*)::int AS n FROM events WHERE status = 'aktif'")).rows[0].n;
      return res.json({ data: rows, limit, total, items: rows.length });
    }

    // OFFSET pagination (default)
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;

    // Cache-aside: cek Redis sebelum sentuh DB
    const cacheKey = `events:page=${page}:limit=${limit}`;
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    }

    const { rows } = await pool.query(
      "SELECT id, nama, tanggal, venue, kota, harga, kursi_tersisa FROM events WHERE status = 'aktif' ORDER BY id LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    const total = (await pool.query("SELECT COUNT(*)::int AS n FROM events WHERE status = 'aktif'")).rows[0].n;
    const respons = { data: rows, page, limit, total };

    // Simpan ke Redis dengan TTL 30 detik; hapus kunci setelah ada UPDATE events
    if (redis) await redis.set(cacheKey, JSON.stringify(respons), { EX: 30 });

    res.json(respons);
  } catch (e) {
    console.error(e);
    res.status(500).json(galat("SERVER_ERROR", "Terjadi kesalahan server"));
  }
});

// GET /events/:id — detail satu konser (dibutuhkan oleh web/mobile)
app.get("/events/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json(galat("INPUT_TIDAK_VALID", "id harus bilangan bulat"));
  }
  try {
    const cacheKey = `event:${id}`;
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    }
    const { rows } = await pool.query(
      "SELECT id, nama, tanggal, venue, kota, harga, kursi_total, kursi_tersisa, status FROM events WHERE id = $1",
      [id]
    );
    if (!rows.length) return res.status(404).json(galat("EVENT_TIDAK_ADA", "Event tidak ditemukan"));
    if (redis) await redis.set(cacheKey, JSON.stringify(rows[0]), { EX: 30 });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json(galat("SERVER_ERROR", "Terjadi kesalahan server"));
  }
});

// POST /events/:id/lock-internal — dipanggil ticket-service untuk kurangi kursi atomik
// Endpoint internal: tidak diekspos ke nginx/publik
app.post("/events/:id/lock-internal", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const qty = parseInt(req.body.qty);
    if (!Number.isInteger(eventId) || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json(galat("INPUT_TIDAK_VALID", "eventId dan qty wajib bilangan bulat positif"));
    }

    // UPDATE bersyarat atomik — cek dan kurangi dalam SATU perintah, tanpa race condition
    const { rows } = await pool.query(
      `UPDATE events SET kursi_tersisa = kursi_tersisa - $1
       WHERE id = $2 AND kursi_tersisa >= $1 AND status = 'aktif'
       RETURNING id, nama, kursi_tersisa, harga`,
      [qty, eventId]
    );

    if (rows.length === 0) {
      const ada = await pool.query("SELECT status FROM events WHERE id = $1", [eventId]);
      if (!ada.rows.length) return res.status(404).json(galat("EVENT_TIDAK_ADA", "Event tidak ditemukan"));
      if (ada.rows[0].status !== "aktif") return res.status(409).json(galat("EVENT_TIDAK_AKTIF", "Event tidak aktif"));
      return res.status(409).json(galat("KURSI_HABIS", "Kursi habis atau tidak mencukupi"));
    }

    // Catat pergerakan kursi di audit trail
    pool.query(
      "INSERT INTO seat_movements (event_id, delta, keterangan) VALUES ($1, $2, 'lock via ticket-service')",
      [eventId, -qty]
    ).catch(e => console.error("seat_movement:", e.message));

    // Invalidasi cache Redis daftar event karena kursi_tersisa berubah
    if (redis) {
      const keys = await redis.keys("events:*");
      if (keys.length) await redis.del(keys);
    }

    res.json({ eventId, kursiTersisa: rows[0].kursi_tersisa, harga: rows[0].harga, nama: rows[0].nama });
  } catch (e) {
    console.error(e);
    res.status(500).json(galat("SERVER_ERROR", "Terjadi kesalahan server"));
  }
});

// POST /users — daftarkan pengguna baru (register)
app.post("/users", async (req, res) => {
  const { nama, email, telepon, password } = req.body;
  if (!nama || !email || !password) {
    return res.status(400).json(galat("DATA_TIDAK_LENGKAP", "nama, email, dan password wajib diisi"));
  }
  if (password.length < 6) {
    return res.status(400).json(galat("PASSWORD_TERLALU_PENDEK", "Password minimal 6 karakter"));
  }
  try {
    const { rows } = await pool.query(
      "INSERT INTO users (nama, email, telepon, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, nama, email, telepon, dibuat_pada",
      [nama, email, telepon || null, hashPw(password)]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json(galat("EMAIL_SUDAH_TERDAFTAR", "Email sudah dipakai"));
    console.error(e);
    res.status(500).json(galat("SERVER_ERROR", "Terjadi kesalahan server"));
  }
});

// POST /login — autentikasi pengguna
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json(galat("DATA_TIDAK_LENGKAP", "email dan password wajib diisi"));
  }
  try {
    const { rows } = await pool.query(
      "SELECT id, nama, email, telepon FROM users WHERE email = $1 AND password_hash = $2",
      [email, hashPw(password)]
    );
    if (!rows.length) {
      return res.status(401).json(galat("KREDENSIAL_SALAH", "Email atau password salah"));
    }
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json(galat("SERVER_ERROR", "Terjadi kesalahan server"));
  }
});

// GET /users/:id — data pengguna
app.get("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { rows } = await pool.query(
      "SELECT id, nama, email, telepon, dibuat_pada FROM users WHERE id = $1",
      [id]
    );
    if (!rows.length) return res.status(404).json(galat("USER_TIDAK_ADA", "Pengguna tidak ditemukan"));
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json(galat("SERVER_ERROR", "Terjadi kesalahan server"));
  }
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "event-service" });
  } catch (e) {
    res.status(503).json({ status: "error", message: e.message });
  }
});

async function main() {
  await initSchema();
  await seed();
  await connectRedis();
  app.listen(PORT, () => console.log(`event-service berjalan di port ${PORT}`));
}

main().catch((e) => { console.error(e); process.exit(1); });

const express = require("express");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { createClient } = require("redis");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const galat = (code, message) => ({ error: { code, message } });

// Redis cache-aside: data events jarang berubah, cocok di-cache
let redis = null;
async function connectRedis() {
  try {
    redis = createClient({ url: process.env.REDIS_URL || "redis://redis:6379" });
    redis.on("error", (e) => console.error("Redis error:", e.message));
    await redis.connect();
    console.log("event-service: Redis terhubung");
  } catch (e) {
    console.warn("event-service: Redis tidak tersedia, lanjut tanpa cache:", e.message);
    redis = null;
  }
}

// Jalankan migrasi maju-saja sebelum server siap menerima request
async function initSchema() {
  const migrDir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrDir).filter(f => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrDir, file), "utf8");
    await pool.query(sql);
    console.log(`event-service: migrasi ${file} selesai`);
  }
}

// Seed data contoh — dibungkus try/catch agar gagal seed tidak mematikan layanan
async function seed() {
  try {
    const { rowCount } = await pool.query("SELECT 1 FROM events LIMIT 1");
    if (rowCount > 0) return; // sudah ada data, lewati
    await pool.query(`
      INSERT INTO events (nama, tanggal, venue, kota, harga, kursi_total, kursi_tersisa) VALUES
        ('Konser Spektakuler A', '2026-09-01', 'Gelora Bung Karno', 'Jakarta',  250000, 500, 500),
        ('Festival Musik B',     '2026-09-15', 'Balai Kartini',     'Jakarta',  150000, 200, 200),
        ('Gala Night C',         '2026-10-05', 'ICE BSD',           'Tangerang',200000, 100, 100),
        ('Rock Fest D',          '2026-10-20', 'Lapangan Banteng',  'Jakarta',  175000, 800, 800)
    `);
    // Seed satu user contoh
    await pool.query(`
      INSERT INTO users (nama, email, telepon) VALUES
        ('Budi Santoso',  'budi@example.com',  '081234567890'),
        ('Sari Dewi',     'sari@example.com',  '082345678901'),
        ('Ahmad Fauzi',   'ahmad@example.com', '083456789012')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log("event-service: seed selesai");
  } catch (e) {
    console.warn("event-service: seed gagal (data mungkin sudah ada):", e.message);
  }
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

// POST /users — daftarkan pengguna baru
app.post("/users", async (req, res) => {
  const { nama, email, telepon } = req.body;
  if (!nama || !email) {
    return res.status(400).json(galat("DATA_TIDAK_LENGKAP", "nama dan email wajib diisi"));
  }
  try {
    const { rows } = await pool.query(
      "INSERT INTO users (nama, email, telepon) VALUES ($1, $2, $3) RETURNING id, nama, email, telepon, dibuat_pada",
      [nama, email, telepon || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json(galat("EMAIL_SUDAH_TERDAFTAR", "Email sudah dipakai"));
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

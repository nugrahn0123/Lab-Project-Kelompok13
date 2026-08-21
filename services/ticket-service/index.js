const express = require("express");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { createClient } = require("redis");
const http = require("http");
// Load .env dari root project jika DATABASE_URL belum di-set (lokal tanpa Docker)
if (!process.env.DATABASE_URL) {
  require("dotenv").config({ path: path.join(__dirname, "../../.env") });
}

// Set search_path via PostgreSQL startup option — tidak ada race condition
const _dbUrl = new URL(process.env.DATABASE_URL);
_dbUrl.searchParams.set('options', '-c search_path=ticket_db,public');
const pool = new Pool({
  connectionString: _dbUrl.toString(),
  ssl: { rejectUnauthorized: false },
});
const app = express();
const PORT = process.env.PORT || 3002;
//okkk
app.use(express.json()); 

const galat = (code, message) => ({ error: { code, message } });

// Redis: sumber kebenaran sementara untuk sisa stok (cache-stampede-safe)
let redis = null;
async function connectRedis() {
  try {
    redis = createClient({
      url: process.env.REDIS_URL || "redis://redis:6379",
      socket: { reconnectStrategy: false }, // fail fast jika Redis tidak ada
    });
    redis.on("error", () => {}); // suppress retry errors
    await redis.connect();
    console.log("ticket-service: Redis terhubung");
  } catch (e) {
    console.warn("ticket-service: Redis tidak tersedia, lanjut tanpa cache");
    redis = null;
  }
}

// Lua script atomik: kurangi stok Redis hanya jika cukup
// Mengembalikan sisa baru, -1 jika key tidak ada, -2 jika stok tidak cukup
const luaDecrBy = `
local sisa = tonumber(redis.call('GET', KEYS[1]))
if sisa == nil then return -1 end
if sisa < tonumber(ARGV[1]) then return -2 end
return redis.call('DECRBY', KEYS[1], ARGV[1])
`;

// Advisory lock (1002) mencegah race condition saat 3 replika startup bersamaan
async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(1002)');
    await client.query('CREATE SCHEMA IF NOT EXISTS ticket_db');
    await client.query('SET search_path TO ticket_db, public');
    const migrDir = path.join(__dirname, "migrations");
    const files = fs.readdirSync(migrDir).filter(f => f.endsWith(".sql")).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrDir, file), "utf8");
      await client.query(sql);
      console.log(`ticket-service: migrasi ${file} selesai`);
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(1002)');
    client.release();
  }
}

// Kirim notifikasi ke notification-service secara fire-and-forget
function kirimNotifikasi(userId, jenis, payload) {
  const notifUrl = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3004";
  const body = JSON.stringify({ userId, jenis, saluran: "email", payload });
  const url = new URL("/notifications", notifUrl);
  const req = http.request({ hostname: url.hostname, port: url.port || 3004, path: "/notifications", method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
  });
  req.on("error", (e) => console.warn("notifikasi gagal dikirim:", e.message));
  req.write(body);
  req.end();
}

// POST /events/:id/lock — kunci kursi & buat pesanan (sumber daya rebutan)
// Body: { qty, userId, hargaSatuan, Idempotency-Key header }
app.post("/events/:id/lock", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const qty = Number(req.body.qty);
    const userId = parseInt(req.body.userId);
    const hargaSatuan = parseFloat(req.body.hargaSatuan) || 0;
    const idempotencyKey = req.headers["idempotency-key"];

    if (!Number.isInteger(eventId) || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json(galat("INPUT_TIDAK_VALID", "eventId dan qty wajib bilangan bulat positif"));
    }
    if (!userId || isNaN(userId)) {
      return res.status(400).json(galat("USER_WAJIB", "userId wajib diisi"));
    }

    // Lapisan 3 (Mobile): idempotency — cek di DB dulu
    if (idempotencyKey) {
      const sudah = await pool.query(
        "SELECT respons FROM idempotency WHERE key = $1",
        [idempotencyKey]
      );
      if (sudah.rows.length) return res.json(sudah.rows[0].respons);
    }

    // Cache-aside: coba kurangi stok di Redis atomik via Lua
    if (redis) {
      const stockKey = `stock:${eventId}`;
      const cached = await redis.get(stockKey);
      if (cached !== null) {
        const sisa = await redis.eval(luaDecrBy, { keys: [stockKey], arguments: [String(qty)] });
        if (Number(sisa) === -2) {
          return res.status(409).json(galat("KURSI_HABIS", "Kursi habis atau tidak mencukupi"));
        }
        if (Number(sisa) >= 0) {
          const pesananRow = await pool.query(
            `INSERT INTO pesanan (user_id, event_id, qty, harga_satuan, idempotency_key)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, total_harga`,
            [userId, eventId, qty, hargaSatuan, idempotencyKey || null]
          );
          const respons = {
            pesananId: pesananRow.rows[0].id,
            eventId, userId, qty,
            totalHarga: pesananRow.rows[0].total_harga,
            kursiTersisa: Number(sisa),
            status: "menunggu_pembayaran",
          };
          if (idempotencyKey) {
            pool.query(
              "INSERT INTO idempotency (key, respons) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
              [idempotencyKey, JSON.stringify(respons)]
            ).catch(() => {});
          }
          kirimNotifikasi(userId, "tiket_dipesan", { eventId, qty, pesananId: respons.pesananId });
          return res.status(201).json(respons);
        }
        // sisa === -1: key hilang dari Redis, fallback ke DB
      }
    }

    // Pola DB-only BENAR — UPDATE bersyarat atomik di event_db lewat event-service
    // Di ticket_db tidak ada tabel events; hubungi event-service via HTTP
    // Jika URL event-service tersedia, lakukan lock via API; jika tidak, tolak
    const eventUrl = process.env.EVENT_SERVICE_URL;
    if (!eventUrl) {
      return res.status(503).json(galat("SERVICE_TIDAK_TERSEDIA", "event-service tidak terkonfigurasi"));
    }

    // Panggil event-service untuk kurangi kursi_tersisa atomik
    const lockResp = await fetch(`${eventUrl}/events/${eventId}/lock-internal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty }),
    }).catch(() => null);

    if (!lockResp || !lockResp.ok) {
      const errBody = lockResp ? await lockResp.json().catch(() => ({})) : {};
      const status = lockResp ? lockResp.status : 503;
      return res.status(status).json(errBody.error
        ? errBody
        : galat("KURSI_HABIS", "Kursi habis atau event tidak ditemukan")
      );
    }

    const eventData = await lockResp.json();

    // Buat pesanan di ticket_db
    const pesananRow = await pool.query(
      `INSERT INTO pesanan (user_id, event_id, qty, harga_satuan, idempotency_key)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, total_harga`,
      [userId, eventId, qty, hargaSatuan, idempotencyKey || null]
    );

    const respons = {
      pesananId: pesananRow.rows[0].id,
      eventId, userId, qty,
      totalHarga: pesananRow.rows[0].total_harga,
      kursiTersisa: eventData.kursiTersisa,
      status: "menunggu_pembayaran",
    };

    if (idempotencyKey) {
      await pool.query(
        "INSERT INTO idempotency (key, respons) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
        [idempotencyKey, JSON.stringify(respons)]
      );
    }
    if (redis) {
      await redis.set(`stock:${eventId}`, String(eventData.kursiTersisa), { EX: 300 });
    }

    kirimNotifikasi(userId, "tiket_dipesan", { eventId, qty, pesananId: respons.pesananId });
    res.status(201).json(respons);
  } catch (e) {
    console.error(e);
    res.status(500).json(galat("SERVER_ERROR", "Terjadi kesalahan server"));
  }
});

// PATCH /pesanan/:id/status — dipakai payment-service setelah bayar berhasil
app.patch("/pesanan/:id/status", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, userId } = req.body;
  const statusValid = ["dibayar","dibatalkan","dikembalikan"];
  if (!statusValid.includes(status)) {
    return res.status(400).json(galat("STATUS_TIDAK_VALID", `status harus salah satu dari: ${statusValid.join(", ")}`));
  }
  try {
    const { rows } = await pool.query(
      `UPDATE pesanan SET status = $1, diperbarui_pada = now() WHERE id = $2 RETURNING id, status`,
      [status, id]
    );
    if (!rows.length) return res.status(404).json(galat("PESANAN_TIDAK_ADA", "Pesanan tidak ditemukan"));

    // Generate tiket individual setelah dibayar
    if (status === "dibayar") {
      const pesanan = await pool.query("SELECT * FROM pesanan WHERE id = $1", [id]);
      const p = pesanan.rows[0];
      for (let i = 0; i < p.qty; i++) {
        const kodeQr = `QR-${id}-${i+1}-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
        await pool.query(
          "INSERT INTO tikets (pesanan_id, user_id, event_id, kode_qr) VALUES ($1, $2, $3, $4)",
          [id, p.user_id, p.event_id, kodeQr]
        );
      }
      if (userId) kirimNotifikasi(userId, "tiket_siap", { pesananId: id });
    }

    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json(galat("SERVER_ERROR", "Terjadi kesalahan server"));
  }
});

// GET /tickets — daftar tiket pengguna berpaginasi (Lapisan 3: keyset)
app.get("/tickets", async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 20));
    const userId = parseInt(req.query.userId) || null;

    let baseWhere = userId ? "WHERE t.user_id = $3" : "";
    let baseParams = [limit];

    if (req.query.after !== undefined) {
      const afterId = parseInt(req.query.after) || 0;
      const q = userId
        ? "SELECT t.id, t.pesanan_id, t.event_id, t.kode_qr, t.status, t.dibuat_pada FROM tikets t WHERE t.user_id = $3 AND t.id > $1 ORDER BY t.id LIMIT $2"
        : "SELECT t.id, t.pesanan_id, t.event_id, t.kode_qr, t.status, t.dibuat_pada FROM tikets t WHERE t.id > $1 ORDER BY t.id LIMIT $2";
      const params = userId ? [afterId, limit, userId] : [afterId, limit];
      const { rows } = await pool.query(q, params);
      const total = (await pool.query(
        userId ? "SELECT COUNT(*)::int AS n FROM tikets WHERE user_id = $1" : "SELECT COUNT(*)::int AS n FROM tikets",
        userId ? [userId] : []
      )).rows[0].n;
      return res.json({ data: rows, limit, total, items: rows.length });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const q = userId
      ? "SELECT id, pesanan_id, event_id, kode_qr, status, dibuat_pada FROM tikets WHERE user_id = $3 ORDER BY id LIMIT $1 OFFSET $2"
      : "SELECT id, pesanan_id, event_id, kode_qr, status, dibuat_pada FROM tikets ORDER BY id LIMIT $1 OFFSET $2";
    const params = userId ? [limit, offset, userId] : [limit, offset];
    const { rows } = await pool.query(q, params);
    const total = (await pool.query(
      userId ? "SELECT COUNT(*)::int AS n FROM tikets WHERE user_id = $1" : "SELECT COUNT(*)::int AS n FROM tikets",
      userId ? [userId] : []
    )).rows[0].n;
    res.json({ data: rows, page, limit, total });
  } catch (e) {
    console.error(e);
    res.status(500).json(galat("SERVER_ERROR", "Terjadi kesalahan server"));
  }
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "ticket-service" });
  } catch (e) {
    res.status(503).json({ status: "error", message: e.message });
  }
});

async function main() {
  await initSchema();
  await connectRedis();
  app.listen(PORT, () => console.log(`ticket-service berjalan di port ${PORT}`));
}

main().catch((e) => { console.error(e); process.exit(1); });

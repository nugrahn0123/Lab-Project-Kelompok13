const express = require("express");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { createClient } = require("redis");
// Load .env dari root project jika DATABASE_URL belum di-set (lokal tanpa Docker)
if (!process.env.DATABASE_URL) {
  require("dotenv").config({ path: path.join(__dirname, "../../.env") });
}

// Set search_path via PostgreSQL startup option — tidak ada race condition
const _dbUrl = new URL(process.env.DATABASE_URL);
_dbUrl.searchParams.set('options', '-c search_path=notification_db,public');
const pool = new Pool({
  connectionString: _dbUrl.toString(),
  ssl: { rejectUnauthorized: false },
});
const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

let redis = null;
async function connectRedis() {
  try {
    redis = createClient({
      url: process.env.REDIS_URL || "redis://redis:6379",
      socket: { reconnectStrategy: false }, // fail fast jika Redis tidak ada
    });
    redis.on("error", () => {}); // suppress retry errors
    await redis.connect();
    console.log("notification-service: Redis terhubung");
  } catch (e) {
    console.warn("notification-service: Redis tidak tersedia");
    redis = null;
  }
}

// Advisory lock (1004) mencegah race condition saat 3 replika startup bersamaan
async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(1004)');
    await client.query('CREATE SCHEMA IF NOT EXISTS notification_db');
    await client.query('SET search_path TO notification_db, public');
    const migrDir = path.join(__dirname, "migrations");
    const files = fs.readdirSync(migrDir).filter(f => f.endsWith(".sql")).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrDir, file), "utf8");
      await client.query(sql);
      console.log(`notification-service: migrasi ${file} selesai`);
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(1004)');
    client.release();
  }
}

// POST /notifications — terima event dari layanan lain dan catat ke DB
// Body: { userId, jenis, saluran, payload }
app.post("/notifications", async (req, res) => {
  const { userId, jenis, saluran = "email", payload = {} } = req.body;

  const jenisValid = ["tiket_dipesan","pembayaran_berhasil","pembayaran_gagal","tiket_siap","pengingat_konser","pesanan_dibatalkan"];
  const saluranValid = ["email","push","sms"];

  if (!userId || !jenis) {
    return res.status(400).json({ error: { code: "DATA_TIDAK_LENGKAP", message: "userId dan jenis wajib diisi" } });
  }
  if (!jenisValid.includes(jenis)) {
    return res.status(400).json({ error: { code: "JENIS_TIDAK_VALID", message: `jenis harus salah satu dari: ${jenisValid.join(", ")}` } });
  }
  if (!saluranValid.includes(saluran)) {
    return res.status(400).json({ error: { code: "SALURAN_TIDAK_VALID", message: `saluran harus salah satu dari: ${saluranValid.join(", ")}` } });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO notifikasi (user_id, jenis, saluran, payload, status)
       VALUES ($1, $2, $3, $4, 'antrian')
       RETURNING id, user_id, jenis, saluran, status, dibuat_pada`,
      [userId, jenis, saluran, JSON.stringify(payload)]
    );

    // Simulasi kirim notifikasi — update status ke 'terkirim'
    await pool.query(
      "UPDATE notifikasi SET status = 'terkirim', percobaan = 1, dikirim_pada = now() WHERE id = $1",
      [rows[0].id]
    );

    console.log(`Notifikasi [${jenis}] terkirim ke user ${userId} via ${saluran}`, payload);
    res.status(202).json({ status: "diterima", id: rows[0].id, jenis, saluran });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Terjadi kesalahan server" } });
  }
});

// GET /notifications?userId=x — riwayat notifikasi pengguna (Lapisan 3: keyset)
app.get("/notifications", async (req, res) => {
  const userId = parseInt(req.query.userId);
  if (!userId) return res.status(400).json({ error: { code: "USER_WAJIB", message: "userId wajib diisi" } });

  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 20));
  try {
    const afterId = parseInt(req.query.after) || 0;
    const { rows } = await pool.query(
      "SELECT id, jenis, saluran, status, dikirim_pada, dibuat_pada FROM notifikasi WHERE user_id = $1 AND id > $2 ORDER BY id LIMIT $3",
      [userId, afterId, limit]
    );
    res.json({ data: rows, limit, items: rows.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Terjadi kesalahan server" } });
  }
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "notification-service" });
  } catch (e) {
    res.status(503).json({ status: "error", message: e.message });
  }
});

async function main() {
  await initSchema();
  await connectRedis();
  app.listen(PORT, () => console.log(`notification-service berjalan di port ${PORT}`));
}

main().catch((e) => { console.error(e); process.exit(1); });

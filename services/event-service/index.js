const express = require("express");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const galat = (code, message) => ({ error: { code, message } });

// GET /events — daftar konser berpaginasi
app.get("/events", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(
      "SELECT id, nama, tanggal, venue, kursi_tersisa FROM events ORDER BY id LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    const total = (await pool.query("SELECT COUNT(*)::int AS n FROM events")).rows[0].n;
    res.json({ data: rows, page, limit, total });
  } catch (e) {
    res.status(500).json(galat("SERVER_ERROR", "Terjadi kesalahan server"));
  }
});

app.listen(PORT, () => {
  console.log(`event-service berjalan di port ${PORT}`);
});

const express = require("express");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

const galat = (code, message) => ({ error: { code, message } });

// POST /events/:id/lock — kunci kursi secara atomik (sumber daya rebutan)
app.post("/events/:id/lock", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const qty = Number(req.body.qty);
    const idempotencyKey = req.headers["idempotency-key"];

    if (!Number.isInteger(eventId) || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json(galat("INPUT_TIDAK_VALID", "eventId dan qty wajib bilangan bulat positif"));
    }

    // Idempotency: kembalikan hasil lama jika key sama sudah pernah diproses
    if (idempotencyKey) {
      const sudah = await pool.query(
        "SELECT respons FROM idempotency WHERE key = $1",
        [idempotencyKey]
      );
      if (sudah.rows.length) return res.json(sudah.rows[0].respons);
    }

    // Pola BENAR — cek dan kurangi kursi dalam SATU perintah atomik
    const { rows } = await pool.query(
      "UPDATE events SET kursi_tersisa = kursi_tersisa - $1 WHERE id = $2 AND kursi_tersisa >= $1 RETURNING nama, kursi_tersisa",
      [qty, eventId]
    );

    if (rows.length === 0) {
      const ada = await pool.query("SELECT 1 FROM events WHERE id = $1", [eventId]);
      if (ada.rowCount === 0) return res.status(404).json(galat("EVENT_TIDAK_ADA", "Event tidak ditemukan"));
      return res.status(409).json(galat("KURSI_HABIS", "Kursi habis atau tidak mencukupi"));
    }

    const tiket = {
      id: Date.now(),
      eventId,
      qty,
      eventNama: rows[0].nama,
      kursiTersisa: rows[0].kursi_tersisa,
    };

    if (idempotencyKey) {
      await pool.query(
        "INSERT INTO idempotency (key, respons) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
        [idempotencyKey, tiket]
      );
    }

    res.status(201).json(tiket);
  } catch (e) {
    res.status(500).json(galat("SERVER_ERROR", "Terjadi kesalahan server"));
  }
});

// GET /tickets — daftar tiket berpaginasi
app.get("/tickets", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(
      "SELECT id, event_id, qty, dibuat_pada FROM tikets ORDER BY id LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    const total = (await pool.query("SELECT COUNT(*)::int AS n FROM tikets")).rows[0].n;
    res.json({ data: rows, page, limit, total });
  } catch (e) {
    res.status(500).json(galat("SERVER_ERROR", "Terjadi kesalahan server"));
  }
});

app.listen(PORT, () => {
  console.log(`ticket-service berjalan di port ${PORT}`);
});

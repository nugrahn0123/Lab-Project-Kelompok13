const express = require("express");
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// POST /events/:id/lock — kunci kursi (sumber daya rebutan)
app.post("/events/:id/lock", (req, res) => {
  const eventId = parseInt(req.params.id);
  const { qty } = req.body;

  if (!qty || qty < 1) {
    return res.status(400).json({ error: { code: "QTY_TIDAK_VALID", message: "qty minimal 1" } });
  }

  // TODO: cek ketersediaan kursi dan kunci — kembalikan 409 jika habis
  // Contoh respons 409:
  // return res.status(409).json({ error: { code: "KURSI_HABIS", message: "Kursi habis atau pesanan bentrok" } });

  res.status(201).json({ id: 1, eventId, qty, total: 0 });
});

// GET /tickets — daftar tiket pengguna
app.get("/tickets", (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  // TODO: ganti dengan query database
  res.json({ data: [], page, limit, total: 0 });
});

app.listen(PORT, () => {
  console.log(`ticket-service berjalan di port ${PORT}`);
});

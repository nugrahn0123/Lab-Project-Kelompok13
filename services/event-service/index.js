const express = require("express");
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// GET /events — daftar konser berpaginasi
app.get("/events", (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  // TODO: ganti dengan query database
  res.json({ data: [], page, limit, total: 0 });
});

app.listen(PORT, () => {
  console.log(`event-service berjalan di port ${PORT}`);
});

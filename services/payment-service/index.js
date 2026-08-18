const express = require("express");
const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

// POST /payments — proses pembayaran tiket
app.post("/payments", (req, res) => {
  const { orderId, metode } = req.body;

  if (!orderId || !metode) {
    return res.status(400).json({ error: { code: "DATA_TIDAK_LENGKAP", message: "orderId dan metode wajib diisi" } });
  }

  const metodeDiizinkan = ["transfer", "kartu", "dompet"];
  if (!metodeDiizinkan.includes(metode)) {
    return res.status(400).json({ error: { code: "METODE_TIDAK_VALID", message: "metode harus salah satu dari: transfer, kartu, dompet" } });
  }

  // TODO: validasi orderId dan proses pembayaran — 409 jika sudah dibayar
  // Contoh respons 409:
  // return res.status(409).json({ error: { code: "PESANAN_TIDAK_VALID", message: "Pesanan tidak valid atau sudah dibayar" } });

  res.status(201).json({ id: 1, orderId, status: "berhasil", dibayarPada: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`payment-service berjalan di port ${PORT}`);
});

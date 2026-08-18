const express = require("express");
const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

// POST /notifications — terima event dari ticket-service
app.post("/notifications", (req, res) => {
  const { event, payload } = req.body;

  // TODO: kirim email/push notification berdasarkan event
  console.log(`Notifikasi diterima — event: ${event}`, payload);

  res.status(202).json({ status: "diterima" });
});

app.listen(PORT, () => {
  console.log(`notification-service berjalan di port ${PORT}`);
});

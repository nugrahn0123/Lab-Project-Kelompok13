const express = require("express");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
// Load .env dari root project jika DATABASE_URL belum di-set (lokal tanpa Docker)
if (!process.env.DATABASE_URL) {
  require("dotenv").config({ path: path.join(__dirname, "../../.env") });
}

// Set search_path via PostgreSQL startup option — tidak ada race condition
const _dbUrl = new URL(process.env.DATABASE_URL);
_dbUrl.searchParams.set('options', '-c search_path=payment_db,public');
const pool = new Pool({
  connectionString: _dbUrl.toString(),
  ssl: { rejectUnauthorized: false },
});
const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

const galat = (code, message) => ({ error: { code, message } });

// Advisory lock (1003) mencegah race condition saat 3 replika startup bersamaan
async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(1003)');
    const migrDir = path.join(__dirname, "migrations");
    const files = fs.readdirSync(migrDir).filter(f => f.endsWith(".sql")).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrDir, file), "utf8");
      await client.query(sql);
      console.log(`payment-service: migrasi ${file} selesai`);
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(1003)');
    client.release();
  }
}

// POST /payments — proses pembayaran tiket
// Body: { pesananId, userId, jumlah, metode }
app.post("/payments", async (req, res) => {
  const { pesananId, userId, jumlah, metode } = req.body;

  if (!pesananId || !userId || !jumlah || !metode) {
    return res.status(400).json(galat("DATA_TIDAK_LENGKAP", "pesananId, userId, jumlah, dan metode wajib diisi"));
  }

  const metodeDiizinkan = ["transfer", "kartu", "dompet"];
  if (!metodeDiizinkan.includes(metode)) {
    return res.status(400).json(galat("METODE_TIDAK_VALID", "metode harus salah satu dari: transfer, kartu, dompet"));
  }

  try {
    // Cek apakah pesanan ini sudah pernah dibayar (409 jika sudah)
    const sudah = await pool.query(
      "SELECT id, status FROM pembayaran WHERE pesanan_id = $1",
      [pesananId]
    );
    if (sudah.rows.length > 0 && sudah.rows[0].status === "berhasil") {
      return res.status(409).json(galat("SUDAH_DIBAYAR", "Pesanan ini sudah dibayar sebelumnya"));
    }

    const referensiExt = `EXT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const { rows } = await pool.query(
      `INSERT INTO pembayaran (pesanan_id, user_id, jumlah, metode, status, referensi_ext, dibayar_pada)
       VALUES ($1, $2, $3, $4, 'berhasil', $5, now())
       ON CONFLICT (pesanan_id) DO UPDATE
         SET status = 'berhasil', dibayar_pada = now(), referensi_ext = EXCLUDED.referensi_ext
       RETURNING id, pesanan_id, jumlah, metode, status, referensi_ext, dibayar_pada`,
      [pesananId, userId, jumlah, metode, referensiExt]
    );
    const bayar = rows[0];

    // Terbitkan invoice
    const nomorInvoice = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${String(bayar.id).padStart(4,"0")}`;
    const invRows = await pool.query(
      `INSERT INTO invoices (pembayaran_id, user_id, nomor_invoice, total)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (nomor_invoice) DO NOTHING
       RETURNING id, nomor_invoice`,
      [bayar.id, userId, nomorInvoice, jumlah]
    );

    // Beritahu ticket-service untuk update status pesanan → 'dibayar' dan generate tiket
    const ticketUrl = process.env.TICKET_SERVICE_URL || "http://ticket-service:3002";
    fetch(`${ticketUrl}/pesanan/${pesananId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dibayar", userId }),
    }).catch(e => console.warn("PATCH pesanan status gagal:", e.message));

    res.status(201).json({
      id: bayar.id,
      pesananId: bayar.pesanan_id,
      status: bayar.status,
      metode: bayar.metode,
      jumlah: bayar.jumlah,
      referensiExt: bayar.referensi_ext,
      dibayarPada: bayar.dibayar_pada,
      invoice: invRows.rows[0] || { nomor_invoice: nomorInvoice },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json(galat("SERVER_ERROR", "Terjadi kesalahan server"));
  }
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "payment-service" });
  } catch (e) {
    res.status(503).json({ status: "error", message: e.message });
  }
});

async function main() {
  await initSchema();
  app.listen(PORT, () => console.log(`payment-service berjalan di port ${PORT}`));
}

main().catch((e) => { console.error(e); process.exit(1); });

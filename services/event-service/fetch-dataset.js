// fetch-dataset.js — jalankan SEKALI untuk ambil data dari Eventbrite
// Cara pakai:
//   1. Buat file .env dan isi EVENTBRITE_TOKEN=token_kamu
//   2. node fetch-dataset.js
//   3. Hasil tersimpan di dataset.json

const https = require("https");
const fs = require("fs");
const path = require("path");

// Baca token dari .env manual (tanpa library dotenv)
const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.error("ERROR: file .env tidak ditemukan. Buat dulu dari .env.example");
  process.exit(1);
}
const envContent = fs.readFileSync(envPath, "utf8");
const tokenMatch = envContent.match(/EVENTBRITE_TOKEN=(.+)/);
if (!tokenMatch) {
  console.error("ERROR: EVENTBRITE_TOKEN tidak ditemukan di .env");
  process.exit(1);
}
const TOKEN = tokenMatch[1].trim();

// Parameter pencarian: event di Makassar dalam radius 50km
const params = new URLSearchParams({
  "location.address": "Makassar, Sulawesi Selatan, Indonesia",
  "location.within": "50km",
  "expand": "venue,ticket_classes",
  "page_size": "50",
});

const options = {
  hostname: "www.eventbriteapi.com",
  path: `/v3/events/search/?${params.toString()}`,
  method: "GET",
  headers: {
    "Authorization": `Bearer ${TOKEN}`,
    "Accept": "application/json",
  },
};

console.log("Mengambil data event dari Eventbrite...");
console.log(`Lokasi: Makassar, radius 50km\n`);

const req = https.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => { data += chunk; });

  res.on("end", () => {
    if (res.statusCode !== 200) {
      console.error(`HTTP ${res.statusCode}:`, data);
      process.exit(1);
    }

    const json = JSON.parse(data);
    const events = json.events || [];

    if (events.length === 0) {
      console.log("Tidak ada event ditemukan di Eventbrite untuk wilayah Makassar.");
      console.log("Gunakan seed.js sebagai gantinya.");
      process.exit(0);
    }

    // Transformasi ke format schema openapi.yaml kita
    const dataset = events.map((e, i) => ({
      id: i + 1,
      nama: e.name?.text || "Tanpa Nama",
      tanggal: e.start?.local?.split("T")[0] || null,
      venue: e.venue?.name || e.venue?.address?.city || "Makassar",
      harga: e.ticket_classes?.[0]?.cost?.value
        ? Math.round(e.ticket_classes[0].cost.value / 100)
        : 0,
      sisa: e.capacity_is_custom ? (e.capacity || 100) : 100,
    }));

    fs.writeFileSync(
      path.join(__dirname, "dataset.json"),
      JSON.stringify(dataset, null, 2),
      "utf8"
    );

    console.log(`Berhasil! ${dataset.length} event tersimpan di dataset.json`);
    console.log("\nContoh data pertama:");
    console.log(JSON.stringify(dataset[0], null, 2));
  });
});

req.on("error", (e) => {
  console.error("Gagal koneksi:", e.message);
});

req.end();

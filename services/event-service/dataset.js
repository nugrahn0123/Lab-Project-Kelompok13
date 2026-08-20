// seed.js — data konser realistis wilayah Makassar & Sulawesi Selatan
// Jalankan: node seed.js

const fs = require("fs");
const path = require("path");

const dataset = [
  // ── Arsip 2025 – Jan s/d Jul 2026 (sudah lewat, tiket habis) ────────────
  { id: 1,  nama: "Dewa 19 Reunion Tour — Makassar",                    tanggal: "2025-03-15", venue: "Celebes Convention Center (CCC), Makassar", harga: 350000, sisa: 0 },
  { id: 2,  nama: "Westlife The Wild Dreams Tour — Makassar",           tanggal: "2025-05-10", venue: "Lapangan Karebosi, Makassar",                harga: 850000, sisa: 0 },
  { id: 3,  nama: "Tulus — Manusia Tour Makassar",                      tanggal: "2025-07-21", venue: "Trans Studio Makassar",                      harga: 450000, sisa: 0 },
  { id: 4,  nama: "Raisa — Batas Imaji Concert",                        tanggal: "2025-09-05", venue: "Celebes Convention Center (CCC), Makassar", harga: 550000, sisa: 0 },
  { id: 5,  nama: "Iwan Fals & OI — Konser Anak Negeri",                tanggal: "2025-10-17", venue: "Lapangan Karebosi, Makassar",                harga: 150000, sisa: 0 },
  { id: 6,  nama: "Noah — Keterpisahan Tour",                           tanggal: "2025-11-08", venue: "Gedung Serbaguna Phinisi, Makassar",         harga: 300000, sisa: 0 },
  { id: 7,  nama: "Hindia — Aku Bukan Filantropi Live",                 tanggal: "2025-11-22", venue: "Pantai Losari Outdoor Stage, Makassar",      harga: 200000, sisa: 0 },
  { id: 8,  nama: "Bernadya — Salam Perpisahan Tour",                   tanggal: "2025-12-06", venue: "Trans Studio Makassar",                      harga: 375000, sisa: 0 },
  { id: 9,  nama: "Sheila On 7 — Tunggu Aku di Jakarta (Makassar Leg)", tanggal: "2025-12-20", venue: "Celebes Convention Center (CCC), Makassar", harga: 400000, sisa: 0 },
  { id: 10, nama: "New Year Eve Concert — Makassar 2026",               tanggal: "2025-12-31", venue: "Lapangan Karebosi, Makassar",                harga: 125000, sisa: 0 },
  { id: 11, nama: "Kunto Aji — Mantra Mantra Tour Makassar",            tanggal: "2026-01-17", venue: "Trans Studio Makassar",                      harga: 220000, sisa: 0 },
  { id: 12, nama: "Isyana Sarasvati — Lexicon Live",                    tanggal: "2026-02-14", venue: "Gedung Serbaguna Phinisi, Makassar",         harga: 285000, sisa: 0 },
  { id: 13, nama: "Afgan — The Road Tour Makassar",                     tanggal: "2026-02-28", venue: "Celebes Convention Center (CCC), Makassar", harga: 395000, sisa: 0 },
  { id: 14, nama: "Weird Genius — Lathi Live Experience",               tanggal: "2026-03-14", venue: "Trans Studio Makassar",                      harga: 250000, sisa: 0 },
  { id: 15, nama: "Ariel NOAH Solo Concert",                            tanggal: "2026-03-28", venue: "Lapangan Karebosi, Makassar",                harga: 350000, sisa: 0 },
  { id: 16, nama: "Raisa — Hari Ini Tour Makassar",                     tanggal: "2026-04-11", venue: "Celebes Convention Center (CCC), Makassar", harga: 475000, sisa: 0 },
  { id: 17, nama: "Mocca — Friends Tour Makassar",                      tanggal: "2026-04-25", venue: "Trans Studio Makassar",                      harga: 165000, sisa: 0 },
  { id: 18, nama: "Kahitna — Cerita Cinta Tour",                        tanggal: "2026-05-09", venue: "Celebes Convention Center (CCC), Makassar", harga: 420000, sisa: 0 },
  { id: 19, nama: "Payung Teduh — Kucari Kamu Tour",                    tanggal: "2026-05-23", venue: "Gedung Serbaguna Phinisi, Makassar",         harga: 215000, sisa: 0 },
  { id: 20, nama: "Rizky Febian — Cuek Tour Makassar",                  tanggal: "2026-06-06", venue: "Trans Studio Makassar",                      harga: 315000, sisa: 0 },
  { id: 21, nama: "Sal Priadi — Gajah Live Makassar",                   tanggal: "2026-06-20", venue: "Pantai Losari Outdoor Stage, Makassar",      harga: 230000, sisa: 0 },
  { id: 22, nama: "Lyodra — Bila Tour Makassar",                        tanggal: "2026-07-04", venue: "Celebes Convention Center (CCC), Makassar", harga: 275000, sisa: 0 },
  { id: 23, nama: "Gilga Sahid — Lamunan Tour Makassar",                tanggal: "2026-07-18", venue: "Lapangan Karebosi, Makassar",                harga: 135000, sisa: 0 },

  // ── Agustus 2026 (sedang berlangsung / war tiket aktif) ──────────────────
  { id: 24, nama: "Pamungkas — To The Bone Live",                       tanggal: "2026-08-22", venue: "Trans Studio Makassar",                      harga: 275000, sisa: 4  },
  { id: 25, nama: "Maudy Ayunda — Perahu Kertas Anniversary Concert",   tanggal: "2026-08-29", venue: "Celebes Convention Center (CCC), Makassar", harga: 385000, sisa: 2  },

  // ── September – Desember 2026 (mendatang) ────────────────────────────────
  { id: 26, nama: "Yura Yunita — Merakit Concert Makassar",             tanggal: "2026-09-05", venue: "Pantai Losari Outdoor Stage, Makassar",      harga: 250000, sisa: 88  },
  { id: 27, nama: "Maliq & D'Essentials — Wavelength Tour",             tanggal: "2026-09-12", venue: "Trans Studio Makassar",                      harga: 325000, sisa: 7   },
  { id: 28, nama: "Nadin Amizah — Amin Paling Serius Tour",             tanggal: "2026-09-19", venue: "Gedung Serbaguna Phinisi, Makassar",         harga: 295000, sisa: 35  },
  { id: 29, nama: "Fourtwnty — Zona Nyaman Live Makassar",              tanggal: "2026-09-26", venue: "Pantai Losari Outdoor Stage, Makassar",      harga: 180000, sisa: 200 },
  { id: 30, nama: "Nadhif Basalamah — Hanya Manusia Live",              tanggal: "2026-10-03", venue: "Celebes Convention Center (CCC), Makassar", harga: 245000, sisa: 9   },
  { id: 31, nama: "Rendy Pandugo — My Way Tour",                        tanggal: "2026-10-10", venue: "Gedung Serbaguna Phinisi, Makassar",         harga: 225000, sisa: 55  },
  { id: 32, nama: "Stars and Rabbit — Live Makassar",                   tanggal: "2026-10-17", venue: "Pantai Losari Outdoor Stage, Makassar",      harga: 160000, sisa: 130 },
  { id: 33, nama: "Juicy Luicy — Tanpa Tergesa Live",                   tanggal: "2026-10-24", venue: "Trans Studio Makassar",                      harga: 210000, sisa: 23  },
  { id: 34, nama: "Fiersa Besari — Garis Waktu Tour",                   tanggal: "2026-10-31", venue: "Lapangan Karebosi, Makassar",                harga: 120000, sisa: 400 },
  { id: 35, nama: "Bunga Citra Lestari — Cinta Sejati Tour",            tanggal: "2026-11-07", venue: "Celebes Convention Center (CCC), Makassar", harga: 465000, sisa: 1   },
  { id: 36, nama: "Ardhito Pramono — Bitterlove Live Makassar",         tanggal: "2026-11-14", venue: "Gedung Serbaguna Phinisi, Makassar",         harga: 205000, sisa: 62  },
  { id: 37, nama: "Danilla — Peradaban Tour",                           tanggal: "2026-11-21", venue: "Pantai Losari Outdoor Stage, Makassar",      harga: 170000, sisa: 145 },
  { id: 38, nama: "Tipe-X — Ska Reggae Reunion Makassar",               tanggal: "2026-11-28", venue: "Trans Studio Makassar",                      harga: 175000, sisa: 90  },
  { id: 39, nama: "Endah N Rhesa — Roughly Happy Live",                 tanggal: "2026-12-05", venue: "Pantai Losari Outdoor Stage, Makassar",      harga: 150000, sisa: 180 },
  { id: 40, nama: "Indonesian Idol Grand Concert — Makassar",           tanggal: "2026-12-12", venue: "Lapangan Karebosi, Makassar",                harga: 100000, sisa: 750 },
  { id: 41, nama: "Pee Wee Gaskins — Dark Horses Tour Makassar",        tanggal: "2026-12-19", venue: "Gedung Serbaguna Phinisi, Makassar",         harga: 145000, sisa: 200 },
  { id: 42, nama: "New Year Eve Concert — Makassar 2027",               tanggal: "2026-12-31", venue: "Lapangan Karebosi, Makassar",                harga: 150000, sisa: 600 },

  // ── 2027 (akan datang) ────────────────────────────────────────────────────
  { id: 43, nama: "Tulus — Aku Bukan Filantropi Tour 2027",             tanggal: "2027-01-17", venue: "Celebes Convention Center (CCC), Makassar", harga: 500000, sisa: 300 },
  { id: 44, nama: "HiVi! — Satu-Satunya Tour 2027",                     tanggal: "2027-01-31", venue: "Trans Studio Makassar",                      harga: 195000, sisa: 250 },
  { id: 45, nama: "Elephant Kind — Beautiful Trance Tour",              tanggal: "2027-02-14", venue: "Gedung Serbaguna Phinisi, Makassar",         harga: 185000, sisa: 180 },
  { id: 46, nama: "Hindia — Live Makassar 2027",                        tanggal: "2027-02-28", venue: "Pantai Losari Outdoor Stage, Makassar",      harga: 220000, sisa: 320 },
  { id: 47, nama: "Bernadya — World Tour Makassar Stop",                tanggal: "2027-03-14", venue: "Celebes Convention Center (CCC), Makassar", harga: 425000, sisa: 150 },
  { id: 48, nama: "Feast — Beberapa Orang Memaafkan Live 2027",         tanggal: "2027-03-28", venue: "Trans Studio Makassar",                      harga: 140000, sisa: 280 },
  { id: 49, nama: "Sheila On 7 — 30th Anniversary Tour Makassar",       tanggal: "2027-04-10", venue: "Lapangan Karebosi, Makassar",                harga: 450000, sisa: 500 },
  { id: 50, nama: "White Shoes & The Couples Company — Live 2027",      tanggal: "2027-04-24", venue: "Gedung Serbaguna Phinisi, Makassar",         harga: 190000, sisa: 210 },
  { id: 51, nama: "Pamungkas — World Tour 2027 Makassar",               tanggal: "2027-05-08", venue: "Celebes Convention Center (CCC), Makassar", harga: 350000, sisa: 175 },
  { id: 52, nama: "Kunto Aji — Live Makassar 2027",                     tanggal: "2027-05-22", venue: "Trans Studio Makassar",                      harga: 240000, sisa: 300 },
  { id: 53, nama: "Ariel NOAH — Konser Spesial 2027",                   tanggal: "2027-06-05", venue: "Lapangan Karebosi, Makassar",                harga: 380000, sisa: 420 },
  { id: 54, nama: "Raisa — Aku Bukan Milikmu Tour 2027",                tanggal: "2027-06-19", venue: "Celebes Convention Center (CCC), Makassar", harga: 520000, sisa: 200 },
];

const outputPath = path.join(__dirname, "dataset.json");
fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2), "utf8");

console.log(`dataset.json berhasil dibuat — ${dataset.length} event`);
console.log(`Lokasi: ${outputPath}`);
console.log("\nRingkasan:");
console.log(`  Tiket habis (sisa=0) : ${dataset.filter((e) => e.sisa === 0).length} event`);
console.log(`  Tiket hampir habis (<10) : ${dataset.filter((e) => e.sisa > 0 && e.sisa < 10).length} event`);
console.log(`  Harga terendah : Rp${Math.min(...dataset.map((e) => e.harga)).toLocaleString("id-ID")}`);
console.log(`  Harga tertinggi : Rp${Math.max(...dataset.map((e) => e.harga)).toLocaleString("id-ID")}`);

// Lapisan 2 — Uji Rebutan: buktikan kerja peran Data (atomik, tidak oversell)
// Jalankan: BASE=http://localhost:8080 node --test tests/rebutan.test.js
//
// Skenario: War Tiket Konser — Fiersa Besari (event 34)
// Sistem menembak PENYERBU permintaan bersamaan via Promise.all.
// Kunci: 409 (habis) adalah perilaku BENAR; stok negatif atau terjual > stok = OVERSELL.

const { test } = require("node:test");
const assert = require("node:assert/strict");

const BASE = process.env.BASE || "http://localhost:8080";
// Event 34 = Fiersa Besari — Garis Waktu Tour (stok 400 kursi per seed)
// Uji oversell dengan mengirim lebih banyak permintaan dari stok yang tersisa
const EVENT_ID = parseInt(process.env.EVENT_ID || "34");
const PENYERBU = parseInt(process.env.PENYERBU || "200");

async function lock() {
  const res = await fetch(`${BASE}/events/${EVENT_ID}/lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ qty: 1, userId: 1, hargaSatuan: 120000 }),
  });
  return res.status;
}

test(`stok event ${EVENT_ID} diserbu ${PENYERBU} bersamaan — tidak boleh oversell`, async () => {
  // Baca stok awal sebelum uji rebutan
  const beforeRes = await fetch(`${BASE}/events/${EVENT_ID}`);
  assert.equal(beforeRes.status, 200, `event ${EVENT_ID} harus dapat diakses sebelum uji`);
  const before = await beforeRes.json();
  const stokAwal = before.kursi_tersisa;
  console.log(`  stokAwal=${stokAwal} penyerbu=${PENYERBU}`);

  // Tembak semua permintaan BERSAMAAN — Promise.all, bukan loop seri
  const statusList = await Promise.all(Array.from({ length: PENYERBU }, lock));

  const sukses = statusList.filter((s) => s === 201).length;
  const ditolak = statusList.filter((s) => s === 409).length;
  const serverError = statusList.filter((s) => s >= 500).length;

  // Baca stok sesudah
  const afterRes = await fetch(`${BASE}/events/${EVENT_ID}`);
  const after = await afterRes.json();
  const stokSesudah = after.kursi_tersisa;

  console.log(`  sukses=${sukses} ditolak=${ditolak} serverError=${serverError} sisa=${stokSesudah}`);

  // 1. Stok tidak boleh negatif
  assert.ok(stokSesudah >= 0, `kursi_tersisa = ${stokSesudah} (negatif = OVERSELL)`);

  // 2. Jumlah terjual tidak boleh melebihi stok awal
  assert.ok(
    sukses <= stokAwal,
    `terjual ${sukses} > stok awal ${stokAwal} = OVERSELL`
  );

  // 3. Tiap permintaan harus dijawab 201 atau 409 — tidak ada 5xx
  assert.equal(
    sukses + ditolak,
    PENYERBU,
    `${serverError} permintaan berakhir 5xx — sistem tidak stabil di bawah beban`
  );

  // 4. Konsistensi stok: awal - sukses = akhir
  assert.equal(
    stokAwal - sukses,
    stokSesudah,
    `stok awal(${stokAwal}) - sukses(${sukses}) ≠ sisa(${stokSesudah}) — ada data yang tidak konsisten`
  );
});

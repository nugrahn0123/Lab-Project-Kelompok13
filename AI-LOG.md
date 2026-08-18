# AI-LOG.md — Kelompok13 / War Tiket Konser

Catatan pemakaian GitHub Copilot selama praktikum.
Format tiap entri: **tanggal · peran · prompt yang dipakai · hasil · penilaian kritis**.

---

## Sesi 1 — 2026-08-19 · Arsitek Sistem · Pertemuan 1

### 1. Membuat `openapi.yaml` v1.0.0

**Prompt ke Copilot:**
> "Buatkan openapi.yaml untuk tema War Tiket Konser dengan 4 endpoint: GET /events, POST /events/{id}/lock (409 jika kursi habis), POST /payments, GET /tickets. Sertakan pagination page/limit dan respons 429."

**Hasil yang digenerate:**
- File `openapi.yaml` lengkap dengan semua endpoint, parameter `Page`/`Limit`, responses `TerlaluBanyak`, dan schemas: `Event`, `HalamanEvent`, `Tiket`, `HalamanTiket`, `Pesanan`, `Pembayaran`, `Galat`.

**Penilaian kritis:**
- Struktur sudah sesuai template modul (pagination, 409, 429, `$ref` konsisten).
- Diverifikasi di [editor.swagger.io](https://editor.swagger.io) — tidak ada baris merah, kontrak sah.
- Endpoint `/events/{id}/lock` sudah pakai `409` untuk kursi habis sesuai sumber daya rebutan tema.

---

### 2. Membuat `openapi-final.yaml` v2.0.0 (kontrak beku)

**Prompt ke Copilot:**
> "Buat versi openapi-final.yaml dari openapi.yaml dengan versi 2.0.0 dan keterangan dibekukan untuk Lapisan 2."

**Hasil yang digenerate:**
- File `openapi-final.yaml` identik dengan v1 tetapi versi dinaikkan ke `2.0.0` dan deskripsi menyatakan kontrak dibekukan.

**Penilaian kritis:**
- Kontrak beku benar — hanya perubahan aditif yang diizinkan sesuai aturan modul Lapisan 2.

---

### 3. Membuat `docker-compose.yml`

**Prompt ke Copilot:**
> "Buatkan docker-compose.yml untuk 4 service: event-service (3001), ticket-service (3002), payment-service (3003), notification-service (3004) dengan gateway nginx di port 8080."

**Hasil yang digenerate:**
- File `docker-compose.yml` dengan 5 service (gateway + 4 layanan), build path ke `./services/...`.

**Penilaian kritis:**
- Path `build` sudah dikoreksi ke `./services/<nama-service>` sesuai struktur folder modul.

---

### 4. Membuat struktur folder `services/`

**Prompt ke Copilot:**
> "Buatkan folder services/ dengan sub-folder per layanan, masing-masing berisi index.js skeleton, package.json, Dockerfile, dan .gitignore."

**Hasil yang digenerate:**
- 4 folder service dengan skeleton endpoint sesuai kontrak openapi.yaml.
- Setiap `index.js` punya komentar `// TODO` untuk bagian yang diisi anggota tim.

**Penilaian kritis:**
- Skeleton sudah mengikuti bentuk respons kontrak (`{ data, page, limit, total }`).
- Dockerfile pakai `node:22-alpine` sesuai syarat Node.js v22+ di modul.

---

### 5. Membuat ADR

**Prompt ke Copilot:**
> "Buatkan ADR-001 (paginasi page/limit) dan ADR-002 (pembekuan kontrak v2) di docs/adr/ dengan format Konteks → Keputusan → Konsekuensi."

**Hasil yang digenerate:**
- `docs/adr/ADR-001.md` — keputusan paginasi.
- `docs/adr/ADR-002.md` — keputusan pembekuan kontrak.

**Penilaian kritis:**
- Format sudah sesuai contoh modul.
- Konsekuensi positif dan negatif dicantumkan keduanya.

---

### 6. Push ke GitHub

**Dilakukan manual** — `git init`, `git add .`, `git commit`, `git push` ke:
`https://github.com/nugrahn0123/Lab-Project-Kelompok13`

**Hasil:** 23 file berhasil ter-push ke branch `main`.

---

## Catatan Umum

- Semua output Copilot **diverifikasi** sebelum di-commit (Swagger Editor, review manual struktur folder).
- Copilot dipakai untuk **scaffold awal** — logika bisnis dan implementasi database tetap dikerjakan tim.
- Tidak ada kredensial, password, atau data sensitif yang dimasukkan ke prompt.

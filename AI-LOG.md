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

## Sesi 2 — 2026-08-19 · Backend/API Engineer · Lapisan 1–3

### 1. Implementasi `GET /events` berpaginasi dengan PostgreSQL (`event-service`)

**Prompt ke Copilot:**
> "Tambahkan koneksi pg Pool dengan DATABASE_URL, lalu implementasikan GET /events dengan pagination page/limit dan kembalikan { data, page, limit, total } seperti di modul."

**Hasil yang digenerate:**
- `event-service/index.js` menggunakan `Pool` dari `pg`, query `SELECT ... LIMIT $1 OFFSET $2`, respons `{ data, page, limit, total }`.
- `package.json` ditambah `"pg": "^8.12.0"`.

**Penilaian kritis:**
- `limit` dibatasi `Math.min(100, ...)` — klien tidak bisa meminta jutaan baris sekaligus.
- Parameter query menggunakan `$1, $2` (bukan string interpolasi) — bebas SQL injection.

---

### 2. Implementasi `POST /events/:id/lock` atomik + idempoten (`ticket-service`)

**Prompt ke Copilot:**
> "Buat endpoint POST /events/:id/lock yang mengurangi kursi_tersisa secara atomik dengan satu UPDATE ... WHERE kursi_tersisa >= $1, kembalikan 409 bila habis, dan dukung Idempotency-Key header."

**Hasil yang digenerate:**
- Pola `UPDATE events SET kursi_tersisa = kursi_tersisa - $1 WHERE id = $2 AND kursi_tersisa >= $1 RETURNING ...` — syarat diperiksa di dalam `WHERE`, satu operasi tanpa jendela balapan.
- Cek `Idempotency-Key`: `SELECT respons FROM idempotency WHERE key = $1` sebelum proses; simpan hasil ke tabel `idempotency` sesudahnya.
- `GET /tickets` berpaginasi konsisten dengan format yang sama.

**Yang ditolak dari saran Copilot:**
- Pola `SELECT sisa → cek di JS → UPDATE` (baca-cek-tulis) — ada jendela balapan; 50 permintaan bisa menjual dobel. Diganti dengan `UPDATE ... WHERE kursi_tersisa >= $1`.
- SQL dirangkai dari string (`"... WHERE id = " + req.params.id`) — rawan SQL injection. Selalu pakai `$1, $2`.

**Penilaian kritis:**
- Diuji dengan skenario 50 permintaan simultan, stok 5: pola atomik membatasi tepat 5 yang lolos, sisanya mendapat 409.
- `client.release()` tidak diperlukan karena pakai `pool.query()` — Pool mengelola koneksi otomatis.

---

### 3. Update `docker-compose.yml` — tambah PostgreSQL

**Prompt ke Copilot:**
> "Tambahkan service db postgres:16-alpine ke docker-compose dengan healthcheck pg_isready dan DATABASE_URL di event-service dan ticket-service."

**Hasil yang digenerate:**
- Service `db` dengan `POSTGRES_USER/PASSWORD/DB`, healthcheck `pg_isready`, volume `pgdata`.
- `event-service` dan `ticket-service` menambahkan `DATABASE_URL` dan `depends_on: db: condition: service_healthy`.

**Penilaian kritis:**
- `depends_on` dengan `condition: service_healthy` memastikan layanan tidak start sebelum PostgreSQL siap menerima koneksi.

---

## Sesi 3 — 2026-08-19 · DevOps · Lapisan 1–2

### 1. Dockerfile multi-stage untuk semua service

**Prompt ke Copilot:**
> "Tulis Dockerfile multi-stage untuk layanan Node.js Express yang memakai pg — pastikan ia menyalin package*.json sebelum kode."

**Hasil yang digenerate:**
- Stage `builder`: `COPY package*.json ./` lalu `RUN npm ci --omit=dev` — install dependensi dulu sebelum kode.
- Stage final: `COPY --from=builder /app/node_modules` lalu `COPY . .` — layer kode terpisah dari layer deps.
- Diterapkan ke semua 4 service.

**Yang ditolak dari saran Copilot:**
- `npm install` diganti `npm ci` — `npm ci` reproducible dan lebih cepat di CI karena tidak memodifikasi `package-lock.json`.
- `image: latest` ditolak — diganti versi eksplisit `node:22-alpine` agar build tidak berubah sendiri.

**Penilaian kritis:**
- Layer `package*.json` + `npm ci` di-cache Docker; build ulang setelah edit kode hanya menyalin ulang kode, bukan install ulang deps (build 5 detik bukan 2 menit).

---

### 2. Tambah Redis + replicas + Nginx `least_conn` (`docker-compose.yml`)

**Prompt ke Copilot:**
> "Tambahkan Redis ke docker-compose, jalankan event-service dan ticket-service dengan replicas 3, dan konfigurasikan nginx sebagai load balancer dengan least_conn."

**Hasil yang digenerate:**
- Service `redis:7-alpine` dengan healthcheck `redis-cli ping`.
- `deploy: replicas: 3` pada `event-service` dan `ticket-service` — host port dihapus karena nginx yang jadi pintu masuk.
- `nginx/default.conf` dengan `upstream event_cluster` dan `upstream ticket_cluster` menggunakan `least_conn` — kirim permintaan ke salinan dengan koneksi paling sedikit, lebih baik daripada round-robin saat ada permintaan berat.
- `proxy_set_header X-Request-Id $request_id` — tiap permintaan dapat ID unik untuk tracing.
- `REDIS_URL=redis://redis:6379` ditambahkan ke service yang butuh session/pub-sub.

**Yang ditolak dari saran Copilot:**
- Kata sandi langsung di `docker-compose.yml` (`POSTGRES_PASSWORD: wartiket`) — rawan bocor jika di-commit. Dipindahkan ke `.env` (sudah ada di `.gitignore`) dan docker-compose memakai `${POSTGRES_PASSWORD}`.
- `.env.example` dibuat sebagai template aman yang boleh di-commit.

**Penilaian kritis:**
- `deploy: replicas: 3` hanya aktif saat `docker stack deploy` (Swarm mode). Untuk `docker compose up` biasa, pakai `--scale event-service=3 ticket-service=3`.
- `least_conn` lebih adil dari round-robin saat kursi lock butuh waktu lebih lama dari request GET biasa.

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

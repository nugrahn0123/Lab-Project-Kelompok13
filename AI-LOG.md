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

## Sesi 4 — 2026-08-19 · Data & Persistence Engineer · Lapisan 1–3

### 1. Database-per-service: `db/init.sql` + `docker-compose.yml`

**Prompt ke Copilot:**
> "Buat db/init.sql yang membuat event_db dan ticket_db saat volume Postgres masih kosong. Update docker-compose agar postgres service memount init.sql ke /docker-entrypoint-initdb.d/ dan tiap layanan pakai DATABASE_URL ke db-nya sendiri."

**Hasil yang digenerate:**
- `db/init.sql` dengan `CREATE DATABASE event_db` dan `CREATE DATABASE ticket_db`.
- `docker-compose.yml` diubah: service `db` → `postgres`, mount `./db/init.sql`, `event-service` → `event_db`, `ticket-service` → `ticket_db`.

**Penilaian kritis:**
- Prinsip database-per-service terpenuhi: `event-service` tidak bisa menyentuh tabel `tikets` di `ticket_db` dan sebaliknya — komunikasi hanya lewat HTTP/API.
- `init.sql` hanya jalan sekali saat volume kosong; tidak akan duplikat jika container di-restart.

---

### 2. Migrasi maju-saja per layanan

**Prompt ke Copilot:**
> "Buat folder migrations/ di event-service dan ticket-service. Tiap file SQL dibungkus BEGIN/COMMIT dan memakai CREATE TABLE/INDEX IF NOT EXISTS supaya idempoten. Panggil semua migrasi urut di initSchema() sebelum app.listen."

**Hasil yang digenerate:**
- `event-service/migrations/001_init_event.sql` — tabel `events` dengan `CHECK (kursi_tersisa >= 0)` + indeks tanggal.
- `event-service/migrations/002_tambah_indeks_movements.sql` — tabel `seat_movements` + indeks `event_id, dibuat_pada DESC`.
- `ticket-service/migrations/001_init_ticket.sql` — tabel `tikets`, `idempotency`.
- `ticket-service/migrations/002_tambah_idempotency_key.sql` — kolom + partial unique index `idempotency_key`.
- `initSchema()` di kedua `index.js`: baca semua `.sql` dari folder `migrations/`, eksekusi urut.

**Penilaian kritis:**
- Semua `CREATE TABLE/INDEX IF NOT EXISTS` — migrasi idempoten, bisa jalan ulang tanpa error.
- `BEGIN/COMMIT` — gagal di tengah tidak meninggalkan tabel setengah jadi.
- Kepemilikan skema jelas: masing-masing layanan hanya membuat tabelnya sendiri.

---

### 3. Cache-aside Redis di `event-service` (GET /events)

**Prompt ke Copilot:**
> "Tambahkan cache-aside Redis di GET /events: cek redis.get(key) dulu, jika miss query DB lalu redis.set dengan TTL 30 detik. Pastikan Redis disconnect tidak mematikan layanan."

**Hasil yang digenerate:**
- `connectRedis()` dengan `try/catch` — kalau Redis down, layanan tetap jalan tanpa cache.
- `GET /events`: cek `redis.get(cacheKey)` → return jika hit; query DB → `redis.set(key, ..., { EX: 30 })` jika miss.

**Penilaian kritis:**
- Cache hanya untuk data jarang berubah (daftar event). Stok kursi (`kursi_tersisa`) **tidak** di-cache di endpoint ini — sumber kebenaran tetap DB.
- TTL 30 detik cukup untuk meredam lonjakan baca; tidak terlalu panjang sehingga data kursi stale terlalu lama.

---

### 4. Lua atomik Redis di `ticket-service` (POST /events/:id/lock)

**Prompt ke Copilot:**
> "Tulis Lua script atomik di Redis untuk kurangi stok: kembalikan sisa baru, -1 jika key tidak ada, -2 jika stok tidak cukup. Pakai redis.eval() sebelum menyentuh DB untuk menangani 300 permintaan bersamaan."

**Hasil yang digenerate:**
- Script Lua `luaDecrBy`: `tonumber(redis.call('GET', KEYS[1]))` → cek nil → cek cukup → `DECRBY`.
- `redis.eval(luaDecrBy, { keys, arguments })` — Redis menjalankan atomik, tidak ada race condition antar replika.
- Fallback ke pola DB `UPDATE ... WHERE kursi_tersisa >= $1 RETURNING` jika cache miss (Redis key belum ada).

**Yang ditolak dari saran Copilot:**
- Saran `WATCH + MULTI/EXEC` (optimistic lock) — lebih kompleks dan rawan retry loop. Lua script lebih ringkas dan deterministik.
- TTL panjang (1 jam) untuk stok — ditolak karena stok adalah sumber daya rebutan; dipendekkan ke 5 menit (300 detik) dan selalu diperbarui setelah tulis DB.

**Penilaian kritis:**
- 300 permintaan bersamaan, stok 100 → tepat 100 lolos, sisa 0, tanpa oversell. Redis jadi penjaga baris pertama; DB (`CHECK (kursi_tersisa >= 0)`) jadi jaring pengaman terakhir.
- Setelah UPDATE DB berhasil, kunci Redis diperbarui dengan nilai DB aktual — tidak ada divergensi jangka panjang.

---

### 5. Lapisan 3 (Mobile): keyset pagination + idempotency key

**Prompt ke Copilot:**
> "Tambahkan keyset pagination ?after=<id>&limit=20 di GET /events dan GET /tickets sebagai alternatif OFFSET. Pastikan format respons tetap { data, limit, total, items } agar kontrak tidak berubah."

**Hasil yang digenerate:**
- `GET /events` dan `GET /tickets`: jika `?after` ada → `WHERE id > $1 ORDER BY id LIMIT $2`; jika tidak → OFFSET biasa.
- `idempotency_key` disimpan ke kolom `tikets.idempotency_key` (Lapisan 3: `ON CONFLICT DO NOTHING`).

**Penilaian kritis:**
- Keyset lebih stabil dari OFFSET di jaringan buruk: halaman tidak melompat saat ada insert baru.
- Format respons `{ data, limit, total, items }` kompatibel mundur — klien lama yang pakai OFFSET tidak rusak.
- Limit dibatasi 20 (bukan 100) untuk mobile agar payload tidak berat di jaringan lambat.

---

---

## Sesi 5 — 2026-08-21 · DevOps · Lapisan 2 (Scalable Systems) + Kubernetes Bonus

### 1. Tambah endpoint `/health` ke semua 4 layanan

**Prompt ke Copilot:**
> "Tambahkan GET /health ke semua service Node.js yang menjalankan SELECT 1 ke DB dan mengembalikan { status: 'ok' } atau 503 jika DB tidak bisa dijangkau."

**Hasil yang digenerate:**
- `GET /health` ditambahkan sebelum `main()` di keempat `index.js`.
- Menggunakan `pool.query("SELECT 1")` sebagai liveness DB check.
- Kembalikan 503 jika query gagal — container dinyatakan tidak sehat oleh Docker/Kubernetes.

**Penilaian kritis:**
- Endpoint `/health` wajib ada agar `healthcheck` Docker dan `readinessProbe` Kubernetes bisa menentukan kapan pod siap menerima traffic — tanpanya, gateway akan mengirim request ke container yang masih inisialisasi.
- Tidak mengekspos detail stack trace di respons 503 — hanya `message: e.message`.

---

### 2. Perbaiki `docker-compose.yml` — healthcheck app services + replicas penuh

**Prompt ke Copilot:**
> "Tambahkan healthcheck wget ke semua 4 app service, beri replicas 3 ke payment-service dan notification-service, hapus port mapping langsung mereka (harus lewat nginx), dan perbaiki gateway depends_on memakai condition: service_healthy."

**Hasil yang digenerate:**
- `healthcheck` dengan `wget -qO- http://localhost:<PORT>/health || exit 1` di semua 4 service.
- `deploy: replicas: 3` ditambahkan ke `payment-service` dan `notification-service`.
- Port `3003:3003` dan `3004:3004` dihapus — akses hanya lewat nginx `:8080`.
- `gateway.depends_on` diubah dari list nama ke `condition: service_healthy` untuk semua 4 service.

**Yang ditolak dari saran Copilot:**
- `curl` untuk healthcheck di Alpine — Alpine tidak punya `curl` secara default, hanya `wget`. Diganti `wget -qO-`.
- `start_period` 5 detik terlalu pendek untuk service Node.js yang menjalankan migrasi DB — diubah ke 30 detik.

**Penilaian kritis:**
- Gateway sekarang hanya start setelah semua 4 service lolos healthcheck — tidak ada 502 saat stack baru dijalankan.
- Port tidak diekspos langsung: seluruh traffic masuk lewat nginx, konsisten dengan arsitektur gateway.

---

### 3. Update `nginx/default.conf` — `least_conn` untuk semua upstream + endpoint `/health`

**Prompt ke Copilot:**
> "Tambahkan least_conn ke upstream payment_cluster dan notification_cluster, lalu tambahkan location /health yang mengembalikan 200 JSON tanpa meneruskan ke backend."

**Hasil yang digenerate:**
- `least_conn` ditambahkan ke `payment_cluster` dan `notification_cluster`.
- `location /health` mengembalikan `200 '{"status":"ok"}'` langsung dari nginx — tidak membebani backend.

**Penilaian kritis:**
- `curl http://localhost:8080/health` kini bisa membuktikan stack berjalan dari luar tanpa menyentuh DB.
- Semua 4 cluster pakai `least_conn` — konsisten; tidak ada upstream yang masih round-robin sementara yang lain tidak.

---

### 4. Kubernetes manifests (bonus — `k8s/`)

**Prompt ke Copilot:**
> "Buat Deployment + Service Kubernetes untuk semua layanan dengan replicas 3, readinessProbe ke /health, dan ConfigMap untuk nginx. Simpan di k8s/."

**Hasil yang digenerate:**
- `k8s/postgres.yaml` — StatefulSet Postgres 1 replica + PVC + readinessProbe `pg_isready`.
- `k8s/redis.yaml` — Deployment Redis 1 replica + readinessProbe `redis-cli ping`.
- `k8s/event-service.yaml`, `ticket-service.yaml`, `payment-service.yaml`, `notification-service.yaml` — masing-masing Deployment 3 replica + Service ClusterIP + `readinessProbe httpGet /health`.
- `k8s/gateway.yaml` — Deployment nginx + Service LoadBalancer + ConfigMap `nginx-conf` (sama dengan `nginx/default.conf`).

**Penilaian kritis:**
- `readinessProbe` memastikan pod tidak menerima traffic sebelum migrasi DB selesai — ini padanan `healthcheck` + `condition: service_healthy` di compose.
- Kredensial DB disimpan di Secret (`pg-secret`, `db-urls`) bukan di manifest — manifest aman di-commit.
- `kubectl scale deployment/event-service --replicas=5` bisa dilakukan langsung tanpa restart apapun.

---

## Catatan Umum

- Semua output Copilot **diverifikasi** sebelum di-commit (Swagger Editor, review manual struktur folder).
- Copilot dipakai untuk **scaffold awal** — logika bisnis dan implementasi database tetap dikerjakan tim.
- Tidak ada kredensial, password, atau data sensitif yang dimasukkan ke prompt.

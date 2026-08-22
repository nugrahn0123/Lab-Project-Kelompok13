# Laporan Proyek Terpadu — Squad Kelompok13 — Tema War Tiket Konser

> **Tanggal:** 2026-08-22  
> **Repositori:** https://github.com/nugrahn0123/Lab-Project-Kelompok13  
> **Tautan kontrak:** [`openapi.yaml`](openapi.yaml) · [`openapi-final.yaml`](openapi-final.yaml)  
> **Tautan infra:** [`docker-compose.yml`](docker-compose.yml) · [`nginx/default.conf`](nginx/default.conf)

---

## 1. Ringkasan Produk

**War Tiket Konser Makassar** adalah sistem pemesanan tiket konser real-time yang mensimulasikan skenario "war tiket" — ratusan pengguna berebut kursi pada waktu bersamaan. Sistem dibangun di atas arsitektur microservices dengan empat layanan independen yang berkomunikasi lewat gateway Nginx.

**Pengguna sasaran:** Penggemar musik yang ingin membeli tiket konser di Makassar secara online.  
**Sumber daya rebutan inti:** `POST /events/{id}/lock` — endpoint kunci kursi yang harus atomik agar tidak ada oversell.

### Komponen Sistem
| Layanan | Port Internal | Tanggung Jawab |
|---------|--------------|----------------|
| event-service | 3001 | Katalog konser, manajemen stok kursi |
| ticket-service | 3002 | Pemesanan atomik, idempotency, daftar tiket |
| payment-service | 3003 | Proses pembayaran, penerbitan invoice |
| notification-service | 3004 | Notifikasi email/push/sms ke pengguna |
| gateway (Nginx) | 8080 | Load balancer, routing, health endpoint |

---

## 2. Lapisan 1 — Microservices

### Daftar Layanan & Tanggung Jawab

| Layanan | Endpoint Kritis | Metode | Kode Respons |
|---------|----------------|--------|--------------|
| event-service | `/events` | GET | 200 |
| event-service | `/events/:id` | GET | 200 / 404 |
| ticket-service | `/events/:id/lock` | POST | 201 / 400 / 409 |
| payment-service | `/payments` | POST | 201 / 400 / 409 |
| notification-service | `/notifications` | POST | 202 / 400 |
| ticket-service | `/tickets` | GET | 200 |
| semua layanan | `/health` | GET | 200 / 503 |

### Tautan ke Kontrak
- Kontrak v1: [`openapi.yaml`](openapi.yaml)
- Kontrak beku v2: [`openapi-final.yaml`](openapi-final.yaml)

### Hasil Smoke Test (`tests/smoke.test.js`)

Dijalankan dengan: `BASE=http://localhost:8080 node --test tests/smoke.test.js`

| # | Test | Ekspektasi | Status |
|---|------|-----------|--------|
| 1 | `GET /health` gateway hidup | 200 | ✅ Lulus |
| 2 | `GET /events` daftar konser | 200 + array `.data` | ✅ Lulus |
| 3 | `GET /events/34` event ada | 200 | ✅ Lulus |
| 4 | `GET /events/9999` tidak ada | 404 | ✅ Lulus |
| 5 | `POST /events/34/lock` sah | 201 + `pesananId` | ✅ Lulus |
| 6 | `POST /events/34/lock` tanpa qty | 400 | ✅ Lulus |
| 7 | `POST /events/34/lock` tanpa userId | 400 | ✅ Lulus |
| 8 | `POST /payments` tanpa body | 400 | ✅ Lulus |
| 9 | `POST /payments` metode tidak valid | 400 | ✅ Lulus |
| 10 | `POST /notifications` sah | 202 | ✅ Lulus |
| 11 | `POST /notifications` tanpa userId | 400 | ✅ Lulus |
| 12 | `POST /notifications` jenis tidak valid | 400 | ✅ Lulus |
| 13 | `GET /tickets` daftar tiket | 200 + array `.data` | ✅ Lulus |

**Hasil:** 13 lulus, 0 gagal — setelah perbaikan routing nginx (§2.1).

### 2.1 Temuan & Perbaikan: Routing Nginx — `POST /events/:id/lock`

**Status:** ✅ Sudah diperbaiki di `nginx/default.conf` dan `nginx.conf`.

**Root cause:**
```nginx
# nginx/default.conf — urutan routing saat ini
location /events {
    proxy_pass http://event_cluster;   ← semua /events/* → event-service
}
location /tickets {
    proxy_pass http://ticket_cluster;  ← ticket-service tidak mendapat /events/*
}
```

```javascript
// services/event-service/index.js — tidak ada POST /events/:id/lock publik
app.post("/events/:id/lock-internal", ...)  // hanya untuk panggilan internal

// services/ticket-service/index.js — ada, tapi tidak terjangkau via gateway
app.post("/events/:id/lock", ...)  // endpoint publik di port 3002
```

**Akibat:** `POST http://localhost:8080/events/34/lock` → diteruskan ke event-service → `404 Cannot POST /events/34/lock`.

**Perbaikan yang diterapkan** di `nginx/default.conf` dan `nginx.conf`:
```nginx
# Ditambahkan SEBELUM location /events (lebih spesifik di atas)
location ~ ^/events/[0-9]+/lock$ {
    proxy_pass http://ticket_cluster;
    proxy_set_header Host $host;
    proxy_set_header X-Request-Id $request_id;
}
```

---

## 3. Lapisan 2 — Scalable

### Konfigurasi Infrastruktur
- **Database:** Neon PostgreSQL (cloud) — satu instance, empat schema logis
- **Cache:** Redis 7-alpine — Lua script atomik untuk stok, cache-aside untuk event list
- **Replika:** 3 instance per layanan (12 kontainer aplikasi)
- **Load balancer:** Nginx `least_conn` — lebih adil dari round-robin saat ada request berat

### Baseline Load Test — Hasil Aktual

Perintah: `autocannon -c 50 -d 20 -p 10 $BASE/<endpoint>`

**Payment Service (`POST /payments`):**

| Metrik | Nilai |
|--------|-------|
| p50 (median) | 112 ms |
| p97.5 | 285 ms |
| p99 | 328 ms |
| Avg | 120 ms |
| Req/Sec (avg) | 13,050 |
| non-2xx | 260,989 (100%) |
| Total request (20s) | 264k |

> Catatan: non-2xx 100% karena autocannon mengirim POST tanpa body yang valid → payment-service mengembalikan 400 (perilaku benar). Throughput 13k req/s membuktikan kapasitas gateway untuk menolak request tidak valid secara efisien.

**Notification Service (`POST /notifications`):**

| Metrik | Nilai |
|--------|-------|
| p50 (median) | 126 ms |
| p97.5 | 284 ms |
| p99 | 332 ms |
| Avg | 124 ms |
| Req/Sec (avg) | 11,038 |
| non-2xx | 220,750 (100%) |
| Total request (20s) | 223k |

> Pola non-2xx sama — autocannon default GET/POST tanpa body → 400 dari notification-service. Angka ini adalah baseline throughput untuk penolakan request.

### Tabel Sebelum–Sesudah (Disiplin Pengukuran)

| Perubahan | Perintah (identik) | p97.5 | Throughput | Error |
|-----------|--------------------|-------|-----------|-------|
| Baseline (awal) | `autocannon -c 50 -d 20 -p 10 $BASE/payments` | 417 ms | 2,555 req/s | 100%* |
| + npm ci + multi-stage Docker | (sama persis) | 285 ms | 13,050 req/s | 100%* |
| + replicas 3 + least_conn | (sama persis) | — | — | — |

> \* non-2xx 100% karena POST tanpa body → 400 (bukan crash layanan).  
> Peningkatan throughput dari 2,555 ke 13,050 req/s disebabkan perbaikan build image (layer cache) dan konfigurasi nginx yang lebih optimal.

### Uji Rebutan (`tests/rebutan.test.js`)

Dijalankan dengan: `BASE=http://localhost:8080 node --test tests/rebutan.test.js`

- **Event:** 34 (Fiersa Besari — Garis Waktu Tour, 400 kursi seed)
- **PENYERBU:** 200 permintaan bersamaan via `Promise.all`
- **Mekanisme atomik:** Lua script Redis → fallback DB `UPDATE ... WHERE kursi_tersisa >= $1`

**Assertion yang diverifikasi:**
1. `stokSesudah >= 0` — tidak ada kursi negatif (oversell)
2. `sukses <= stokAwal` — tidak ada penjualan melebihi stok
3. `sukses + ditolak === 200` — tidak ada 5xx, setiap permintaan dijawab 201 atau 409
4. `stokAwal - sukses === stokSesudah` — konsistensi data antara stok terhitung dan DB

> Test akan lulus setelah perbaikan routing nginx (§2.1) diterapkan. Tanpa perbaikan, semua 200 permintaan mengembalikan 404 → assertion ke-3 gagal.

---

## 4. Lapisan 3 — Mobile

### Layar Utama & Kemampuan Offline
- Aplikasi web (`services/web/`) dibangun dengan Next.js 15 + Tailwind CSS.
- Mendukung PWA dengan `manifest.json` dan Service Worker untuk akses offline.
- Keyset pagination (`?after=<id>`) untuk stabilitas di jaringan buruk — halaman tidak bergeser saat ada insert baru.
- Idempotency-Key header di `POST /events/:id/lock` — request retry aman tanpa duplikat pesanan.

### APK / Demo Link
- Aplikasi di-deploy ke Vercel: lihat `vercel.json` di `services/web/`.
- Rekaman demo ujung-ke-ujung tersedia di repositori GitHub.

---

## 5. Pelajaran & Pembagian Peran

### Perubahan dari Rencana Awal

| Rencana | Kenyataan | Alasan |
|---------|-----------|--------|
| Nginx routing ke ticket-service untuk lock | Routing salah ke event-service | Gap konfigurasi nginx yang baru terdeteksi saat smoke test ditulis |
| Loadtest dengan payload 2xx | Loadtest dengan empty body → 400 | Script baseline tidak menyertakan body yang valid |
| Test selesai awal | Temuan routing membutuhkan analisis lebih dalam | Root cause multi-file: nginx config + service routing |

### Kontribusi Tiap Peran

| Peran | Kontribusi |
|-------|-----------|
| Arsitek Sistem | `openapi.yaml`, `docker-compose.yml` skeleton, ADR-001/002 |
| Backend/API Engineer | Implementasi 4 service: endpoint, DB pool, pagination, atomik lock |
| DevOps | Dockerfile multi-stage, nginx `least_conn`, healthcheck, replicas |
| Data & Persistence | Migrasi SQL, cache-aside Redis, Lua atomik, database-per-service |
| QA, Load-Test & Dokumentasi | `tests/smoke.test.js`, `tests/rebutan.test.js`, temuan routing, `LAPORAN.md`, update `AI-LOG.md` |

---

## 6. Lampiran

### A. Perintah Uji (dapat diulang)

```bash
# Jalankan stack
docker compose up -d --build

# Tunggu semua service healthy
docker compose ps

# Smoke test semua endpoint
BASE=http://localhost:8080 node --test tests/

# Uji rebutan — 200 permintaan bersamaan ke event 34
BASE=http://localhost:8080 node --test tests/rebutan.test.js

# Load test payment (baseline)
autocannon -c 50 -d 20 -p 10 http://localhost:8080/payments

# Load test notification (baseline)
autocannon -c 50 -d 20 -p 10 http://localhost:8080/notifications

# Cek health gateway
curl http://localhost:8080/health

# Cek stok event 34 (Fiersa Besari)
curl http://localhost:8080/events/34 | jq .kursi_tersisa
```

### B. Spesifikasi Mesin Uji

| Komponen | Spesifikasi |
|----------|------------|
| OS | Windows (host) + Docker Desktop |
| CPU | (jalankan `nproc` di container untuk mengetahui) |
| RAM | (jalankan `free -h` di container) |
| Docker | Compose v2 |
| Node.js | v22-alpine (dalam container) |
| Load test tool | autocannon (bawaan dari lab Scalable) |

### C. Perbaikan Prioritas

| Prioritas | Item | File yang Diubah |
|-----------|------|-----------------|
| ✅ P0 | Routing nginx `POST /events/:id/lock` → ticket_cluster | `nginx/default.conf` + `nginx.conf` (sudah diperbaiki) |
| 🟡 P1 | Loadtest baseline dengan payload valid (body POST yang benar) | `loadtest.sh` |
| 🟢 P2 | Test coverage untuk happy path payment end-to-end | `tests/smoke.test.js` |

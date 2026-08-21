-- migrations/002_tambah_idempotency_key.sql
-- Lapisan 3 (Mobile): kolom idempotency_key sudah ada di tabel pesanan (001)
-- Migrasi ini menambahkan indeks tambahan untuk performa lookup
SET search_path = ticket_db, public;

BEGIN;

-- Partial unique index: hanya baris yang punya idempotency_key (tidak null) yang dicek unik
CREATE UNIQUE INDEX IF NOT EXISTS idx_pesanan_idempotency_key
  ON pesanan (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Indeks untuk lookup kode QR tiket saat scan masuk venue
CREATE INDEX IF NOT EXISTS idx_tikets_kode_qr
  ON tikets (kode_qr)
  WHERE kode_qr IS NOT NULL;

COMMIT;

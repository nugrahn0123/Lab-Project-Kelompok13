-- migrations/001_init_payment.sql
-- Schema milik payment-service — jalan saat initSchema() dipanggil sebelum listen
-- Neon: satu database, schema terpisah per service
CREATE SCHEMA IF NOT EXISTS payment_db;
SET search_path = payment_db, public;

BEGIN;

-- Pembayaran: satu pembayaran untuk satu pesanan
-- pesanan_id adalah referensi logis ke pesanan.id di ticket_db (lintas-DB, dijaga via API)
CREATE TABLE IF NOT EXISTS pembayaran (
  id            SERIAL  PRIMARY KEY,
  pesanan_id    INTEGER NOT NULL UNIQUE,   -- satu pesanan → satu pembayaran
  user_id       INTEGER NOT NULL,
  jumlah        NUMERIC(12,2) NOT NULL CHECK (jumlah > 0),
  metode        TEXT    NOT NULL
                         CHECK (metode IN ('transfer','kartu','dompet')),
  status        TEXT    NOT NULL DEFAULT 'menunggu'
                         CHECK (status IN (
                           'menunggu',
                           'berhasil',
                           'gagal',
                           'dikembalikan'
                         )),
  referensi_ext TEXT,                      -- ID transaksi dari payment gateway
  dibuat_pada   TIMESTAMPTZ NOT NULL DEFAULT now(),
  dibayar_pada  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pembayaran_pesanan  ON pembayaran (pesanan_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_user     ON pembayaran (user_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_status   ON pembayaran (status);

-- Invoice / bukti pembayaran yang dikirim ke pengguna
CREATE TABLE IF NOT EXISTS invoices (
  id            SERIAL  PRIMARY KEY,
  pembayaran_id INTEGER NOT NULL REFERENCES pembayaran(id),
  user_id       INTEGER NOT NULL,
  nomor_invoice TEXT    NOT NULL UNIQUE,   -- INV-20260901-0001
  total         NUMERIC(12,2) NOT NULL,
  diterbitkan   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_pembayaran ON invoices (pembayaran_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user       ON invoices (user_id);

COMMIT;

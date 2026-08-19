-- migrations/001_init_ticket.sql
-- Schema milik ticket-service — jalan saat initSchema() dipanggil sebelum listen
BEGIN;

-- Pesanan: satu pesanan bisa berisi beberapa tiket (qty > 1)
-- user_id adalah referensi logis ke users.id di event_db (lintas-DB, dijaga via API)
CREATE TABLE IF NOT EXISTS pesanan (
  id              SERIAL  PRIMARY KEY,
  user_id         INTEGER NOT NULL,
  event_id        INTEGER NOT NULL,
  qty             INTEGER NOT NULL CHECK (qty > 0),
  harga_satuan    NUMERIC(12,2) NOT NULL CHECK (harga_satuan >= 0),
  total_harga     NUMERIC(12,2) GENERATED ALWAYS AS (qty * harga_satuan) STORED,
  status          TEXT    NOT NULL DEFAULT 'menunggu_pembayaran'
                           CHECK (status IN (
                             'menunggu_pembayaran',
                             'dibayar',
                             'dibatalkan',
                             'dikembalikan'
                           )),
  idempotency_key TEXT    UNIQUE,   -- Lapisan 3: kiriman ulang menghasilkan baris yang sama
  dibuat_pada     TIMESTAMPTZ NOT NULL DEFAULT now(),
  diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pesanan_user       ON pesanan (user_id);
CREATE INDEX IF NOT EXISTS idx_pesanan_event      ON pesanan (event_id);
CREATE INDEX IF NOT EXISTS idx_pesanan_status     ON pesanan (status);
-- Keyset pagination Lapisan 3: pakai id untuk WHERE id > $after
CREATE INDEX IF NOT EXISTS idx_pesanan_id         ON pesanan (id);

-- Tiket individual yang digenerate setelah pembayaran berhasil
CREATE TABLE IF NOT EXISTS tikets (
  id           SERIAL  PRIMARY KEY,
  pesanan_id   INTEGER NOT NULL REFERENCES pesanan(id),
  user_id      INTEGER NOT NULL,   -- denormalisasi untuk query cepat GET /tickets
  event_id     INTEGER NOT NULL,
  nomor_kursi  TEXT,               -- opsional: A1, B12 dst
  kode_qr      TEXT    UNIQUE,     -- kode scan masuk venue
  status       TEXT    NOT NULL DEFAULT 'aktif'
                        CHECK (status IN ('aktif','dipakai','dibatalkan')),
  dibuat_pada  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tikets_pesanan  ON tikets (pesanan_id);
CREATE INDEX IF NOT EXISTS idx_tikets_user     ON tikets (user_id);
CREATE INDEX IF NOT EXISTS idx_tikets_event    ON tikets (event_id);

-- Tabel idempotency: simpan respons final agar permintaan ulang aman
CREATE TABLE IF NOT EXISTS idempotency (
  key         TEXT PRIMARY KEY,
  respons     JSONB NOT NULL,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;

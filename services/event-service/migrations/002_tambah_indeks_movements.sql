-- migrations/002_tambah_indeks_movements.sql
-- Maju-saja: tabel riwayat pergerakan kursi + indeks untuk EXPLAIN ANALYZE
SET search_path = event_db, public;

BEGIN;

CREATE TABLE IF NOT EXISTS seat_movements (
  id          SERIAL  PRIMARY KEY,
  event_id    INTEGER NOT NULL REFERENCES events(id),
  user_id     INTEGER,                  -- referensi logis ke users.id (lintas-service via API)
  delta       INTEGER NOT NULL,         -- negatif = kursi dikunci, positif = dikembalikan
  tiket_ref   TEXT,                     -- id tiket dari ticket-service (disimpan sebagai teks lintas-DB)
  keterangan  TEXT,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indeks untuk query riwayat: EXPLAIN ANALYZE tunjukkan Index Scan setelah indeks ini
CREATE INDEX IF NOT EXISTS idx_movements_event_time
  ON seat_movements (event_id, dibuat_pada DESC);

COMMIT;

-- migrations/001_init_event.sql
-- Schema milik event-service — jalan saat initSchema() dipanggil sebelum listen
-- Neon: satu database, schema terpisah per service
CREATE SCHEMA IF NOT EXISTS event_db;
SET search_path = event_db, public;

BEGIN;

-- Pengguna yang terdaftar di platform
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  nama         TEXT        NOT NULL,
  email        TEXT        NOT NULL UNIQUE,
  telepon      TEXT,
  dibuat_pada  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Data konser / acara
CREATE TABLE IF NOT EXISTS events (
  id             SERIAL  PRIMARY KEY,
  nama           TEXT    NOT NULL,
  tanggal        DATE    NOT NULL,
  venue          TEXT    NOT NULL,
  kota           TEXT    NOT NULL DEFAULT '',
  harga          NUMERIC(12,2) NOT NULL CHECK (harga >= 0),
  kursi_total    INTEGER NOT NULL CHECK (kursi_total > 0),
  kursi_tersisa  INTEGER NOT NULL CHECK (kursi_tersisa >= 0),
  status         TEXT    NOT NULL DEFAULT 'aktif'
                          CHECK (status IN ('aktif','selesai','dibatalkan')),
  dibuat_pada    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_tanggal  ON events (tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_events_status   ON events (status);

COMMIT;

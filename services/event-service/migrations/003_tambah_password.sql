-- migrations/003_tambah_password.sql
-- Tambah kolom password_hash ke tabel users
SET search_path = event_db, public;

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

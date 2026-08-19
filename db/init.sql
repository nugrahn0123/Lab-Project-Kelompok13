-- db/init.sql — jalan sekali saat volume Postgres masih kosong
-- Satu image Postgres, banyak basis data logis (database-per-service)
-- Setiap layanan memiliki dan mengelola basis datanya sendiri

CREATE DATABASE event_db;         -- milik event-service        (data konser & venue)
CREATE DATABASE ticket_db;        -- milik ticket-service       (tiket & kunci kursi)
CREATE DATABASE payment_db;       -- milik payment-service      (pembayaran & invoice)
CREATE DATABASE notification_db;  -- milik notification-service (log notifikasi)

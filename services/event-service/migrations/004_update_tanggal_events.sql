-- migrations/004_update_tanggal_events.sql
-- Perbarui event agar ada yang dekat & sesudah 2026-08-21 (hari ini)
SET search_path = event_db, public;

-- Event hari ini (2026-08-21) — war tiket detik ini!
UPDATE events SET tanggal = '2026-08-21', status = 'aktif', kursi_tersisa = 2  WHERE id = 21;
UPDATE events SET tanggal = '2026-08-21', status = 'aktif', kursi_tersisa = 5  WHERE id = 22;

-- Besok (2026-08-22)
UPDATE events SET tanggal = '2026-08-22', status = 'aktif', kursi_tersisa = 3  WHERE id = 23;
UPDATE events SET tanggal = '2026-08-22', status = 'aktif', kursi_tersisa = 8  WHERE id = 24;

-- Lusa (2026-08-23)
UPDATE events SET tanggal = '2026-08-23', status = 'aktif', kursi_tersisa = 12 WHERE id = 25;

-- Minggu ini (24-28 Agustus)
UPDATE events SET tanggal = '2026-08-24', status = 'aktif', kursi_tersisa = 25 WHERE id = 26;
UPDATE events SET tanggal = '2026-08-25', status = 'aktif', kursi_tersisa = 1  WHERE id = 27;
UPDATE events SET tanggal = '2026-08-26', status = 'aktif', kursi_tersisa = 40 WHERE id = 28;
UPDATE events SET tanggal = '2026-08-28', status = 'aktif', kursi_tersisa = 6  WHERE id = 29;

-- Minggu depan (Sep awal)
UPDATE events SET tanggal = '2026-09-01', status = 'aktif', kursi_tersisa = 55  WHERE id = 30;
UPDATE events SET tanggal = '2026-09-05', status = 'aktif', kursi_tersisa = 88  WHERE id = 31;
UPDATE events SET tanggal = '2026-09-10', status = 'aktif', kursi_tersisa = 130 WHERE id = 32;
UPDATE events SET tanggal = '2026-09-13', status = 'aktif', kursi_tersisa = 23  WHERE id = 33;
UPDATE events SET tanggal = '2026-09-20', status = 'aktif', kursi_tersisa = 400 WHERE id = 34;

-- Bulan depan dan seterusnya tetap sama (id 35-54)

-- migrations/001_init_notification.sql
-- Schema milik notification-service — jalan saat initSchema() dipanggil sebelum listen
BEGIN;

-- Log semua notifikasi yang dikirim ke pengguna
CREATE TABLE IF NOT EXISTS notifikasi (
  id          SERIAL  PRIMARY KEY,
  user_id     INTEGER NOT NULL,
  jenis       TEXT    NOT NULL
               CHECK (jenis IN (
                 'tiket_dipesan',        -- pesanan dibuat
                 'pembayaran_berhasil',  -- pembayaran sukses
                 'pembayaran_gagal',     -- pembayaran gagal
                 'tiket_siap',          -- QR tiket siap diunduh
                 'pengingat_konser',    -- H-1 konser
                 'pesanan_dibatalkan'   -- pesanan dibatalkan
               )),
  saluran     TEXT    NOT NULL
               CHECK (saluran IN ('email','push','sms')),
  payload     JSONB   NOT NULL,          -- data dinamis (nama event, nomor tiket, dsb.)
  status      TEXT    NOT NULL DEFAULT 'antrian'
               CHECK (status IN ('antrian','terkirim','gagal')),
  percobaan   INTEGER NOT NULL DEFAULT 0,
  dikirim_pada TIMESTAMPTZ,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user    ON notifikasi (user_id);
CREATE INDEX IF NOT EXISTS idx_notif_jenis   ON notifikasi (jenis);
CREATE INDEX IF NOT EXISTS idx_notif_status  ON notifikasi (status)
  WHERE status IN ('antrian','gagal');   -- partial index: hanya baris yang perlu diproses ulang

COMMIT;

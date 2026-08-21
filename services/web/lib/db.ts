/**
 * lib/db.ts — Koneksi langsung ke Neon untuk Vercel deployment
 * Di Docker/Codespaces, API routes tetap pakai gateway → microservices
 * Di Vercel, API routes pakai ini untuk query langsung ke Neon
 *
 * Gunakan fully-qualified names: event_db.events, ticket_db.pesanan, dst.
 * Karena Neon pooler pakai transaction mode (tidak support SET search_path session-level)
 */

import { Pool } from 'pg'
import { createHash } from 'crypto'

// Vercel pakai pooler URL (transaction mode, connectionless)
// Docker pakai unpooled URL (session mode, dengan search_path via options)
const DATABASE_URL = process.env.DATABASE_URL ?? ''

let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5, // max connections untuk serverless
    })
  }
  return _pool
}

export const hashPw = (pw: string) =>
  createHash('sha256').update(pw).digest('hex')

// ── EVENTS ──────────────────────────────────────────────────────────────────

export async function dbGetEvents(page = 1, limit = 20) {
  const pool = getPool()
  const offset = (page - 1) * Math.min(limit, 54)
  const lim = Math.min(limit, 54)
  const { rows } = await pool.query(
    `SELECT id, nama, tanggal, venue, kota, harga, kursi_total, kursi_tersisa
     FROM event_db.events
     WHERE status = 'aktif'
     ORDER BY tanggal ASC
     LIMIT $1 OFFSET $2`,
    [lim, offset]
  )
  const total = (await pool.query(
    `SELECT COUNT(*)::int AS n FROM event_db.events WHERE status = 'aktif'`
  )).rows[0].n
  return { data: rows, page, limit: lim, total }
}

export async function dbGetEvent(id: number) {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, nama, tanggal, venue, kota, harga, kursi_total, kursi_tersisa, status
     FROM event_db.events WHERE id = $1`,
    [id]
  )
  return rows[0] ?? null
}

// ── AUTH ─────────────────────────────────────────────────────────────────────

export async function dbRegister(nama: string, email: string, telepon: string | null, password: string) {
  const pool = getPool()
  const { rows } = await pool.query(
    `INSERT INTO event_db.users (nama, email, telepon, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nama, email, telepon`,
    [nama, email, telepon ?? null, hashPw(password)]
  )
  return rows[0]
}

export async function dbLogin(email: string, password: string) {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, nama, email, telepon
     FROM event_db.users
     WHERE email = $1 AND password_hash = $2`,
    [email, hashPw(password)]
  )
  return rows[0] ?? null
}

export async function dbChangePassword(email: string, passwordHash: string) {
  const pool = getPool()
  const { rowCount } = await pool.query(
    `UPDATE event_db.users SET password_hash = $1 WHERE email = $2`,
    [passwordHash, email]
  )
  return rowCount ?? 0
}

// ── LOCK SEATS (atomic cross-schema) ─────────────────────────────────────────

export async function dbLockSeats(
  eventId: number, qty: number, userId: number, hargaSatuan: number, idempotencyKey?: string
) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Cek idempotency
    if (idempotencyKey) {
      const { rows: cached } = await client.query(
        `SELECT respons FROM ticket_db.idempotency WHERE key = $1`,
        [idempotencyKey]
      )
      if (cached.length > 0) {
        await client.query('ROLLBACK')
        return cached[0].respons
      }
    }

    // 2. Kurangi kursi secara atomik
    const { rows: evRows } = await client.query(
      `UPDATE event_db.events
       SET kursi_tersisa = kursi_tersisa - $1
       WHERE id = $2 AND kursi_tersisa >= $1 AND status = 'aktif'
       RETURNING id, nama, harga, kursi_tersisa`,
      [qty, eventId]
    )
    if (evRows.length === 0) {
      await client.query('ROLLBACK')
      return { error: { code: 'KURSI_HABIS', message: 'Kursi habis atau event tidak aktif' } }
    }

    // 3. Buat pesanan di ticket_db
    const { rows: pesananRows } = await client.query(
      `INSERT INTO ticket_db.pesanan (user_id, event_id, qty, harga_satuan, idempotency_key)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, total_harga`,
      [userId, eventId, qty, hargaSatuan, idempotencyKey ?? null]
    )

    const respons = {
      pesananId:   pesananRows[0].id,
      eventId,
      userId,
      qty,
      totalHarga:  pesananRows[0].total_harga,
      kursiTersisa: evRows[0].kursi_tersisa,
      status:      'menunggu_pembayaran',
    }

    // 4. Simpan idempotency
    if (idempotencyKey) {
      await client.query(
        `INSERT INTO ticket_db.idempotency (key, respons) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [idempotencyKey, JSON.stringify(respons)]
      )
    }

    await client.query('COMMIT')
    return respons
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

// ── PAYMENT ──────────────────────────────────────────────────────────────────

export async function dbProcessPayment(pesananId: number, userId: number, jumlah: number, metode: string) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Cek duplikasi
    const { rows: existing } = await client.query(
      `SELECT id, status FROM payment_db.pembayaran WHERE pesanan_id = $1`,
      [pesananId]
    )
    if (existing.length > 0 && existing[0].status === 'berhasil') {
      await client.query('ROLLBACK')
      return { error: { code: 'SUDAH_DIBAYAR', message: 'Pesanan sudah dibayar' } }
    }

    const referensiExt = `EXT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const { rows: bayarRows } = await client.query(
      `INSERT INTO payment_db.pembayaran (pesanan_id, user_id, jumlah, metode, status, referensi_ext, dibayar_pada)
       VALUES ($1, $2, $3, $4, 'berhasil', $5, now())
       ON CONFLICT (pesanan_id) DO UPDATE SET status='berhasil', dibayar_pada=now()
       RETURNING id`,
      [pesananId, userId, jumlah, metode, referensiExt]
    )

    const nomorInvoice = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(bayarRows[0].id).padStart(4,'0')}`

    await client.query(
      `INSERT INTO payment_db.invoices (pembayaran_id, user_id, nomor_invoice, total)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [bayarRows[0].id, userId, nomorInvoice, jumlah]
    )

    // Update status pesanan
    await client.query(
      `UPDATE ticket_db.pesanan SET status='dibayar', diperbarui_pada=now() WHERE id=$1`,
      [pesananId]
    )

    // Generate tiket
    const pesanan = (await client.query(
      `SELECT * FROM ticket_db.pesanan WHERE id=$1`, [pesananId]
    )).rows[0]

    if (pesanan) {
      const kodeQr = `QR-${pesananId}-${userId}-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`
      await client.query(
        `INSERT INTO ticket_db.tikets (pesanan_id, user_id, event_id, kode_qr)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [pesananId, userId, pesanan.event_id, kodeQr]
      )

      // Notifikasi
      await client.query(
        `INSERT INTO notification_db.notifikasi (user_id, jenis, saluran, payload, status, percobaan, dikirim_pada)
         VALUES ($1, 'pembayaran_berhasil', 'email', $2, 'terkirim', 1, now())`,
        [userId, JSON.stringify({ pesananId, nomorInvoice, jumlah })]
      ).catch(() => {}) // notif gagal tidak batalkan payment
    }

    await client.query('COMMIT')
    return { nomorInvoice, pesananId, status: 'berhasil' }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

// ── TICKETS ──────────────────────────────────────────────────────────────────

export async function dbGetTickets(userId: number, page = 1, limit = 20) {
  const pool = getPool()
  const lim = Math.min(limit, 20)
  const offset = (page - 1) * lim
  const { rows } = await pool.query(
    `SELECT t.id, t.pesanan_id, t.event_id, t.kode_qr, t.status, t.dibuat_pada,
            p.qty, p.total_harga, p.harga_satuan
     FROM ticket_db.tikets t
     LEFT JOIN ticket_db.pesanan p ON p.id = t.pesanan_id
     WHERE t.user_id = $1
     ORDER BY t.id DESC
     LIMIT $2 OFFSET $3`,
    [userId, lim, offset]
  )
  const total = (await pool.query(
    `SELECT COUNT(*)::int AS n FROM ticket_db.tikets WHERE user_id = $1`,
    [userId]
  )).rows[0].n
  return { data: rows, page, limit: lim, total }
}

// ── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function dbGetNotifications(userId: number, page = 1, limit = 20) {
  const pool = getPool()
  const lim = Math.min(limit, 20)
  const offset = (page - 1) * lim
  const { rows } = await pool.query(
    `SELECT id, jenis, saluran, payload, status, dikirim_pada, dibuat_pada
     FROM notification_db.notifikasi
     WHERE user_id = $1
     ORDER BY id DESC
     LIMIT $2 OFFSET $3`,
    [userId, lim, offset]
  )
  const total = (await pool.query(
    `SELECT COUNT(*)::int AS n FROM notification_db.notifikasi WHERE user_id = $1`,
    [userId]
  )).rows[0].n
  return { data: rows, page, limit: lim, total }
}

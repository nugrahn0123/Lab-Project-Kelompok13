import type { Event } from './dummy-data'

// ── Visual mapping berdasarkan id — tidak perlu disimpan di DB ───────────────
const GRADIENTS = [
  'linear-gradient(135deg, #7c3aed, #db2777)',
  'linear-gradient(135deg, #0ea5e9, #7c3aed)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #22c55e, #0ea5e9)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #f97316, #ec4899)',
  'linear-gradient(135deg, #a855f7, #22c55e)',
]
const GENRES = ['Rock', 'Pop', 'Jazz', 'R&B', 'Indie', 'Folk', 'Live']

function formatTanggal(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Konversi respons backend → tipe Event yang dipakai UI
export function toEvent(e: Record<string, unknown>): Event {
  const id     = Number(e.id)
  const nama   = String(e.nama ?? e.title ?? '')
  const kota   = String(e.kota ?? e.city ?? 'Makassar')
  const venue  = String(e.venue ?? '')
  const sisaRaw = Number(e.kursi_tersisa ?? e.seats ?? 0)
  return {
    id,
    emoji:      '',
    gradient:   GRADIENTS[id % GRADIENTS.length],
    title:      nama,
    artist:     nama.split(/[—–]/)[0].trim() || nama,
    date:       formatTanggal(String(e.tanggal ?? e.dateRaw ?? '')),
    dateRaw:    String(e.tanggal ?? e.dateRaw ?? '').slice(0, 10),
    venue,
    city:       kota,
    price:      Number(e.harga ?? e.price ?? 0),
    seats:      sisaRaw,
    totalSeats: Number(e.kursi_total ?? e.totalSeats ?? 1000),
    genre:      GENRES[id % GENRES.length],
    description: `Saksikan konser ${nama} secara langsung di ${venue}, ${kota}.`,
    isHot:      sisaRaw > 0 && sisaRaw < 50,
  }
}

// ── GET /events ──────────────────────────────────────────────────────────────
export async function fetchEvents(page = 1, limit = 20): Promise<Event[]> {
  try {
    const r = await fetch(`/api/events?page=${page}&limit=${limit}`, { cache: 'no-store' })
    if (!r.ok) return []
    const json = await r.json()
    return (json.data ?? []).map(toEvent)
  } catch {
    return []
  }
}

// ── GET /events/:id ──────────────────────────────────────────────────────────
export async function fetchEvent(id: number): Promise<Event | null> {
  try {
    const r = await fetch(`/api/events/${id}`, { cache: 'no-store' })
    if (!r.ok) return null
    const json = await r.json()
    if (json?.error) return null
    return toEvent(json)
  } catch {
    return null
  }
}

// ── POST /events/:id/lock (ticket-service) ───────────────────────────────────
export async function lockSeats(
  eventId: number,
  qty: number,
  hargaSatuan: number,
  userId = 1,
): Promise<{ pesananId: number } | { error: { code: string; message: string } }> {
  try {
    const r = await fetch('/api/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, qty, userId, hargaSatuan }),
    })
    const json = await r.json()
    if (!r.ok) return { error: json.error ?? { code: 'GAGAL', message: 'Gagal mengunci kursi' } }
    return { pesananId: json.pesananId ?? json.id }
  } catch {
    return { error: { code: 'NETWORK_ERROR', message: 'Tidak dapat terhubung ke server' } }
  }
}

// ── POST /payments ───────────────────────────────────────────────────────────
export async function processPayment(
  pesananId: number,
  jumlah: number,
  metode: string,
  userId = 1,
): Promise<{ nomorInvoice: string } | { error: { code: string; message: string } }> {
  try {
    const r = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pesananId, userId, jumlah, metode }),
    })
    const json = await r.json()
    if (!r.ok) return { error: json.error ?? { code: 'GAGAL', message: 'Pembayaran gagal' } }
    return {
      nomorInvoice: json.nomorInvoice ?? json.invoice?.nomor_invoice ?? `INV-${Date.now()}`,
    }
  } catch {
    return { error: { code: 'NETWORK_ERROR', message: 'Tidak dapat terhubung ke server' } }
  }
}

// ── GET /tickets ─────────────────────────────────────────────────────────────
export async function fetchTickets(userId = 1): Promise<Record<string, unknown>[]> {
  try {
    const r = await fetch(`/api/tickets?userId=${userId}`, { cache: 'no-store' })
    if (!r.ok) return []
    const json = await r.json()
    return json.data ?? []
  } catch {
    return []
  }
}

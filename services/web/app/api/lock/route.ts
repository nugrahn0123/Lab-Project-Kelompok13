import { NextResponse } from 'next/server'
import { dbLockSeats } from '@/lib/db'

const TICKET_SVC = process.env.TICKET_SERVICE_URL

export async function POST(request: Request) {
  const body = await request.json()
  const { eventId, qty, userId, hargaSatuan } = body

  if (!eventId || !qty || !userId) {
    return NextResponse.json(
      { error: { code: 'INPUT_TIDAK_VALID', message: 'eventId, qty, userId wajib diisi' } },
      { status: 400 },
    )
  }

  // Docker/Codespaces: panggil ticket-service langsung
  if (TICKET_SVC) {
    try {
      const r = await fetch(`${TICKET_SVC}/events/${eventId}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `web-${userId}-${eventId}-${Date.now()}`,
        },
        body: JSON.stringify({ qty, userId, hargaSatuan }),
      })
      const data = await r.json()
      return NextResponse.json(data, { status: r.status })
    } catch {
      return NextResponse.json(
        { error: { code: 'SERVICE_ERROR', message: 'Ticket service tidak tersedia' } },
        { status: 503 },
      )
    }
  }

  // Vercel: direct DB (atomic cross-schema transaction)
  try {
    const idempotencyKey = `web-${userId}-${eventId}-${Math.floor(Date.now()/5000)}`
    const result = await dbLockSeats(eventId, qty, userId, hargaSatuan ?? 0, idempotencyKey)
    if ('error' in result) return NextResponse.json(result, { status: 409 })
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan' } }, { status: 500 })
  }
}

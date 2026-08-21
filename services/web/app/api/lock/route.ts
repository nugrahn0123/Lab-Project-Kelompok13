import { NextResponse } from 'next/server'

// Panggil ticket-service langsung — nginx hanya route /tickets, bukan /events/:id/lock
const TICKET_SVC = process.env.TICKET_SERVICE_URL ?? 'http://ticket-service:3002'

export async function POST(request: Request) {
  const body = await request.json()
  const { eventId, qty, userId, hargaSatuan } = body

  if (!eventId || !qty || !userId) {
    return NextResponse.json(
      { error: { code: 'INPUT_TIDAK_VALID', message: 'eventId, qty, userId wajib diisi' } },
      { status: 400 },
    )
  }

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

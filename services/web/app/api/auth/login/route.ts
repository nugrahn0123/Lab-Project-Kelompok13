import { NextResponse } from 'next/server'

const EVENT_SVC = process.env.EVENT_SERVICE_URL ?? 'http://event-service:3001'

export async function POST(request: Request) {
  const body = await request.json()
  try {
    const r = await fetch(`${EVENT_SVC}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVICE_ERROR', message: 'Service tidak tersedia' } },
      { status: 503 }
    )
  }
}

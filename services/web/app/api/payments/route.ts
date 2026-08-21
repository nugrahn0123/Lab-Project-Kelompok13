import { NextResponse } from 'next/server'

const GW = process.env.GATEWAY_URL ?? 'http://gateway:8080'

export async function POST(request: Request) {
  const body = await request.json()
  try {
    const r = await fetch(`${GW}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVICE_ERROR', message: 'Payment service tidak tersedia' } },
      { status: 503 },
    )
  }
}

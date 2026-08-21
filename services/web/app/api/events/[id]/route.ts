import { NextResponse } from 'next/server'

const GW = process.env.GATEWAY_URL ?? 'http://gateway:8080'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const r = await fetch(`${GW}/events/${id}`, { cache: 'no-store' })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Gateway tidak tersedia' }, { status: 503 })
  }
}

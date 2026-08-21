import { NextResponse } from 'next/server'

const GW = process.env.GATEWAY_URL ?? 'http://gateway:80'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  try {
    const r = await fetch(`${GW}/events?${searchParams.toString()}`, { cache: 'no-store' })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Gateway tidak tersedia', data: [] }, { status: 503 })
  }
}

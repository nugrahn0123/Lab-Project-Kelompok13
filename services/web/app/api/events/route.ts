import { NextResponse } from 'next/server'
import { dbGetEvents } from '@/lib/db'

const GW = process.env.GATEWAY_URL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // Docker/Codespaces: proxy ke gateway
  if (GW) {
    try {
      const r = await fetch(`${GW}/events?${searchParams.toString()}`, { cache: 'no-store' })
      const data = await r.json()
      return NextResponse.json(data, { status: r.status })
    } catch {
      return NextResponse.json({ error: 'Gateway tidak tersedia', data: [] }, { status: 503 })
    }
  }
  // Vercel: query Neon langsung
  try {
    const page  = parseInt(searchParams.get('page')  ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const data = await dbGetEvents(page, limit)
    return NextResponse.json(data)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'DB error', data: [] }, { status: 500 })
  }
}

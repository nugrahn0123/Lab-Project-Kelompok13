import { NextResponse } from 'next/server'
import { dbGetEvent } from '@/lib/db'

const GW = process.env.GATEWAY_URL

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (GW) {
    try {
      const r = await fetch(`${GW}/events/${id}`, { cache: 'no-store' })
      const data = await r.json()
      return NextResponse.json(data, { status: r.status })
    } catch {
      return NextResponse.json({ error: 'Gateway tidak tersedia' }, { status: 503 })
    }
  }
  try {
    const event = await dbGetEvent(parseInt(id))
    if (!event) return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 })
    return NextResponse.json(event)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
    const r = await fetch(`${GW}/events/${id}`, { cache: 'no-store' })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Gateway tidak tersedia' }, { status: 503 })
  }
}

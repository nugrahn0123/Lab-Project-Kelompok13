import { NextResponse } from 'next/server'
import { dbGetNotifications } from '@/lib/db'

const GW = process.env.GATEWAY_URL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (GW) {
    try {
      const r = await fetch(`${GW}/notifications?${searchParams.toString()}`, { cache: 'no-store' })
      const data = await r.json()
      return NextResponse.json(data, { status: r.status })
    } catch {
      return NextResponse.json({ error: 'Gateway tidak tersedia', data: [] }, { status: 503 })
    }
  }
  try {
    const userId = parseInt(searchParams.get('userId') ?? '0')
    if (!userId) return NextResponse.json({ error: 'userId wajib' }, { status: 400 })
    const data = await dbGetNotifications(userId)
    return NextResponse.json(data)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'DB error', data: [] }, { status: 500 })
  }
}

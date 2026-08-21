import { NextResponse } from 'next/server'
import { dbProcessPayment } from '@/lib/db'

const GW = process.env.GATEWAY_URL

export async function POST(request: Request) {
  const body = await request.json()
  if (GW) {
    try {
      const r = await fetch(`${GW}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json()
      return NextResponse.json(data, { status: r.status })
    } catch {
      return NextResponse.json({ error: 'Gateway tidak tersedia' }, { status: 503 })
    }
  }
  // Vercel: direct DB
  try {
    const { pesananId, userId, jumlah, metode } = body
    const result = await dbProcessPayment(pesananId, userId, jumlah, metode)
    if ('error' in result) return NextResponse.json(result, { status: 409 })
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { dbLogin } from '@/lib/db'

const EVENT_SVC = process.env.EVENT_SERVICE_URL

export async function POST(request: Request) {
  const body = await request.json()
  if (EVENT_SVC) {
    try {
      const r = await fetch(`${EVENT_SVC}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json()
      return NextResponse.json(data, { status: r.status })
    } catch {
      return NextResponse.json({ error: { code: 'SERVICE_ERROR', message: 'Service tidak tersedia' } }, { status: 503 })
    }
  }
  try {
    const { email, password } = body
    if (!email || !password) return NextResponse.json({ error: { code: 'DATA_TIDAK_LENGKAP', message: 'email dan password wajib' } }, { status: 400 })
    const user = await dbLogin(email, password)
    if (!user) return NextResponse.json({ error: { code: 'KREDENSIAL_SALAH', message: 'Email atau password salah' } }, { status: 401 })
    return NextResponse.json(user)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan' } }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

const EVENT_SVC = process.env.EVENT_SERVICE_URL ?? 'http://event-service:3001'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  if (!email || !password) {
    return NextResponse.json({ error: { code: 'DATA_TIDAK_LENGKAP', message: 'email dan password wajib' } }, { status: 400 })
  }
  try {
    const hash = createHash('sha256').update(password).digest('hex')
    // Update password_hash via SQL — panggil endpoint khusus di event-service
    const r = await fetch(`${EVENT_SVC}/users/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, passwordHash: hash }),
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json({ error: { code: 'SERVICE_ERROR', message: 'Service tidak tersedia' } }, { status: 503 })
  }
}

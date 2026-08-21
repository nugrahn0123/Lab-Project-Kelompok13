import { NextResponse } from 'next/server'
import { dbRegister } from '@/lib/db'

const EVENT_SVC = process.env.EVENT_SERVICE_URL

export async function POST(request: Request) {
  const body = await request.json()
  if (EVENT_SVC) {
    try {
      const r = await fetch(`${EVENT_SVC}/users`, {
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
    const { nama, email, telepon, password } = body
    if (!nama || !email || !password) return NextResponse.json({ error: { code: 'DATA_TIDAK_LENGKAP', message: 'nama, email, password wajib' } }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: { code: 'PASSWORD_TERLALU_PENDEK', message: 'Password minimal 6 karakter' } }, { status: 400 })
    const user = await dbRegister(nama, email, telepon ?? null, password)
    return NextResponse.json(user, { status: 201 })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === '23505') return NextResponse.json({ error: { code: 'EMAIL_SUDAH_TERDAFTAR', message: 'Email sudah dipakai' } }, { status: 409 })
    console.error(e)
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan' } }, { status: 500 })
  }
}

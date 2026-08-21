'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react'
import { saveUser } from '@/lib/auth'

export default function RegisterPage() {
  const router   = useRouter()
  const [nama,     setNama]     = useState('')
  const [email,    setEmail]    = useState('')
  const [telepon,  setTelepon]  = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [errMsg,   setErrMsg]   = useState<string | null>(null)

  const handleRegister = async () => {
    if (!nama || !email || !password) { setErrMsg('Nama, email, dan password wajib diisi'); return }
    if (password.length < 6) { setErrMsg('Password minimal 6 karakter'); return }
    setLoading(true); setErrMsg(null)
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, email, telepon, password }),
      })
      const data = await r.json()
      if (!r.ok) { setErrMsg(data.error?.message ?? 'Registrasi gagal'); return }
      saveUser(data)
      router.replace('/')
    } catch {
      setErrMsg('Tidak bisa terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-6 pt-12 pb-10">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-wt-muted text-sm mb-8">
        <ArrowLeft size={16} /> Kembali
      </button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-black text-wt-text">Daftar Akun</h1>
        <p className="text-wt-muted text-sm mt-1">Buat akun untuk beli tiket konser</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-4"
      >
        {errMsg && (
          <div className="flex items-center gap-2 bg-wt-red/10 border border-wt-red/30 rounded-2xl px-4 py-3">
            <AlertCircle size={15} className="text-wt-red flex-shrink-0" />
            <p className="text-sm text-wt-red font-medium">{errMsg}</p>
          </div>
        )}

        {/* Nama */}
        <div className="relative">
          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wt-muted" />
          <input
            type="text" placeholder="Nama lengkap" value={nama}
            onChange={e => setNama(e.target.value)}
            className="w-full bg-wt-card border border-wt-border rounded-2xl pl-10 pr-4 py-3.5 text-wt-text text-sm outline-none focus:border-wt-accent"
          />
        </div>

        {/* Email */}
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wt-muted" />
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-wt-card border border-wt-border rounded-2xl pl-10 pr-4 py-3.5 text-wt-text text-sm outline-none focus:border-wt-accent"
          />
        </div>

        {/* Telepon */}
        <div className="relative">
          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wt-muted" />
          <input
            type="tel" placeholder="Nomor telepon (opsional)" value={telepon}
            onChange={e => setTelepon(e.target.value)}
            className="w-full bg-wt-card border border-wt-border rounded-2xl pl-10 pr-4 py-3.5 text-wt-text text-sm outline-none focus:border-wt-accent"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wt-muted" />
          <input
            type={showPw ? 'text' : 'password'} placeholder="Password (min. 6 karakter)" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            className="w-full bg-wt-card border border-wt-border rounded-2xl pl-10 pr-12 py-3.5 text-wt-text text-sm outline-none focus:border-wt-accent"
          />
          <button onClick={() => setShowPw(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-wt-muted">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-wt-accent text-white font-bold py-3.5 rounded-2xl text-sm mt-2 disabled:opacity-60"
        >
          {loading ? 'Mendaftar…' : 'Daftar Sekarang'}
        </motion.button>

        <p className="text-center text-xs text-wt-muted">
          Sudah punya akun?{' '}
          <button onClick={() => router.push('/login')} className="text-wt-accent font-semibold">
            Masuk
          </button>
        </p>
      </motion.div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Music2 } from 'lucide-react'
import { saveUser } from '@/lib/auth'

export default function LoginPage() {
  const router  = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [errMsg,   setErrMsg]   = useState<string | null>(null)

  const handleLogin = async () => {
    if (!email || !password) { setErrMsg('Email dan password wajib diisi'); return }
    setLoading(true); setErrMsg(null)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await r.json()
      if (!r.ok) { setErrMsg(data.error?.message ?? 'Login gagal'); return }
      saveUser(data)
      router.replace('/')
    } catch {
      setErrMsg('Tidak bisa terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-6 pt-16 pb-10">
      {/* Logo / Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 mx-auto"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
          <Music2 size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-wt-text tracking-tight">WarTiket</h1>
        <p className="text-wt-muted text-sm mt-1">Masuk ke akunmu</p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
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

        {/* Email */}
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wt-muted" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-wt-card border border-wt-border rounded-2xl pl-10 pr-4 py-3.5 text-wt-text text-sm outline-none focus:border-wt-accent"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wt-muted" />
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-wt-card border border-wt-border rounded-2xl pl-10 pr-12 py-3.5 text-wt-text text-sm outline-none focus:border-wt-accent"
          />
          <button onClick={() => setShowPw(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-wt-muted">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Login button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-wt-accent text-white font-bold py-3.5 rounded-2xl text-sm mt-2 disabled:opacity-60"
        >
          {loading ? 'Memuat…' : 'Masuk'}
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-wt-border" />
          <span className="text-xs text-wt-muted">atau</span>
          <div className="flex-1 h-px bg-wt-border" />
        </div>

        {/* Register link */}
        <button
          onClick={() => router.push('/register')}
          className="w-full border border-wt-border text-wt-text font-semibold py-3.5 rounded-2xl text-sm"
        >
          Daftar Akun Baru
        </button>

        <p className="text-center text-xs text-wt-muted">
          Belum punya akun?{' '}
          <button onClick={() => router.push('/register')} className="text-wt-accent font-semibold">
            Daftar sekarang
          </button>
        </p>
      </motion.div>
    </div>
  )
}

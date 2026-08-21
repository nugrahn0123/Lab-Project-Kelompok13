'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import TopBar from '@/components/TopBar'
import { getUser } from '@/lib/auth'

export default function SecurityPage() {
  const router = useRouter()
  const [oldPw,   setOldPw]   = useState('')
  const [newPw,   setNewPw]   = useState('')
  const [confPw,  setConfPw]  = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg,     setMsg]     = useState<{ type: 'ok'|'err'; text: string } | null>(null)

  useEffect(() => {
    if (!getUser()) router.replace('/login')
  }, [router])

  const handleChange = async () => {
    if (!oldPw || !newPw || !confPw) { setMsg({ type: 'err', text: 'Semua field wajib diisi' }); return }
    if (newPw.length < 6) { setMsg({ type: 'err', text: 'Password baru minimal 6 karakter' }); return }
    if (newPw !== confPw) { setMsg({ type: 'err', text: 'Konfirmasi password tidak cocok' }); return }
    setLoading(true); setMsg(null)
    try {
      const user = getUser()
      if (!user) { router.replace('/login'); return }
      // Verifikasi password lama via login endpoint
      const verif = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: oldPw }),
      })
      if (!verif.ok) { setMsg({ type: 'err', text: 'Password lama salah' }); return }
      // Ganti password via register endpoint (update)
      const r = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: newPw }),
      })
      if (!r.ok) { setMsg({ type: 'err', text: 'Gagal mengganti password' }); return }
      setMsg({ type: 'ok', text: 'Password berhasil diganti' })
      setOldPw(''); setNewPw(''); setConfPw('')
    } catch {
      setMsg({ type: 'err', text: 'Tidak dapat terhubung ke server' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar variant="back" title="Ganti Password" />
      <div className="px-5 pt-6 flex flex-col gap-4">
        {msg && (
          <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 border ${
            msg.type === 'ok'
              ? 'bg-wt-green/10 border-wt-green/30 text-wt-green'
              : 'bg-wt-red/10 border-wt-red/30 text-wt-red'
          }`}>
            {msg.type === 'ok' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            <p className="text-sm font-medium">{msg.text}</p>
          </div>
        )}

        {[
          { label: 'Password lama', val: oldPw, set: setOldPw, show: showOld, toggle: () => setShowOld(p => !p) },
          { label: 'Password baru (min. 6)', val: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(p => !p) },
          { label: 'Konfirmasi password baru', val: confPw, set: setConfPw, show: showNew, toggle: () => {} },
        ].map(({ label, val, set, show, toggle }) => (
          <div key={label} className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wt-muted" />
            <input
              type={show ? 'text' : 'password'} placeholder={label} value={val}
              onChange={e => set(e.target.value)}
              className="w-full bg-wt-card border border-wt-border rounded-2xl pl-10 pr-12 py-3.5 text-wt-text text-sm outline-none focus:border-wt-accent"
            />
            <button onClick={toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-wt-muted">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        ))}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleChange}
          disabled={loading}
          className="w-full bg-wt-accent text-white font-bold py-3.5 rounded-2xl text-sm mt-2 disabled:opacity-60"
        >
          {loading ? 'Memproses…' : 'Ganti Password'}
        </motion.button>
      </div>
    </div>
  )
}

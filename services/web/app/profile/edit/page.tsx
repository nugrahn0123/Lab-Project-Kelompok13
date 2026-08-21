'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { User, Phone, AlertCircle, CheckCircle } from 'lucide-react'
import TopBar from '@/components/TopBar'
import { getUser, saveUser } from '@/lib/auth'

export default function EditProfilPage() {
  const router = useRouter()
  const [nama,    setNama]    = useState('')
  const [telepon, setTelepon] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg,     setMsg]     = useState<{ type: 'ok'|'err'; text: string } | null>(null)

  useEffect(() => {
    const u = getUser()
    if (!u) { router.replace('/login'); return }
    setNama(u.nama)
    setTelepon(u.telepon ?? '')
  }, [router])

  const handleSave = async () => {
    if (!nama.trim()) { setMsg({ type: 'err', text: 'Nama tidak boleh kosong' }); return }
    setLoading(true); setMsg(null)
    try {
      // Update localStorage (API update profil bisa ditambah nanti)
      const u = getUser()
      if (u) { saveUser({ ...u, nama: nama.trim(), telepon: telepon.trim() }) }
      setMsg({ type: 'ok', text: 'Profil berhasil diperbarui' })
    } catch {
      setMsg({ type: 'err', text: 'Gagal menyimpan' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar variant="back" title="Edit Profil" />
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

        <div className="relative">
          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wt-muted" />
          <input
            type="text" placeholder="Nama lengkap" value={nama}
            onChange={e => setNama(e.target.value)}
            className="w-full bg-wt-card border border-wt-border rounded-2xl pl-10 pr-4 py-3.5 text-wt-text text-sm outline-none focus:border-wt-accent"
          />
        </div>

        <div className="relative">
          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wt-muted" />
          <input
            type="tel" placeholder="Nomor telepon" value={telepon}
            onChange={e => setTelepon(e.target.value)}
            className="w-full bg-wt-card border border-wt-border rounded-2xl pl-10 pr-4 py-3.5 text-wt-text text-sm outline-none focus:border-wt-accent"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-wt-accent text-white font-bold py-3.5 rounded-2xl text-sm mt-2 disabled:opacity-60"
        >
          {loading ? 'Menyimpan…' : 'Simpan Perubahan'}
        </motion.button>
      </div>
    </div>
  )
}

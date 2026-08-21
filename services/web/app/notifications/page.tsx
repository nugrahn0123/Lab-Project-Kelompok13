'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Bell, CheckCircle, AlertCircle, Ticket, CreditCard, Clock } from 'lucide-react'
import TopBar from '@/components/TopBar'
import { getUser } from '@/lib/auth'

type Notif = {
  id: number
  jenis: string
  saluran: string
  payload: Record<string, unknown>
  status: string
  dikirim_pada: string | null
  dibuat_pada: string
}

const JENIS_CFG: Record<string, { label: string; Icon: typeof Bell; color: string; bg: string }> = {
  tiket_dipesan:        { label: 'Tiket Dipesan',        Icon: Ticket,       color: 'text-blue-400',   bg: 'bg-blue-400/12' },
  pembayaran_berhasil:  { label: 'Pembayaran Berhasil',  Icon: CheckCircle,  color: 'text-wt-green',   bg: 'bg-wt-green/12' },
  pembayaran_gagal:     { label: 'Pembayaran Gagal',     Icon: AlertCircle,  color: 'text-wt-red',     bg: 'bg-wt-red/12' },
  tiket_siap:           { label: 'Tiket Siap',           Icon: Ticket,       color: 'text-wt-accent2', bg: 'bg-wt-accent2/12' },
  pengingat_konser:     { label: 'Pengingat Konser',     Icon: Clock,        color: 'text-wt-yellow',  bg: 'bg-wt-yellow/12' },
  pesanan_dibatalkan:   { label: 'Pesanan Dibatalkan',   Icon: AlertCircle,  color: 'text-wt-muted',   bg: 'bg-wt-border/40' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

export default function NotificationsPage() {
  const router = useRouter()
  const [list, setList] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getUser()
    if (!user) { router.replace('/login'); return }
    fetch(`/api/notifications?userId=${user.id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setList(Array.isArray(d.data) ? d.data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [router])

  return (
    <div className="flex flex-col pb-24">
      <TopBar variant="back" title="Notifikasi" />

      <div className="px-5 pt-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-wt-border border-t-wt-accent rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-wt-card border border-wt-border flex items-center justify-center">
              <Bell size={28} className="text-wt-muted" />
            </div>
            <p className="text-wt-muted text-sm text-center">
              Belum ada notifikasi<br />
              <span className="text-xs">Beli tiket untuk mulai menerima notifikasi</span>
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="flex flex-col gap-2.5">
              {list.map((n, i) => {
                const cfg = JENIS_CFG[n.jenis] ?? { label: n.jenis, Icon: Bell, color: 'text-wt-muted', bg: 'bg-wt-border/30' }
                const { Icon } = cfg
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 bg-wt-card border border-wt-border rounded-2xl p-4"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <Icon size={18} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
                      <p className="text-xs text-wt-muted mt-0.5 leading-relaxed">
                        {typeof n.payload === 'object' && n.payload !== null
                          ? Object.entries(n.payload).map(([k, v]) => `${k}: ${v}`).join(' · ')
                          : n.jenis}
                      </p>
                      <p className="text-[10px] text-wt-muted/60 mt-1.5">
                        {timeAgo(n.dikirim_pada ?? n.dibuat_pada)}
                        {' · '}{n.saluran}
                      </p>
                    </div>
                    {n.status === 'terkirim' && (
                      <div className="w-2 h-2 rounded-full bg-wt-accent mt-1.5 flex-shrink-0" />
                    )}
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

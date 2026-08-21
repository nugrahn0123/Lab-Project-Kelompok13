'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Bell, CreditCard, User, ChevronRight,
  Settings, LogOut, Ticket, Shield,
} from 'lucide-react'
import TopBar from '@/components/TopBar'
import { myTickets } from '@/lib/dummy-data'

const MENU = [
  { icon: Ticket,     label: 'Tiket Saya',          desc: 'Kelola tiket kamu',      href: '/tickets' },
  { icon: Bell,       label: 'Notifikasi',           desc: '2 notifikasi baru',      href: '#' },
  { icon: CreditCard, label: 'Riwayat Pembayaran',   desc: 'Semua transaksi',        href: '#' },
  { icon: User,       label: 'Edit Profil',          desc: 'Perbarui info akunmu',   href: '#' },
  { icon: Shield,     label: 'Keamanan',             desc: 'Password & privasi',     href: '#' },
  { icon: Settings,   label: 'Pengaturan',           desc: 'Preferensi aplikasi',    href: '#' },
]

export default function ProfilePage() {
  const router = useRouter()
  const activeTickets = myTickets.filter(t => t.status === 'aktif').length

  const STATS = [
    { num: activeTickets,      label: 'Tiket Aktif' },
    { num: myTickets.length,   label: 'Total Konser', divider: true },
    { num: 2,                  label: 'Notifikasi',   divider: true },
  ]

  return (
    <div className="flex flex-col pb-24">
      <TopBar variant="home" />

      {/* Profile hero */}
      <div className="flex flex-col items-center px-5 py-8">
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4"
          style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          whileTap={{ scale: 0.93 }}
        >
          <span className="text-[28px] font-black text-white tracking-tight select-none">BS</span>
        </motion.div>

        <motion.h2
          className="text-xl font-extrabold text-wt-text"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          Budi Santoso
        </motion.h2>
        <motion.p
          className="text-sm text-wt-muted mt-1 mb-5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          budi@example.com
        </motion.p>

        {/* Stats row */}
        <motion.div
          className="flex w-full bg-wt-card border border-wt-border rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          {STATS.map(s => (
            <div
              key={s.label}
              className={`flex-1 py-4 text-center ${s.divider ? 'border-l border-wt-border' : ''}`}
            >
              <div className="text-2xl font-extrabold text-wt-accent2">{s.num}</div>
              <div className="text-[11px] text-wt-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Menu */}
      <div className="px-5 flex flex-col gap-2.5">
        {MENU.map(({ icon: Icon, label, desc, href }, i) => (
          <motion.button
            key={label}
            className="flex items-center gap-3.5 p-4 bg-wt-card border border-wt-border rounded-2xl w-full text-left"
            whileHover={{ borderColor: '#7c3aed' }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.28 }}
            onClick={() => href !== '#' && router.push(href)}
          >
            <div className="w-10 h-10 rounded-xl bg-wt-accent/10 flex items-center justify-center flex-shrink-0">
              <Icon size={17} className="text-wt-accent2" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-wt-text">{label}</p>
              <p className="text-xs text-wt-muted">{desc}</p>
            </div>
            <ChevronRight size={15} className="text-wt-border flex-shrink-0" />
          </motion.button>
        ))}

        {/* Logout */}
        <motion.button
          className="flex items-center gap-3.5 p-4 bg-wt-card border border-wt-red/30 rounded-2xl w-full mt-1"
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: MENU.length * 0.05 + 0.3 }}
        >
          <div className="w-10 h-10 rounded-xl bg-wt-red/10 flex items-center justify-center flex-shrink-0">
            <LogOut size={17} className="text-wt-red" />
          </div>
          <span className="text-sm font-semibold text-wt-red">Keluar</span>
        </motion.button>
      </div>
    </div>
  )
}

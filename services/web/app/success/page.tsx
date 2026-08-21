'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'
import { events as dummyEvents, formatPrice } from '@/lib/dummy-data'

const METHOD_LABELS: Record<string, string> = {
  transfer: 'Transfer Bank',
  card:     'Kartu Kredit/Debit',
  wallet:   'Dompet Digital',
  qris:     'QRIS',
}

function SuccessContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const eventId  = parseInt(searchParams.get('eventId') ?? '1')
  const qty      = parseInt(searchParams.get('qty')     ?? '1')
  const total    = parseInt(searchParams.get('total')   ?? '0')
  const method   = searchParams.get('method')           ?? 'transfer'
  const invoice  = searchParams.get('invoice')          ?? (() => {
    const d = new Date(); const p = (n: number) => String(n).padStart(2,'0')
    return `INV-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(Math.floor(Math.random()*9999))}`
  })()
  const event    = dummyEvents.find(e => e.id === eventId)

  if (!event) { router.push('/'); return null }

  const rows = [
    { k: 'No. Invoice', v: invoice },
    { k: 'Konser',      v: event.title },
    { k: 'Jumlah',      v: `${qty} tiket` },
    { k: 'Total Bayar', v: formatPrice(total), accent: true },
    { k: 'Metode',      v: METHOD_LABELS[method] ?? method },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5 py-10">

      {/* Animated checkmark */}
      <motion.div
        className="w-24 h-24 rounded-full bg-wt-green/15 flex items-center justify-center mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 220 }}
        >
          <Check size={42} className="text-wt-green" strokeWidth={3} />
        </motion.div>
      </motion.div>

      <motion.h1
        className="text-[26px] font-extrabold text-wt-text mb-2 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Pembayaran Berhasil!
      </motion.h1>
      <motion.p
        className="text-wt-muted text-sm text-center mb-8 leading-relaxed"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Tiketmu sudah siap. Tunjukkan kode QR<br />kepada petugas saat masuk venue.
      </motion.p>

      {/* Invoice card */}
      <motion.div
        className="w-full bg-wt-card border border-wt-border rounded-2xl p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {rows.map(r => (
          <div key={r.k} className="flex justify-between py-2.5 border-b border-wt-border last:border-0">
            <span className="text-xs text-wt-muted">{r.k}</span>
            <span className={`text-xs font-semibold ${r.accent ? 'text-wt-accent2' : 'text-wt-text'}`}>{r.v}</span>
          </div>
        ))}
      </motion.div>

      {/* Buttons */}
      <motion.div
        className="w-full flex flex-col gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          className="w-full h-14 rounded-2xl font-bold text-white text-base"
          style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
          whileHover={{ boxShadow: '0 0 32px rgba(249,115,22,0.5)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/tickets')}
        >
          Lihat Tiket Saya
        </motion.button>
        <motion.button
          className="w-full h-14 rounded-2xl font-semibold text-wt-text text-sm bg-wt-card border border-wt-border"
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/')}
        >
          Kembali ke Beranda
        </motion.button>
      </motion.div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-wt-border border-t-wt-accent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

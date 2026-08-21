'use client'

import { use, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Heart, MapPin, Calendar, Music, Users,
  ChevronDown, ChevronUp, Minus, Plus,
} from 'lucide-react'
import { events as dummyEvents, formatPrice, getSeatsColor } from '@/lib/dummy-data'
import { fetchEvent } from '@/lib/api'
import type { Event } from '@/lib/dummy-data'

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router  = useRouter()
  const numId   = parseInt(id)

  const [event,    setEvent]    = useState<Event | null>(dummyEvents.find(e => e.id === numId) ?? null)
  const [qty,      setQty]      = useState(1)
  const [liked,    setLiked]    = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetchEvent(numId).then(data => { if (data) setEvent(data) })
  }, [numId])

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-wt-muted">Memuat event…</p>
      </div>
    )
  }

  const serviceFee   = 10000
  const total        = event.price * qty + serviceFee
  const color        = getSeatsColor(event.seats, event.totalSeats)
  const seatsPercent = Math.round((event.seats / event.totalSeats) * 100)

  const colorMap = {
    green:  { text: 'text-wt-green',  bar: 'bg-wt-green'  },
    yellow: { text: 'text-wt-yellow', bar: 'bg-wt-yellow' },
    red:    { text: 'text-wt-red',    bar: 'bg-wt-red'    },
  }[color]

  const infoItems = [
    { label: 'Tanggal',   value: event.date,               icon: <Calendar size={13} className="text-wt-accent2" /> },
    { label: 'Venue',     value: event.venue,              icon: <MapPin   size={13} className="text-wt-accent2" /> },
    { label: 'Harga',     value: formatPrice(event.price), icon: <Music    size={13} className="text-wt-accent2" />, accent: true },
    { label: 'Sisa Kursi',value: event.seats.toLocaleString(), icon: <Users size={13} className={colorMap.text} /> },
  ]

  return (
    <div className="flex flex-col pb-10">

      {/* ── Hero ── */}
      <div className="relative">
        <div
          className="w-full h-64 flex items-center justify-center overflow-hidden"
          style={{ background: event.gradient }}
        >
          {/* Abstract cover art */}
          <div style={{ position:'absolute',width:320,height:320,top:-90,right:-80,background:'rgba(255,255,255,0.08)',borderRadius:'50%',pointerEvents:'none' }} />
          <div style={{ position:'absolute',width:200,height:200,bottom:-60,left:-40,background:'rgba(0,0,0,0.2)',borderRadius:'50%',pointerEvents:'none' }} />
          <div style={{ position:'absolute',width:110,height:110,top:'38%',left:'28%',background:'rgba(255,255,255,0.06)',borderRadius:'50%',pointerEvents:'none' }} />
          {/* Artist name watermark */}
          <div className="absolute bottom-10 left-5 right-5 overflow-hidden pointer-events-none">
            <p className="text-white/20 text-[52px] font-black leading-none truncate tracking-tighter select-none">
              {event.artist}
            </p>
          </div>
          {event.isHot && (
            <motion.div
              className="absolute top-4 right-4 bg-wt-accent text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              HOT
            </motion.div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-wt-surface to-transparent" />
        </div>

        {/* Back button over hero */}
        <motion.button
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          whileTap={{ scale: 0.82 }}
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} className="text-white" />
        </motion.button>
      </div>

      {/* ── Content ── */}
      <div className="px-5 pt-3">

        {/* Chips */}
        <div className="flex gap-2 flex-wrap mb-3">
          {[event.genre, event.city, '18+'].map(tag => (
            <span key={tag} className="text-xs px-3 py-1 rounded-full bg-wt-card border border-wt-border text-wt-muted">
              {tag}
            </span>
          ))}
        </div>

        <motion.h1
          className="text-[24px] font-extrabold text-wt-text leading-tight mb-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {event.title}
        </motion.h1>
        <p className="text-wt-muted text-sm mb-5">{event.artist}</p>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {infoItems.map(item => (
            <div key={item.label} className="bg-wt-card border border-wt-border rounded-2xl p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                {item.icon}
                <span className="text-[10px] text-wt-muted uppercase tracking-wide font-semibold">{item.label}</span>
              </div>
              <span className={`text-sm font-bold ${item.accent ? 'text-wt-accent2' : 'text-wt-text'}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Seat availability bar */}
        <div className="bg-wt-card border border-wt-border rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-wt-muted font-semibold">Ketersediaan Kursi</span>
            <span className={`text-xs font-bold ${colorMap.text}`}>
              {event.seats.toLocaleString()} / {event.totalSeats.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-1.5 bg-wt-border rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${colorMap.bar} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${seatsPercent}%` }}
              transition={{ delay: 0.35, duration: 0.9, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-5">
          <h3 className="text-sm font-bold text-wt-text mb-2">Tentang Konser</h3>
          <p className={`text-sm text-wt-muted leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
            {event.description}
          </p>
          <button
            className="mt-2 text-xs text-wt-accent2 flex items-center gap-0.5 font-medium"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded
              ? <><ChevronUp   size={13} /> Lebih sedikit</>
              : <><ChevronDown size={13} /> Selengkapnya</>}
          </button>
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-between bg-wt-card border border-wt-border rounded-2xl p-4 mb-5">
          <div>
            <p className="text-sm font-semibold text-wt-text">Jumlah Tiket</p>
            <p className="text-xs text-wt-muted mt-0.5">Maks. 5 tiket per pembelian</p>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="w-9 h-9 rounded-xl bg-wt-border flex items-center justify-center text-wt-text"
              onClick={() => setQty(q => Math.max(1, q - 1))}
            >
              <Minus size={16} />
            </motion.button>
            <AnimatePresence mode="wait">
              <motion.span
                key={qty}
                className="text-lg font-extrabold text-wt-text w-6 text-center"
                initial={{ opacity: 0, y: -10, scale: 0.7 }}
                animate={{ opacity: 1, y: 0,   scale: 1   }}
                exit={{    opacity: 0, y:  10, scale: 0.7 }}
                transition={{ duration: 0.14 }}
              >
                {qty}
              </motion.span>
            </AnimatePresence>
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="w-9 h-9 rounded-xl bg-wt-accent flex items-center justify-center text-white"
              onClick={() => setQty(q => Math.min(5, q + 1))}
            >
              <Plus size={16} />
            </motion.button>
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.82 }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border flex-shrink-0 transition-colors ${
              liked ? 'bg-wt-red/15 border-wt-red/50' : 'bg-wt-card border-wt-border'
            }`}
            onClick={() => setLiked(v => !v)}
          >
            <Heart size={20} className={liked ? 'fill-wt-red text-wt-red' : 'text-wt-muted'} />
          </motion.button>

          <motion.button
            className="flex-1 h-14 rounded-2xl font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
            whileHover={{ boxShadow: '0 0 32px rgba(249,115,22,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/payment?eventId=${event.id}&qty=${qty}`)}
          >
            Beli Tiket — {formatPrice(total)}
          </motion.button>
        </div>

      </div>
    </div>
  )
}

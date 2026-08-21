'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Search, Sliders, Zap, List, Bell, User } from 'lucide-react'
import FeaturedCard from '@/components/FeaturedCard'
import EventCard from '@/components/EventCard'
import { events as dummyEvents } from '@/lib/dummy-data'
import { fetchEvents } from '@/lib/api'
import type { Event } from '@/lib/dummy-data'

const CATS = ['Semua', 'Makassar', 'Jakarta', 'Rock', 'Pop', 'Jazz', 'Indie', 'R&B', 'Folk']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Selamat malam'
  if (h < 12) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export default function HomePage() {
  const [cat, setCat]         = useState('Semua')
  const [allEvents, setAll]   = useState<Event[]>(dummyEvents)
  const router = useRouter()

  useEffect(() => {
    fetchEvents(1, 50).then(data => { if (data.length > 0) setAll(data) })
  }, [])

  const featured = allEvents.filter(e => e.isHot)
  const list     = cat === 'Semua' ? allEvents : allEvents.filter(e => e.city === cat || e.genre === cat)

  return (
    <div className="flex flex-col pb-28">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden">
        {/* Warm glow orb */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div className="relative flex items-start justify-between px-5 pt-12 pb-6">
          <div>
            <p className="text-wt-muted text-[13px] font-medium mb-1">{getGreeting()}</p>
            <h1 className="text-[30px] font-black text-wt-text leading-[1.15] tracking-tight">
              Konser<br />
              <span className="gradient-text">Indonesia</span> 2026
            </h1>
          </div>
          <div className="flex gap-2 mt-1">
            <motion.button
              whileTap={{ scale: 0.85 }}
              className="w-9 h-9 rounded-full bg-wt-card border border-wt-border flex items-center justify-center"
            >
              <Bell size={16} className="text-wt-muted" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              className="w-9 h-9 rounded-full bg-wt-card border border-wt-border flex items-center justify-center"
              onClick={() => router.push('/profile')}
            >
              <User size={16} className="text-wt-muted" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Search bar ── */}
      <motion.div
        className="mx-5 mb-6 flex items-center gap-3 bg-wt-card border border-wt-border rounded-2xl px-4 py-3.5 cursor-pointer"
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push('/explore')}
      >
        <Search size={16} className="text-wt-muted flex-shrink-0" />
        <span className="text-wt-muted text-[13px] flex-1">Cari konser, artis, kota…</span>
        <div className="w-8 h-8 rounded-xl bg-wt-border flex items-center justify-center flex-shrink-0">
          <Sliders size={13} className="text-wt-muted" />
        </div>
      </motion.div>

      {/* ── Featured section ── */}
      <div className="flex justify-between items-center px-5 mb-3">
        <span className="text-[15px] font-black text-wt-text tracking-tight flex items-center gap-1.5">
          <Zap size={15} className="text-wt-accent" fill="#f97316" />
          Sedang Ramai
        </span>
        <button className="text-[12px] text-wt-accent font-bold">Lihat semua</button>
      </div>

      <div className="flex gap-3 px-5 pb-6 overflow-x-auto no-scrollbar">
        {featured.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.09, duration: 0.32 }}
          >
            <FeaturedCard event={event} onClick={() => router.push(`/event/${event.id}`)} />
          </motion.div>
        ))}
      </div>

      {/* ── Category chips ── */}
      <div className="flex gap-2 px-5 pb-5 overflow-x-auto no-scrollbar">
        {CATS.map(c => (
          <motion.button
            key={c}
            whileTap={{ scale: 0.88 }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
              cat === c
                ? 'bg-wt-accent border-wt-accent text-white'
                : 'bg-wt-card border-wt-border text-wt-muted'
            }`}
            onClick={() => setCat(c)}
          >
            {c}
          </motion.button>
        ))}
      </div>

      {/* ── Event list ── */}
      <div className="flex justify-between items-center px-5 mb-3">
        <span className="text-[15px] font-black text-wt-text tracking-tight flex items-center gap-1.5">
          <List size={15} className="text-wt-muted" />
          Semua Konser
        </span>
        <span className="text-[12px] text-wt-muted font-medium">{list.length} konser</span>      </div>

      <div className="flex flex-col gap-2.5 px-5">
        {list.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 + 0.1, duration: 0.28 }}
          >
            <EventCard event={event} onClick={() => router.push(`/event/${event.id}`)} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}


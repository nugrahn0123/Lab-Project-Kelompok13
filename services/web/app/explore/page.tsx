'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Search, X, TrendingUp, Zap, Star, Music, Headphones, Mic, Music2, SearchX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import EventCard from '@/components/EventCard'
import { events as dummyEvents } from '@/lib/dummy-data'
import { fetchEvents } from '@/lib/api'
import type { Event } from '@/lib/dummy-data'

const GENRES: { name: string; Icon: LucideIcon; gradient: string }[] = [
  { name: 'Rock',  Icon: Zap,        gradient: 'linear-gradient(135deg, #7c3aed, #db2777)' },
  { name: 'Pop',   Icon: Star,       gradient: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' },
  { name: 'Jazz',  Icon: Music,      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { name: 'Indie', Icon: Headphones, gradient: 'linear-gradient(135deg, #f97316, #ec4899)' },
  { name: 'R&B',   Icon: Mic,        gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)' },
  { name: 'Folk',  Icon: Music2,     gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
]

export default function ExplorePage() {
  const [query, setQuery]       = useState('')
  const [allEvents, setAll]     = useState<Event[]>(dummyEvents)
  const router = useRouter()

  useEffect(() => {
    fetchEvents(1, 50).then(data => { if (data.length > 0) setAll(data) })
  }, [])

  const results = query.trim()
    ? allEvents.filter(e =>
        [e.title, e.artist, e.city, e.genre]
          .some(s => s.toLowerCase().includes(query.toLowerCase()))
      )
    : []

  return (
    <div className="flex flex-col pb-24">
      {/* Search topbar */}
      <div className="sticky top-0 z-40 bg-wt-surface/95 backdrop-blur-xl border-b border-wt-border px-5 py-4">
        <div className="flex items-center gap-3 bg-wt-card border border-wt-border rounded-2xl px-4 py-3">
          <Search size={17} className="text-wt-muted flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari konser, artis, kota…"
            className="bg-transparent text-wt-text text-sm flex-1 outline-none placeholder:text-wt-muted"
          />
          {query && (
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => setQuery('')}>
              <X size={16} className="text-wt-muted" />
            </motion.button>
          )}
        </div>
      </div>

      {!query ? (
        <>
          {/* Genre grid */}
          <div className="px-5 pt-5">
            <h2 className="text-sm font-bold text-wt-text mb-3">Jelajahi Genre</h2>
            <div className="grid grid-cols-3 gap-3">
              {GENRES.map((g, i) => {
                const Icon = g.Icon
                return (
                  <motion.button
                    key={g.name}
                    className="rounded-2xl overflow-hidden aspect-square flex flex-col items-center justify-center gap-2"
                    style={{ background: g.gradient }}
                    whileTap={{ scale: 0.93 }}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setQuery(g.name)}
                  >
                    <Icon size={28} className="text-white" strokeWidth={1.8} />
                    <span className="text-white text-xs font-bold">{g.name}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Trending */}
          <div className="px-5 mt-6">
            <h2 className="text-sm font-bold text-wt-text flex items-center gap-1.5 mb-3">
              <TrendingUp size={14} className="text-wt-accent2" />
              Trending Sekarang
            </h2>
            <div className="flex flex-col gap-3">
              {events.filter(e => e.isHot).map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 + 0.2 }}
                >
                  <EventCard
                    event={event}
                    onClick={() => router.push(`/event/${event.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="px-5 pt-4">
          <p className="text-wt-muted text-xs mb-3">
            {results.length} hasil untuk &ldquo;{query}&rdquo;
          </p>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <SearchX size={44} className="text-wt-muted mb-3" strokeWidth={1.5} />
              <p className="text-wt-text font-semibold">Tidak ditemukan</p>
              <p className="text-wt-muted text-sm mt-1">Coba kata kunci lain</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <EventCard
                    event={event}
                    onClick={() => router.push(`/event/${event.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

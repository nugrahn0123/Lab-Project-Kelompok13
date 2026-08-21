'use client'

import { motion } from 'framer-motion'
import { Calendar, MapPin } from 'lucide-react'
import { type Event, formatPrice, getSeatsColor } from '@/lib/dummy-data'

function MiniCover({ gradient, id }: { gradient: string; id: number }) {
  return (
    <div
      className="relative w-[66px] h-[66px] rounded-2xl overflow-hidden flex-shrink-0"
      style={{ background: gradient }}
    >
      {/* Subtle overlay shapes */}
      <div style={{ position:'absolute',width:80,height:80,top:-20,right:-20,background:'rgba(255,255,255,0.1)',borderRadius:'50%',pointerEvents:'none' }} />
      <div style={{ position:'absolute',width:50,height:50,bottom:-15,left:-15,background:'rgba(0,0,0,0.18)',borderRadius:'50%',pointerEvents:'none' }} />
      {/* Artist initial */}
      <div className="absolute inset-0 flex items-end justify-start p-1.5">
        <span className="text-[20px] font-black text-white/20 leading-none select-none"
          style={{ fontStyle: 'italic' }}>
          {id}
        </span>
      </div>
    </div>
  )
}

interface EventCardProps {
  event: Event
  onClick: () => void
}

export default function EventCard({ event, onClick }: EventCardProps) {
  const color = getSeatsColor(event.seats, event.totalSeats)
  const badge = {
    green:  'text-wt-green  bg-wt-green/15',
    yellow: 'text-wt-yellow bg-wt-yellow/15',
    red:    'text-wt-red    bg-wt-red/15',
  }[color]

  return (
    <motion.div
      className="flex gap-3.5 bg-wt-card border border-wt-border rounded-2xl p-3.5 cursor-pointer"
      whileHover={{ borderColor: '#f97316', boxShadow: '0 4px 24px rgba(249,115,22,0.12)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <MiniCover gradient={event.gradient} id={event.id} />

      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-[10px] text-wt-muted uppercase tracking-[0.12em] font-bold mb-0.5">{event.genre}</p>
        <h4 className="text-[14px] font-black text-wt-text truncate mb-1.5 tracking-tight">{event.title}</h4>
        <div className="flex items-center gap-1 text-wt-muted text-[11px] mb-2">
          <Calendar size={10} strokeWidth={2.5} />
          <span>{event.date}</span>
          <span className="text-wt-border">·</span>
          <MapPin size={10} strokeWidth={2.5} />
          <span className="truncate">{event.city}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-black text-wt-accent tracking-tight">{formatPrice(event.price)}</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge}`}>
            {event.seats.toLocaleString()} tersisa
          </span>
        </div>
      </div>
    </motion.div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { Flame, MapPin, Calendar } from 'lucide-react'
import { type Event, formatPrice } from '@/lib/dummy-data'

// Abstract cover-art decoration – 4 rotating patterns
function CoverDeco({ id }: { id: number }) {
  const n = id % 4
  const c = 'absolute rounded-full pointer-events-none'
  return (
    <>
      {n === 0 && (
        <>
          <div className={c} style={{ width:200,height:200,top:-60,right:-60,background:'rgba(255,255,255,0.09)' }} />
          <div className={c} style={{ width:100,height:100,bottom:-30,left:-20,background:'rgba(0,0,0,0.2)' }} />
          <div style={{ position:'absolute',width:70,height:70,top:'50%',left:'50%',transform:'translate(-50%,-50%) rotate(45deg)',background:'rgba(255,255,255,0.07)',borderRadius:14,pointerEvents:'none' }} />
        </>
      )}
      {n === 1 && (
        <>
          <div className={c} style={{ width:180,height:180,top:-50,left:-40,background:'rgba(255,255,255,0.07)' }} />
          <div className={c} style={{ width:90,height:90,bottom:-20,right:-10,background:'rgba(255,255,255,0.13)' }} />
          <div style={{ position:'absolute',height:3,top:'55%',left:0,right:0,background:'rgba(255,255,255,0.14)',transform:'rotate(-12deg)',pointerEvents:'none' }} />
        </>
      )}
      {n === 2 && (
        <>
          <div className={c} style={{ width:160,height:160,top:-40,left:'30%',background:'rgba(255,255,255,0.08)' }} />
          <div className={c} style={{ width:120,height:120,bottom:-30,left:-30,background:'rgba(0,0,0,0.16)' }} />
          <div style={{ position:'absolute',width:50,height:50,bottom:20,right:20,background:'rgba(255,255,255,0.12)',borderRadius:8,transform:'rotate(25deg)',pointerEvents:'none' }} />
        </>
      )}
      {n === 3 && (
        <>
          <div className={c} style={{ width:220,height:220,bottom:-80,right:-60,background:'rgba(255,255,255,0.07)' }} />
          <div className={c} style={{ width:80,height:80,top:-20,left:-10,background:'rgba(0,0,0,0.2)' }} />
          <div className={c} style={{ width:60,height:60,top:'30%',right:'22%',background:'rgba(255,255,255,0.1)' }} />
        </>
      )}
    </>
  )
}

interface FeaturedCardProps {
  event: Event
  onClick: () => void
}

export default function FeaturedCard({ event, onClick }: FeaturedCardProps) {
  return (
    <motion.div
      className="flex-shrink-0 w-[260px] rounded-3xl overflow-hidden bg-wt-card cursor-pointer"
      whileHover={{ y: -6, boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
    >
      {/* Cover art */}
      <div
        className="relative w-full h-[155px] overflow-hidden"
        style={{ background: event.gradient }}
      >
        <CoverDeco id={event.id} />
        {/* Artist initial watermark */}
        <div className="absolute bottom-3 left-4 text-[42px] font-black text-white/20 leading-none select-none">
          {event.artist.charAt(0)}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-wt-card to-transparent" />
        {event.isHot && (
          <div className="absolute top-3 left-3 bg-wt-accent text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
            <Flame size={8} strokeWidth={3} />
            Hot
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pb-4 pt-2">
        <p className="text-[10px] text-wt-muted uppercase tracking-[0.15em] font-bold mb-1.5">{event.genre}</p>
        <h3 className="text-[15px] font-black text-wt-text leading-tight mb-3 line-clamp-2 tracking-tight">{event.title}</h3>
        <div className="flex items-center gap-1.5 text-wt-muted text-[11px] mb-1">
          <Calendar size={10} strokeWidth={2.5} />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-wt-muted text-[11px] mb-4">
          <MapPin size={10} strokeWidth={2.5} />
          <span className="truncate">{event.city}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[16px] font-black text-wt-accent">{formatPrice(event.price)}</span>
          <span className="text-[11px] text-wt-muted">{event.seats.toLocaleString()} kursi</span>
        </div>
      </div>
    </motion.div>
  )
}

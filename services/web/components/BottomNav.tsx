'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Search, Ticket, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',        icon: Home,   label: 'Beranda' },
  { href: '/explore', icon: Search, label: 'Cari' },
  { href: '/tickets', icon: Ticket, label: 'Tiket' },
  { href: '/profile', icon: User,   label: 'Profil' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50"
      style={{ width: 'calc(100% - 32px)', maxWidth: 398 }}
    >
      {/* Liquid glass pill — iOS style */}
      <div
        className="flex items-center rounded-[32px] px-2 py-2"
        style={{
          background: 'rgba(255, 255, 255, 0.07)',
          backdropFilter: 'saturate(180%) blur(40px)',
          WebkitBackdropFilter: 'saturate(180%) blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.13)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.09) inset',
        }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <motion.button
              key={href}
              className="relative flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-[24px]"
              onClick={() => router.push(href)}
              whileTap={{ scale: 0.88 }}
            >
              {/* Active glow bubble */}
              {active && (
                <motion.div
                  layoutId="glass-active"
                  className="absolute inset-0 rounded-[24px]"
                  style={{
                    background: 'rgba(124, 58, 237, 0.18)',
                    boxShadow: '0 0 16px rgba(124,58,237,0.25) inset',
                    border: '1px solid rgba(124,58,237,0.22)',
                  }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}

              <motion.div
                className="relative z-10"
                animate={{ y: active ? -1 : 0, scale: active ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              >
                <Icon
                  size={20}
                  className={active ? 'text-violet-400' : 'text-white/40'}
                  strokeWidth={active ? 2.4 : 1.8}
                />
              </motion.div>

              <span
                className={`relative z-10 text-[9.5px] font-semibold tracking-wide ${
                  active ? 'text-violet-300' : 'text-white/35'
                }`}
              >
                {label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}

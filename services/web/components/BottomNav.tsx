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
      <div
        className="flex items-center rounded-[32px] px-2 py-2"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(48px) saturate(160%)',
          WebkitBackdropFilter: 'blur(48px) saturate(160%)',
          border: '1px solid rgba(255, 255, 255, 0.11)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.28)',
        }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <motion.button
              key={href}
              className="relative flex-1 flex flex-col items-center gap-0.5 py-2.5"
              onClick={() => router.push(href)}
              whileTap={{ scale: 0.88 }}
            >
              <motion.div
                animate={{ y: active ? -1 : 0, scale: active ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              >
                <Icon
                  size={21}
                  className={active ? 'text-white' : 'text-white/38'}
                  strokeWidth={active ? 2.5 : 1.7}
                />
              </motion.div>
              <span className={	ext-[9.5px] font-semibold tracking-wide + (active ? 'text-white/90' : 'text-white/35')}>
                {label}
              </span>
              {active && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white/55"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
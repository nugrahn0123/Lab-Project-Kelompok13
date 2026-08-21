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
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex bg-wt-surface/95 backdrop-blur-xl border-t border-wt-border">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <motion.button
              key={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 relative"
              onClick={() => router.push(href)}
              whileTap={{ scale: 0.85 }}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-2 top-1 bottom-0.5 rounded-2xl bg-wt-accent/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <motion.div
                animate={{ y: active ? -1 : 0, scale: active ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                <Icon
                  size={20}
                  className={active ? 'text-wt-accent2' : 'text-wt-muted'}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </motion.div>
              <span
                className={`text-[10px] font-semibold ${active ? 'text-wt-accent2' : 'text-wt-muted'}`}
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

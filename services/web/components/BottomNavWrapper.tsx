'use client'

import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'

const HIDE_ROUTES = ['/event', '/payment', '/success', '/login', '/register', '/notifications', '/profile/edit', '/profile/security']

export default function BottomNavWrapper() {
  const pathname = usePathname()
  if (HIDE_ROUTES.some(r => pathname.startsWith(r))) return null
  return <BottomNav />
}

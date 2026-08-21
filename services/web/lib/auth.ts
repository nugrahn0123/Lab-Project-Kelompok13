export interface AuthUser {
  id: number
  nama: string
  email: string
  telepon?: string
}

const KEY = 'wt_user'

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function saveUser(user: AuthUser) {
  localStorage.setItem(KEY, JSON.stringify(user))
}

export function clearUser() {
  localStorage.removeItem(KEY)
}

export function isLoggedIn(): boolean {
  return getUser() !== null
}

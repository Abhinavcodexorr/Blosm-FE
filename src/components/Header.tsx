'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BlosmLogo from './BlosmLogo'
import { useLoginModal } from '@/context/LoginModalContext'
import { getMyBookings } from '@/lib/api'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
]

type Appointment = {
  _id?: string;
  service?: string;
  date?: string;
  time?: string;
  status?: string;
  [key: string]: unknown;
};

/** Outline user mark: round head + shoulders, balanced for ~22–24px display */
function ProfileOutlineIcon({ className = 'h-6 w-6 shrink-0' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.25" />
      <path d="M6.5 20.25v-.75a5.5 5.5 0 0 1 5.5-5.5h0a5.5 5.5 0 0 1 5.5 5.5v.75" />
    </svg>
  )
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const profileRef = useRef<HTMLLIElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { openLogin, token, user, logout } = useLoginModal()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if ((profileOpen || mobileMenuOpen) && token) {
      setAppointmentsLoading(true)
      getMyBookings(token)
        .then((res: { data?: unknown; appointments?: Appointment[] }) => {
          const raw = res?.data ?? res
          const list = Array.isArray(raw)
            ? raw
            : (raw as { appointments?: Appointment[] })?.appointments ?? res?.appointments ?? []
          setAppointments(list)
        })
        .catch(() => setAppointments([]))
        .finally(() => setAppointmentsLoading(false))
    }
  }, [profileOpen, mobileMenuOpen, token])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const isHomeAtTop = pathname === '/' && !scrolled
  const isOverHero = isHomeAtTop
  const headerBg = isOverHero ? 'bg-transparent' : 'bg-white/95 backdrop-blur-sm'
  const borderClass = isOverHero ? 'border-transparent' : 'border-rose-200/50'
  const textClass = isOverHero ? 'text-white' : 'text-charcoal-800'
  const linkClass = isOverHero ? 'text-white/90 hover:text-amber-200' : 'text-charcoal-600 hover:text-amber-800'

  const formatDate = (d?: string) => {
    if (!d) return ''
    const date = new Date(d)
    if (Number.isNaN(date.getTime())) return d
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${headerBg} border-b ${borderClass} transition-all duration-300`}>
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center transition-opacity hover:opacity-90">
          <BlosmLogo
            variant={isOverHero ? "light" : "dark"}
            size="sm"
            showTagline={true}
          />
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-sm font-medium transition-colors ${linkClass}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {token && (
            <li>
              <Link
                href="/wallet"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/wallet'
                    ? isOverHero
                      ? 'text-amber-200'
                      : 'text-amber-800'
                    : linkClass
                }`}
              >
                Wallet
              </Link>
            </li>
          )}
          <li className="relative" ref={profileRef}>
            {token ? (
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="Account menu"
                aria-expanded={profileOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1 rounded-lg px-2 py-1.5 -mr-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${
                  isOverHero
                    ? 'text-white/95 hover:bg-white/15 hover:text-white focus-visible:ring-offset-transparent'
                    : 'text-charcoal-700 hover:bg-amber-50/90 hover:text-amber-900 focus-visible:ring-offset-white'
                }`}
              >
                <ProfileOutlineIcon />
                <svg
                  className={`h-3.5 w-3.5 shrink-0 opacity-75 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.25}
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => { openLogin(); setMobileMenuOpen(false); }}
                className={`text-sm font-medium transition-colors ${linkClass}`}
              >
                Login
              </button>
            )}
            {profileOpen && token && (
              <div className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl border overflow-hidden ${isOverHero ? 'bg-white border-gray-200' : 'bg-white border-gray-200'}`}>
                <div className="p-4 border-b border-gray-100">
                  <p className="font-medium text-charcoal truncate">{user?.name || 'My Account'}</p>
                  <p className="text-sm text-gray-500 truncate">{user?.mobile ? `${user.countryCode || ''} ${user.mobile}` : user?.email || ''}</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">My Appointments</div>
                  {appointmentsLoading ? (
                    <p className="px-4 py-6 text-sm text-gray-500 text-center">Loading…</p>
                  ) : appointments.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-gray-500 text-center">No appointments yet</p>
                  ) : (
                    <ul className="pb-2">
                      {appointments.map((apt) => (
                        <li key={apt._id || apt.date + apt.time} className="px-4 py-3 hover:bg-amber-50/50 border-b border-gray-50 last:border-0">
                          <p className="text-sm font-medium text-charcoal">{apt.service || 'Appointment'}</p>
                          <p className="text-xs text-gray-500">{formatDate(apt.date)}{apt.time ? ` at ${apt.time}` : ''}</p>
                          {apt.status && (
                            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800' : apt.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-800'}`}>
                              {apt.status}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="p-2 border-t border-gray-100">
                  <button
                    onClick={() => { logout(); setProfileOpen(false); }}
                    className="w-full py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </li>
        </ul>

        <button
          className={`md:hidden p-2 transition-colors ${linkClass}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6H20M4 12H20M4 18H20" />
            )}
          </svg>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-rose-200/50 px-6 py-4">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block text-sm font-medium text-charcoal-600 hover:text-amber-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {token && (
              <li>
                <Link
                  href="/wallet"
                  className={`block text-sm font-medium ${
                    pathname === '/wallet' ? 'text-amber-800' : 'text-charcoal-600 hover:text-amber-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Wallet
                </Link>
              </li>
            )}
            {token ? (
              <>
                <li className="pt-2 border-t border-gray-100">
                  <div className="flex items-start gap-3 mb-4 pb-3 border-b border-gray-100 text-charcoal-600">
                    <span className="shrink-0 text-amber-800 pt-0.5">
                      <ProfileOutlineIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-medium text-charcoal truncate">
                        {user?.name || 'Welcome'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.mobile ? `${user.countryCode || ''} ${user.mobile}` : user?.email || 'Signed in'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">My Appointments</p>
                  {appointmentsLoading ? (
                    <p className="text-sm text-gray-500">Loading…</p>
                  ) : appointments.length === 0 ? (
                    <p className="text-sm text-gray-500">No appointments yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {appointments.slice(0, 5).map((apt) => (
                        <li key={apt._id || apt.date + apt.time} className="text-sm text-charcoal-600">
                          <span className="font-medium">{apt.service || 'Appointment'}</span>
                          <span className="text-gray-500 ml-1">{formatDate(apt.date)}{apt.time ? ` at ${apt.time}` : ''}</span>
                        </li>
                      ))}
                      {appointments.length > 5 && <p className="text-xs text-gray-500">+{appointments.length - 5} more</p>}
                    </ul>
                  )}
                </li>
                <li>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="block text-sm font-medium text-rose-600 hover:text-rose-700 w-full text-left"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <button
                  onClick={() => { openLogin(); setMobileMenuOpen(false); }}
                  className="block text-sm font-medium text-charcoal-600 hover:text-amber-800 w-full text-left"
                >
                  Login
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}

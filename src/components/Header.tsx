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
          <li className="relative" ref={profileRef}>
            {token ? (
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors ${isOverHero ? 'border-white/80 text-white hover:bg-white/20' : 'border-charcoal-600/60 text-charcoal-600 hover:bg-charcoal-50'}`}
                aria-label="Profile"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
            {token ? (
              <>
                <li className="pt-2 border-t border-gray-100">
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

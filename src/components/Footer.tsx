import Link from "next/link";

const SOCIAL = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
      </svg>
    ),
  },
];

const linkClass =
  "group inline-flex items-center gap-2 justify-center rounded-full px-3 py-1.5 text-sm text-gray-300/95 transition-all duration-200 hover:bg-white/[0.08] hover:text-amber-300";

export default function Footer() {
  return (
    <footer id="contact" className="relative text-white">
      <div
        className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/35 to-transparent"
        aria-hidden
      />
      <div className="bg-gradient-to-b from-[#353535] via-charcoal to-[#262626] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-11">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-10">
            <div className="text-center lg:text-left space-y-3">
              <div>
                <h4 className="font-display text-[1.65rem] md:text-3xl font-semibold uppercase logo-blosm leading-none tracking-wide">
                  BLOSM
                </h4>
                <p className="logo-tagline text-gray-400 mt-2.5 max-w-xs mx-auto lg:mx-0">
                  Hair & Beauty · Perth
                </p>
              </div>
              <p className="hidden lg:block text-sm text-gray-500 max-w-[14rem] leading-relaxed font-light">
                Women-only salon — book online or get in touch anytime.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center lg:justify-end gap-6 sm:gap-8">
              <nav
                className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-1 sm:gap-x-1 sm:gap-y-1"
                aria-label="Footer contact"
              >
                <Link href="/contact" className={linkClass}>
                  <span className="text-amber-500/80 group-hover:text-amber-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </span>
                  Contact us
                </Link>
                <a href="mailto:info@blosm-salon.com" className={linkClass}>
                  <span className="text-amber-500/80 group-hover:text-amber-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span className="break-all sm:break-normal">info@blosm-salon.com</span>
                </a>
                <a href="tel:+61410933555" className={linkClass}>
                  <span className="text-amber-500/80 group-hover:text-amber-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </span>
                  +61 410 933 555
                </a>
              </nav>

              <div className="flex flex-col items-center sm:items-stretch gap-2 sm:border-l sm:border-white/10 sm:pl-8">
                <span className="text-[10px] uppercase tracking-[0.28em] text-gray-500 text-center sm:text-left">
                  Follow
                </span>
                <div className="inline-flex items-center justify-center gap-0.5 rounded-full border border-white/[0.12] bg-black/25 px-1.5 py-1 shadow-inner">
                  {SOCIAL.map(({ label, href, icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-amber-500/15 hover:text-amber-300 hover:scale-105 active:scale-95"
                    >
                      {icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-col items-center gap-2 border-t border-white/[0.08] pt-7">
            <p className="text-center text-[11px] sm:text-xs text-gray-500 tracking-wide">
              © {new Date().getFullYear()} Blosm Hair & Beauty, Perth. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

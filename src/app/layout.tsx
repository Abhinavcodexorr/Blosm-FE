import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const faviconUrl =
  'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=375,fit=crop,q=95/YNq2W1bJ9MU6Jxaq/1929c249-b4b5-4513-925a-b5fb2bc6ff47-dOqDKVp1vPTlrj9q.png'

export const metadata: Metadata = {
  title: 'Blosm Hair & Beauty | Women-Only Salon Perth',
  description: "Perth's premier women-only hair and beauty salon. Experience luxury and elegance in a private, welcoming space designed for you.",
  icons: {
    icon: faviconUrl,
    shortcut: faviconUrl,
    apple: faviconUrl,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

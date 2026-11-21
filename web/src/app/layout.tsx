import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Monad Blitz Roguelike | 2D On-Chain Roguelike',
  description: 'Fast-paced deterministic roguelike on Monad Testnet with permanent on-chain gravestones, ghosts, and prize pool.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen antialiased select-none overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}

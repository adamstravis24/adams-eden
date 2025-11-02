'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users } from 'lucide-react'

const navItems = [
  { label: 'Home', href: '/socials' },
  { label: 'Discover', href: '/socials/discover' },
  { label: 'Groups', href: '/socials/groups' },
  { label: 'Friends', href: '/socials/friends' },
  { label: 'Messages', href: '/socials/messages' },
]

const baseClass = 'inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition'

const inactiveClass = 'border-transparent text-slate-500 hover:border-primary-200 hover:text-primary-600 hover:bg-primary-50/60'
const activeClass = 'border-primary-500/70 bg-primary-50/70 text-primary-700 shadow-sm'

export function PlantbookNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-40 border-b border-primary-100/70 bg-white/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-600/10 text-primary-700">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary-500/80">Plantbook navigation</p>
              <h2 className="text-lg font-semibold text-slate-800">Your Plantbook hub</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
            {navItems.map(({ label, href }) => {
              const normalizedHref = href.endsWith('/') && href !== '/' ? href.slice(0, -1) : href
              const isHome = normalizedHref === '/socials'
              const isActive = isHome
                ? pathname === '/socials' || pathname === '/socials/feed'
                : pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default PlantbookNav

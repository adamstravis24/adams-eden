import type { ReactNode } from 'react'
import Navigation from './Navigation'
import SiteFooter from './SiteFooter'
import CartDrawer from './cart/CartDrawer'

interface SiteLayoutProps {
  children: ReactNode
  showFooter?: boolean
  floatingOrbs?: boolean
  className?: string
}

export default function SiteLayout({
  children,
  showFooter = true,
  floatingOrbs = true,
  className,
}: SiteLayoutProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden ${className ?? ''}`}>
      {floatingOrbs && (
        <>
          <span
            className="floating-orb -top-24 -left-24 h-64 w-64 pointer-events-none"
            aria-hidden="true"
          />
          <span
            className="floating-orb top-80 -right-32 h-72 w-72 pointer-events-none"
            aria-hidden="true"
          />
          <span
            className="floating-orb top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 translate-y-1/3 pointer-events-none"
            aria-hidden="true"
          />
        </>
      )}

      <CartDrawer />
      <Navigation />

      <div className="relative z-10">
        {children}
      </div>

      {showFooter && <SiteFooter />}
    </div>
  )
}

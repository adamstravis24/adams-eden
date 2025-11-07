'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/cart/CartContext'
import { useEffect, useRef, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import Avatar from './Avatar'
import dynamic from 'next/dynamic'
const SubscriptionBadge = dynamic(() => import('./SubscriptionBadge'), { ssr: false })

export default function Navigation() {
  const { user, userProfile, signOut, loading: authLoading } = useAuth()
  const { cart, loading: cartLoading, openCart } = useCart()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showShopMenu, setShowShopMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const shopMenuRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const totalQuantity = cart?.totalQuantity ?? 0

  const getDisplayName = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName
    } else if (user?.displayName) {
      return user.displayName
    }
    return 'User'
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setShowUserMenu(false)
      // After sign out, return to public landing page. If a canonical site URL is defined, hard redirect there.
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
      if (typeof window !== 'undefined' && siteUrl) {
        window.location.href = siteUrl
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const navLinkClass = 'relative text-sm font-semibold tracking-wide text-slate-600 hover:text-primary-600 transition-colors duration-200 after:absolute after:left-0 after:-bottom-2 after:h-[3px] after:w-full after:scale-x-0 after:rounded-full after:bg-gradient-to-r after:from-primary-500 after:to-primary-700 after:transition-transform after:duration-300 hover:after:scale-x-100'

  // Close the user menu when clicking outside or pressing Escape
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (showShopMenu && shopMenuRef.current && !shopMenuRef.current.contains(e.target as Node)) {
        setShowShopMenu(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false)
        setShowShopMenu(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showUserMenu, showShopMenu])

  // Close on route changes
  useEffect(() => {
    if (showUserMenu) setShowUserMenu(false)
    if (showShopMenu) setShowShopMenu(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <nav className="sticky top-0 z-50">
      <div className="pointer-events-none absolute inset-0 z-[-1] bg-gradient-to-b from-white/60 via-white/30 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-6 mb-6 md:mt-8">
          <div
            className="glass-panel px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between"
            style={{ overflow: 'visible' }}
          >
            <Link href="/" className="flex items-center gap-3">
              <span className="shine-border block rounded-xl p-[1px] bg-gradient-to-r from-primary-400/50 via-white/70 to-primary-500/40">
                <span className="block rounded-[14px] bg-white/90 p-1">
                  <Image
                    src="/logo.jpg"
                    alt="Adams Eden Logo"
                    width={40}
                    height={40}
                    className="rounded-[10px] object-cover"
                  />
                </span>
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-xs uppercase tracking-[0.35em] text-primary-500/70">Garden Center & Nursery</span>
                <span className="text-2xl font-extrabold text-slate-800">Adams Eden</span>
              </div>
              <SubscriptionBadge />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/about" className={navLinkClass}>
                About
              </Link>
              
              {/* Shop Dropdown */}
              <div className="relative" ref={shopMenuRef}>
                <button
                  onClick={() => setShowShopMenu(!showShopMenu)}
                  className={navLinkClass}
                  aria-haspopup="menu"
                  aria-expanded={showShopMenu}
                >
                  Shop Plants
                </button>

                {showShopMenu && (
                  <div className="absolute left-0 mt-3 w-64 rounded-2xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden" role="menu">
                    <div className="py-2 text-sm">
                      <Link
                        href="/shop"
                        className="block px-4 py-2.5 text-slate-700 font-semibold hover:bg-primary-50/60 transition"
                        onClick={() => setShowShopMenu(false)}
                      >
                        🏠 Shop Home
                      </Link>
                      <Link
                        href="/shop/products"
                        className="block px-4 py-2.5 text-slate-700 font-semibold hover:bg-primary-50/60 transition"
                        onClick={() => setShowShopMenu(false)}
                      >
                        🛒 All Products
                      </Link>
                      
                      <div className="my-2 border-t border-slate-200" />
                      <div className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Categories
                      </div>
                      
                      <Link
                        href="/shop/category/houseplants"
                        className="block px-4 py-2 text-slate-600 hover:bg-primary-50/60 hover:text-slate-900 transition"
                        onClick={() => setShowShopMenu(false)}
                      >
                        🪴 Houseplants
                      </Link>
                      <Link
                        href="/shop/category/outdoor-plants"
                        className="block px-4 py-2 text-slate-600 hover:bg-primary-50/60 hover:text-slate-900 transition"
                        onClick={() => setShowShopMenu(false)}
                      >
                        🌿 Outdoor Plants
                      </Link>
                      <Link
                        href="/shop/category/succulents-cacti"
                        className="block px-4 py-2 text-slate-600 hover:bg-primary-50/60 hover:text-slate-900 transition"
                        onClick={() => setShowShopMenu(false)}
                      >
                        🌵 Succulents & Cacti
                      </Link>
                      <Link
                        href="/shop/category/herbs-edibles"
                        className="block px-4 py-2 text-slate-600 hover:bg-primary-50/60 hover:text-slate-900 transition"
                        onClick={() => setShowShopMenu(false)}
                      >
                        🌱 Herbs & Edibles
                      </Link>
                      <Link
                        href="/shop/category/lighting"
                        className="block px-4 py-2 text-slate-600 hover:bg-primary-50/60 hover:text-slate-900 transition"
                        onClick={() => setShowShopMenu(false)}
                      >
                        💡 Lighting
                      </Link>
                      <Link
                        href="/shop/category/hydroponics"
                        className="block px-4 py-2 text-slate-600 hover:bg-primary-50/60 hover:text-slate-900 transition"
                        onClick={() => setShowShopMenu(false)}
                      >
                        💧 Hydroponics
                      </Link>
                      <Link
                        href="/shop/category/soil-amendments"
                        className="block px-4 py-2 text-slate-600 hover:bg-primary-50/60 hover:text-slate-900 transition"
                        onClick={() => setShowShopMenu(false)}
                      >
                        🪨 Soil & Amendments
                      </Link>
                      <Link
                        href="/shop/category/tools-supplies"
                        className="block px-4 py-2 text-slate-600 hover:bg-primary-50/60 hover:text-slate-900 transition"
                        onClick={() => setShowShopMenu(false)}
                      >
                        🛠️ Tools & Supplies
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/socials" className={navLinkClass}>
                Plantbook
              </Link>
              <Link href="/app" className={navLinkClass}>
                Get the App
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openCart}
                disabled={cartLoading}
                className="relative inline-flex items-center justify-center rounded-full border border-transparent bg-white/80 px-3 py-2 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={totalQuantity ? `Open cart with ${totalQuantity} items` : 'Open cart'}
              >
                <ShoppingCart className="h-5 w-5" />
                {totalQuantity > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-[1.5rem] justify-center rounded-full bg-primary-600 px-1.5 text-[0.65rem] font-semibold text-white shadow-lg">
                    {totalQuantity}
                  </span>
                )}
              </button>

              {authLoading ? (
                <div className="flex items-center gap-3" aria-live="polite">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80">
                    <span className="h-5 w-5 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Authenticating...</span>
                </div>
              ) : user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="glass-card px-1 py-1 flex items-center gap-2 hover:-translate-y-0.5 transition-transform"
                    aria-haspopup="menu"
                    aria-expanded={showUserMenu}
                  >
                    <Avatar
                      photoURL={userProfile?.photoURL}
                      displayName={userProfile?.displayName || user?.displayName || undefined}
                      email={user?.email || undefined}
                      size={40}
                      className="shadow-lg"
                    />
                    <div className="hidden lg:flex flex-col text-left pr-2">
                      <span className="text-xs text-slate-500 uppercase tracking-[0.3em]">Welcome</span>
                      <span className="text-sm font-semibold text-slate-700">{getDisplayName()}</span>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden" role="menu">
                      <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 px-4 py-4 text-white">
                        <div className="flex items-center gap-3">
                          <Avatar
                            photoURL={userProfile?.photoURL}
                            displayName={userProfile?.displayName || user?.displayName || undefined}
                            email={user?.email || undefined}
                            size={48}
                            className="ring-2 ring-white/80 shadow-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{getDisplayName()}</p>
                            <p className="text-primary-50/90 text-xs truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="py-2 text-sm text-slate-600">
                        <Link
                          href="/home"
                          className="block px-4 py-2 hover:bg-primary-50/60 smooth-transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Home
                        </Link>
                        <Link
                          href="/socials"
                          className="block px-4 py-2 hover:bg-primary-50/60 smooth-transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Plantbook
                        </Link>
                        <Link
                          href="/planner"
                          className="block px-4 py-2 hover:bg-primary-50/60 smooth-transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Garden planner
                        </Link>
                        <Link
                          href="/tracker"
                          className="block px-4 py-2 hover:bg-primary-50/60 smooth-transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Plant Tracker
                        </Link>
                        <Link
                          href="/calendar"
                          className="block px-4 py-2 hover:bg-primary-50/60 smooth-transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          My Calendar
                        </Link>
                        <Link
                          href="/journal"
                          className="block px-4 py-2 hover:bg-primary-50/60 smooth-transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          My Journal
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 hover:bg-primary-50/60 smooth-transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Settings
                        </Link>
                        <div className="px-4 py-3">
                          <button
                            onClick={handleSignOut}
                            className="w-full btn-tertiary text-red-600 border-red-200"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="btn-ghost text-sm">
                    Sign In
                  </Link>
                  <Link href="/signup" className="btn-primary text-sm px-6 py-2.5">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

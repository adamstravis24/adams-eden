import Link from 'next/link'
import Image from 'next/image'

const productLinks = [
  { href: '/planner', label: 'Garden Planner' },
  { href: '/shop', label: 'Shop' },
  { href: '/app', label: 'Mobile App' },
  { href: '/features', label: 'Features' },
]

const exploreLinks = [
  { href: '/resources', label: 'Resources' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'FAQ' },
]

const companyLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
]

export default function SiteFooter() {
  return (
    <footer className="relative mt-28 mb-16">
      <div className="absolute -top-24 left-1/3 h-48 w-48 rounded-full bg-primary-200/40 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-16 right-24 h-60 w-60 rounded-full bg-emerald-200/30 blur-3xl" aria-hidden="true" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="glass-panel px-8 py-12 sm:px-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image src="/logo.jpg" alt="Adams Eden Logo" width={40} height={40} className="rounded-lg shadow-sm" />
                <span className="text-2xl font-bold text-slate-800">Adams Eden</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 max-w-sm">
                Adams Eden Garden Center &amp; Nursery — blending curated plants, concierge care, and a smart companion app for every gardener in the Pacific Northwest.
              </p>
              <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.35em] text-slate-500">
                <span className="glass-pill bg-white/80 text-primary-600 px-4 py-2">Boutique Nursery</span>
                <span className="glass-pill bg-white/80 text-primary-600 px-4 py-2">Loyalty Rewards</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary-700 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                {productLinks.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-primary-600 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary-700 mb-4">Explore</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                {exploreLinks.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-primary-600 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary-700 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                {companyLinks.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-primary-600 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/50 text-sm text-slate-500 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Adams Eden. All rights reserved.</p>
            <div className="flex flex-wrap gap-4 mt-4 sm:mt-0">
              <Link href="/privacy" className="hover:text-primary-600 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-primary-600 transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-primary-600 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

import Link from 'next/link'
import {
  ShoppingCart,
  Smartphone,
  Leaf,
  Sparkles,
  Calendar as CalendarIcon,
  Sprout,
  SunMedium,
  Droplets,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

const premiumFeatures = [
  {
    title: 'Curated Greenhouse Collections',
    description: 'Discover hand-raised annuals, perennials, and edibles selected by our growers for Pacific Northwest success.',
    icon: <Leaf className="h-6 w-6 text-primary-500" />,
    href: '/shop',
  },
  {
    title: 'Adams Eden Companion App',
    description: 'Track every purchase, receive care reminders, and get refill suggestions tailored to your garden beds.',
    icon: <Smartphone className="h-6 w-6 text-primary-500" />,
    href: '/app',
  },
  {
    title: 'Workshops & Concierge Coaching',
    description: 'Join in-person classes, seasonal planting events, and one-on-one coaching that keep your garden thriving.',
    icon: <CalendarIcon className="h-6 w-6 text-primary-500" />,
    href: '/events',
  },
]

const workflowSteps = [
  {
    title: 'Visit',
    description: 'Stroll our nursery, consult our team, and choose plants perfectly matched to your light and lifestyle.',
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    title: 'Plan',
    description: 'Use our in-store stylists and app-based garden plans to map out beds, containers, and edible patches.',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: 'Grow',
    description: 'Get care reminders, weather alerts, and watering guidance right when you need them most.',
    icon: <Droplets className="h-5 w-5" />,
  },
  {
    title: 'Savor',
    description: 'Share your progress, earn loyalty rewards, and celebrate harvests with the Adams Eden community.',
    icon: <Sprout className="h-5 w-5" />,
  },
]

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">

      <main className="relative">
        <span className="floating-orb -top-20 -left-24 h-64 w-64" />
        <span className="floating-orb top-64 -right-32 h-72 w-72" />

        {/* Hero */}
        <section className="relative pt-12 pb-24 sm:pt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-16 lg:grid-cols-[1.15fr_1fr] items-center">
            <div>
              <span className="glass-pill mb-6">Adams Eden Garden Center</span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
                Shop our living collection and grow with the <span className="gradient-text">Adams Eden companion app</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-xl">
                We&apos;re your neighborhood nursery in full bloom—blending curated plants, in-person expertise, and a smart mobile guide so every purchase thrives from greenhouse to home.
              </p>

              <div className="mt-10 grid gap-6 sm:grid-cols-2 text-sm text-slate-600">
                <div className="glass-card-hover px-4 py-3 flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                  <span>Locally grown, boutique selections</span>
                </div>
                <div className="glass-card-hover px-4 py-3 flex items-center gap-3">
                  <SunMedium className="h-5 w-5 text-primary-600" />
                  <span>Sun & shade zones labeled in-store</span>
                </div>
                <div className="glass-card-hover px-4 py-3 flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-primary-600" />
                  <span>Care reminders in the Adams Eden app</span>
                </div>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link href="/shop" className="btn-primary">
                  Shop the nursery
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/app" className="btn-secondary">
                  Download the companion app
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-6 text-xs uppercase tracking-[0.35em] text-slate-500">
                <span className="flex items-center gap-2 font-semibold text-slate-700"><CheckCircle2 className="h-4 w-4 text-primary-500" /> Organically raised starts</span>
                <span className="flex items-center gap-2 font-semibold text-slate-700"><CheckCircle2 className="h-4 w-4 text-primary-500" /> Climate-aware guidance</span>
                <span className="flex items-center gap-2 font-semibold text-slate-700"><CheckCircle2 className="h-4 w-4 text-primary-500" /> Loyalty & rewards</span>
              </div>
            </div>

            <div className="relative">
              <div className="glass-card px-8 py-10">
                <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full bg-primary-200/40 blur-3xl" />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="heading-accent mb-2">Live from the nursery</p>
                    <p className="text-2xl font-semibold text-slate-800">Adams Eden Companion</p>
                  </div>
                  <span className="glass-pill text-xs">Synced ✓</span>
                </div>

                <div className="mt-8 space-y-5 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sprout className="h-5 w-5 text-primary-500" />
                      <span>Plants thriving in our app</span>
                    </div>
                    <span className="font-semibold text-slate-900">128</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-5 w-5 text-primary-500" />
                      <span>Upcoming workshops</span>
                    </div>
                    <span className="font-semibold text-slate-900">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-5 w-5 text-primary-500" />
                      <span>Saved shopping lists</span>
                    </div>
                    <span className="font-semibold text-slate-900">34</span>
                  </div>
                </div>

                <div className="mt-10 p-5 section-gradient">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Today&apos;s Highlights</p>
                  <div className="grid gap-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Water herbs in Bed B</span>
                      <span className="glass-pill bg-white/80 text-primary-600 px-3 py-1">Due</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Harvest early carrots</span>
                      <span className="glass-pill bg-white/80 text-primary-600 px-3 py-1">Ready</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Review pest watchlist</span>
                      <span className="glass-pill bg-white/80 text-primary-600 px-3 py-1">New</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="glass-panel px-8 py-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-center">
            <div>
              <p className="text-3xl font-extrabold text-primary-600">15,000+</p>
              <p className="text-sm text-slate-500">Plants nurtured from our greenhouse to local homes</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-primary-600">4.9★</p>
              <p className="text-sm text-slate-500">Average customer rating across nursery & app</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-primary-600">Same Day</p>
              <p className="text-sm text-slate-500">Delivery & planting services available on purchases</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-primary-600">3,200+</p>
              <p className="text-sm text-slate-500">Neighbors using the Adams Eden companion app</p>
            </div>
          </div>
        </section>

        {/* Premium Features */}
        <section className="mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <p className="heading-accent">Experiences that grow with you</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Everything you need from nursery visit to harvest</h2>
                <p className="mt-3 text-slate-600 max-w-2xl">
                  Browse greenhouse favorites, lean on our team for personalized plans, and keep the momentum with a smart app that knows every plant you bring home.
                </p>
              </div>
              <Link href="/features" className="btn-tertiary text-sm">
                Explore services & amenities
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {premiumFeatures.map(feature => (
                <Link key={feature.title} href={feature.href} className="glass-card-hover p-6 flex flex-col gap-4 text-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-primary-100/70 text-primary-600">
                      {feature.icon}
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">{feature.title}</h3>
                  <p className="text-sm leading-relaxed">{feature.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="section-gradient px-6 py-10 sm:px-10 sm:py-12">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="heading-accent">Your Adams Eden path</p>
                  <h2 className="text-3xl font-bold text-slate-900">Visit, plan, grow, and celebrate with us</h2>
                </div>
                <Link href="/events" className="btn-secondary text-sm">
                  See upcoming events
                </Link>
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-4">
                {workflowSteps.map(step => (
                  <div key={step.title} className="glass-card px-5 py-6">
                    <span className="glass-pill mb-4 inline-flex items-center gap-2 text-xs text-primary-600">
                      {step.icon}
                      {step.title}
                    </span>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative mt-24 mb-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[46px] bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 text-white px-8 py-12 sm:px-12 sm:py-16 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
              <div className="relative z-10 text-center max-w-3xl mx-auto">
                <p className="heading-accent text-white/80">Your garden, our passion</p>
                <h2 className="text-3xl sm:text-4xl font-bold">Visit Adams Eden and take the experience home</h2>
                <p className="mt-4 text-lg text-white/80">
                  Schedule a greenhouse consultation, pick up seasonal must-haves, and keep the momentum with the Adams Eden app in your pocket.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/contact" className="btn-secondary bg-white text-primary-600">
                    Plan your visit
                  </Link>
                  <Link href="/app" className="btn-ghost text-white/90">
                    Download the app
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

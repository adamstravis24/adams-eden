import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'About Us - Adams Eden',
  description: 'Learn about Adams Eden Garden Center & Nursery, our mission, and our passion for helping gardeners create beautiful, sustainable gardens.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-primary-50">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 sm:p-12">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors mb-6"
            >
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-slate-800 mb-4">About Adams Eden</h1>
            <p className="text-slate-600 text-lg">
              Discover our story, mission, and commitment to helping gardeners of all levels create beautiful, thriving gardens.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 items-center mb-12">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800 mb-6">Our Story</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 mb-4">
                  Welcome to Adams Eden, where we believe that God created all things in his beautiful image.
                </p>
                <p className="text-slate-600 mb-4">
                  Adams Eden was created by Travis Adams, a disabled Navy Veteran. He came up with this idea in 2021 after he learned he was going to be medically retired from the Navy. His obsession with plants and growing things led him to want to do a thing like this. His foundation is in God and to be more Christ like. Genesis 2:8 talks about how the Lord God planted a garden. Well, if God&apos;s doing it, I&apos;ll plant a garden as well.
                </p>
                <p className="text-slate-600">
                  Currently Adams Eden is in the germination stage and growing. While we&apos;re small though we are mighty. As we continue to grow, we&apos;ll keep God first as the Master Gardener that he is. We&apos;ll also continue to offer more for the customers. Our full plan is to open a retail center, but more than that benefit the community. Offer community events. Teach people about gardening.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square relative rounded-lg overflow-hidden shadow-lg">
                <Image
                  src="/about-me-pic.jpg"
                  alt="Adams Eden team or garden"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Expert Knowledge</h3>
              <p className="text-sm text-slate-600">
                Our team of horticulturists and garden experts are here to help you succeed.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Passion for Plants</h3>
              <p className="text-sm text-slate-600">
                We&apos;re passionate about connecting people with the perfect plants for their gardens.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Community Focus</h3>
              <p className="text-sm text-slate-600">
                Building a community of gardeners who share knowledge and inspiration.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">Ready to Start Your Garden Journey?</h2>
              <p className="text-slate-600 mb-6">
                Join thousands of gardeners who trust Adams Eden for their plant needs.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/features"
                  className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors font-medium"
                >
                  Explore Features
                </Link>
                <Link
                  href="/contact"
                  className="border border-primary-600 text-primary-600 px-6 py-3 rounded-md hover:bg-primary-700 hover:text-white transition-colors font-medium"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
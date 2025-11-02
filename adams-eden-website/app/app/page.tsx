import Link from 'next/link'
import Image from 'next/image'
import { Apple } from 'lucide-react'

export default function DownloadAppPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <Image 
                src="/logo.jpg" 
                alt="Adams Eden Logo" 
                width={40} 
                height={40}
                className="rounded-lg"
              />
              <span className="text-2xl font-bold text-gray-900">Adams Eden</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-primary-600 transition font-medium">
                Home
              </Link>
              <Link href="/planner" className="text-gray-600 hover:text-primary-600 transition font-medium">
                Garden Planner
              </Link>
              <Link href="/shop" className="text-gray-600 hover:text-primary-600 transition font-medium">
                Shop
              </Link>
              <Link href="/features" className="text-gray-600 hover:text-primary-600 transition font-medium">
                Features
              </Link>
              <Link href="/app" className="text-primary-600 font-semibold">
                Download App
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-primary-600 transition font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/planner"
                className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition font-semibold shadow-sm"
              >
                Start Planning
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-6xl mb-6">📱</div>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-6">
                Your Garden in Your Pocket
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Download the Adams Eden mobile app to track your plants, get reminders, and access your garden plans anywhere.
              </p>
              
              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#"
                  className="flex items-center justify-center space-x-3 bg-black text-white px-6 py-4 rounded-lg hover:bg-gray-800 transition"
                >
                  <Apple className="w-8 h-8" />
                  <div className="text-left">
                    <div className="text-xs">Download on the</div>
                    <div className="text-lg font-semibold">App Store</div>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-center justify-center space-x-3 bg-black text-white px-6 py-4 rounded-lg hover:bg-gray-800 transition"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs">GET IT ON</div>
                    <div className="text-lg font-semibold">Google Play</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-100 to-green-200 rounded-3xl p-12 aspect-square flex items-center justify-center">
              <div className="text-center">
                <div className="text-9xl mb-4">📲</div>
                <p className="text-2xl font-bold text-gray-800">Adams Eden App</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">App Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🌱</div>
              <h3 className="text-xl font-bold mb-3">Plant Tracking</h3>
              <p className="text-gray-600">
                Track planting dates, growth stages, and harvest times for every plant in your garden
              </p>
            </div>

            <div className="text-center p-6">
              <div className="text-5xl mb-4">⏰</div>
              <h3 className="text-xl font-bold mb-3">Smart Reminders</h3>
              <p className="text-gray-600">
                Get notifications for watering, fertilizing, pruning, and harvest times
              </p>
            </div>

            <div className="text-center p-6">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-bold mb-3">Garden Journal</h3>
              <p className="text-gray-600">
                Document your garden journey with photos, notes, and observations
              </p>
            </div>

            <div className="text-center p-6">
              <div className="text-5xl mb-4">☁️</div>
              <h3 className="text-xl font-bold mb-3">Weather Forecasts</h3>
              <p className="text-gray-600">
                Local weather data and alerts to help you plan your garden activities
              </p>
            </div>

            <div className="text-center p-6">
              <div className="text-5xl mb-4">🔄</div>
              <h3 className="text-xl font-bold mb-3">Sync Across Devices</h3>
              <p className="text-gray-600">
                Your garden plans and data automatically sync between web and mobile
              </p>
            </div>

            <div className="text-center p-6">
              <div className="text-5xl mb-4">📵</div>
              <h3 className="text-xl font-bold mb-3">Offline Access</h3>
              <p className="text-gray-600">
                Access your garden plans and tracking data even without internet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Seamless Integration</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Plan on Web</h3>
              <p className="text-gray-600">
                Design your garden on our website with the full-featured planner
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Auto-Sync</h3>
              <p className="text-gray-600">
                Your garden plans automatically sync to your mobile device
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Track on Mobile</h3>
              <p className="text-gray-600">
                Use the app to track, journal, and manage your garden on the go
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Start Your Garden Journey Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Plan on web, track on mobile, grow with confidence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/planner"
              className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              Start Planning Free
            </Link>
            <a
              href="#"
              className="inline-block bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-800 transition shadow-lg border-2 border-white"
            >
              Download App
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image 
                  src="/logo.jpg" 
                  alt="Adams Eden Logo" 
                  width={32} 
                  height={32}
                  className="rounded"
                />
                <span className="text-xl font-bold">Adams Eden</span>
              </div>
              <p className="text-gray-400 text-sm">
                Plan, shop, and grow with confidence.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/planner" className="hover:text-white">Garden Planner</Link></li>
                <li><Link href="/shop" className="hover:text-white">Shop</Link></li>
                <li><Link href="/app" className="hover:text-white">Mobile App</Link></li>
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Explore</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/resources" className="hover:text-white">Resources</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2025 Adams Eden. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

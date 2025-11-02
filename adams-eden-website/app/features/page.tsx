import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Sprout, Package, Smartphone, Calendar, Cloud, BookOpen, Users, Target, Zap } from 'lucide-react'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">✨</div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-6">
            Everything Adams Eden offers for your garden
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From greenhouse discoveries to app-powered coaching, explore how our nursery, services, and digital companion help you plant, grow, and enjoy more with confidence.
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Signature experiences for every gardener</h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
                <Sprout className="w-10 h-10 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Greenhouse Favorites</h3>
              <p className="text-gray-600 mb-6">
                Hand-raised annuals, perennials, edibles, and houseplants chosen by our growers for Pacific Northwest success.
              </p>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Locally acclimated starts for sun, shade, and indoor spaces</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Color-coded care tags for quick matching at home</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Curated pollinator, edible, and low-maintenance bundles</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Friendly experts on-site every day to guide selections</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
                <Package className="w-10 h-10 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Planting & Delivery Services</h3>
              <p className="text-gray-600 mb-6">
                Let our crew deliver, install, and refresh your gardens so you can enjoy the beauty without the heavy lifting.
              </p>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Flexible delivery scheduling to fit your calendar</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>White-glove planting and container refreshes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Seasonal swap services to keep beds photo-ready</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Schedule visits and track services inside the app</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
                <Smartphone className="w-10 h-10 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Adams Eden Companion App</h3>
              <p className="text-gray-600 mb-6">
                Keep every plant thriving with personalized care plans, reminders, and perks synced to your purchases.
              </p>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Auto-loads your Adams Eden purchases with detailed care guides</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Weather-smart watering and frost alerts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Loyalty rewards, workshop invites, and refill prompts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Offline access for backyard walk-throughs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4">More ways we help you grow</h2>
          <p className="text-xl text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            Your Adams Eden visit comes with services, community, and digital perks that keep the harvest coming all season long.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-sm">
              <Calendar className="w-8 h-8 text-primary-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Workshops & Tastings</h3>
                <p className="text-gray-600">Reserve hands-on classes, plant clinics, and member-only tastings through the app.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-sm">
              <Cloud className="w-8 h-8 text-primary-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Weather-smart Alerts</h3>
                <p className="text-gray-600">Receive frost warnings, irrigation cues, and pest watch updates tailored to your beds.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-sm">
              <BookOpen className="w-8 h-8 text-primary-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Knowledge Bar</h3>
                <p className="text-gray-600">Tap into planting guides, recipe cards, and troubleshooting help anytime.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-sm">
              <Users className="w-8 h-8 text-primary-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Community Gatherings</h3>
                <p className="text-gray-600">Meet fellow growers, swap cuttings, and celebrate harvests at our weekly meetups.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-sm">
              <Target className="w-8 h-8 text-primary-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Plant Match Library</h3>
                <p className="text-gray-600">Search our digital catalog for light, pet-friendly, and edible matches before you shop.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-sm">
              <Zap className="w-8 h-8 text-primary-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Loyalty Rewards</h3>
                <p className="text-gray-600">Earn points, unlock seasonal bonuses, and enjoy app-only specials on refills.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4">
            How Adams Eden fits into your growing season
          </h2>
          <p className="text-xl text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            From your first visit to the final harvest, we stay with you every step of the way.
          </p>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">
                1
              </div>
              <div className="mb-4">
                <Sprout className="w-10 h-10 text-primary-600 mx-auto" />
              </div>
              <h3 className="text-xl font-bold mb-3">Visit & explore</h3>
              <p className="text-gray-600">
                Tour the greenhouse, sample collections, and let our stylists help match plants to your space.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">
                2
              </div>
              <div className="mb-4">
                <Package className="w-10 h-10 text-primary-600 mx-auto" />
              </div>
              <h3 className="text-xl font-bold mb-3">Take home with ease</h3>
              <p className="text-gray-600">
                Choose delivery or white-glove planting so your new favorites settle in beautifully.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">
                3
              </div>
              <div className="mb-4">
                <Smartphone className="w-10 h-10 text-primary-600 mx-auto" />
              </div>
              <h3 className="text-xl font-bold mb-3">Grow with guidance</h3>
              <p className="text-gray-600">
                Use the app for watering alerts, care tips, and invites to in-store workshops.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">
                4
              </div>
              <div className="mb-4">
                <Calendar className="w-10 h-10 text-primary-600 mx-auto" />
              </div>
              <h3 className="text-xl font-bold mb-3">Share the harvest</h3>
              <p className="text-gray-600">
                Earn rewards, post your thriving beds, and celebrate with the Adams Eden community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to grow with Adams Eden?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Plan your visit, meet our growers, and bring home the app that keeps every plant thriving.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            Plan your visit
          </Link>
          <div className="mt-4">
            <Link
              href="/app"
              className="inline-block text-white/90 underline-offset-4 hover:text-white transition"
            >
              Download the Adams Eden app
            </Link>
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
                Adams Eden Garden Center & Nursery — blending boutique plants, expert care, and a smart companion app.
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

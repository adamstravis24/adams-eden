import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact Us - Adams Eden',
  description: 'Get in touch with Adams Eden Garden Center & Nursery. Contact us for gardening advice, plant recommendations, or customer support.',
}

export default function ContactPage() {
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
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Contact Us</h1>
            <p className="text-slate-600 text-lg">
              We&apos;d love to hear from you! Get in touch with questions about gardening, our services, or just to say hello.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800 mb-6">Get In Touch</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Visit Our Nursery</h3>
                    <p className="text-slate-600">
                      TBD
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Phone</h3>
                    <p className="text-slate-600">
                      816-786-8397
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Email</h3>
                    <p className="text-slate-600">
                      <a href="mailto:travis.adams@adamsedenbranson.com" className="text-primary-600 hover:underline">travis.adams@adamsedenbranson.com</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Business Hours</h3>
                    <p className="text-slate-600">
                      TBD
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-slate-800 mb-6">Send Us a Message</h2>

              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a topic</option>
                    <option value="gardening-advice">Gardening Advice</option>
                    <option value="plant-recommendations">Plant Recommendations</option>
                    <option value="app-support">Mobile App Support</option>
                    <option value="website-feedback">Website Feedback</option>
                    <option value="order-support">Order Support</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Tell us how we can help..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  Send Message
                </button>
              </form>

              <p className="text-sm text-slate-500 mt-4">
                We typically respond within 24 hours during business days.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <h3 className="font-semibold text-slate-800 mb-2">Gardening Questions?</h3>
                <p className="text-sm text-slate-600">
                  Our expert staff is here to help with plant selection, care tips, and garden planning.
                </p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-slate-800 mb-2">Technical Support</h3>
                <p className="text-sm text-slate-600">
                  Having trouble with our app or website? Our tech team can assist you.
                </p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-slate-800 mb-2">Wholesale Inquiries</h3>
                <p className="text-sm text-slate-600">
                  Interested in carrying our plants? Contact us about wholesale opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
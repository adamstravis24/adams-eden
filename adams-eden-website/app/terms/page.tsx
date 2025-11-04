import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - Adams Eden',
  description: 'Terms of service for Adams Eden website and mobile app. Read our terms and conditions for using our gardening platform.',
}

export default function TermsOfService() {
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
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Terms of Service</h1>
            <p className="text-slate-600 text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-600 mb-4">
                Welcome to Adams Eden ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our website (adamseden.com) and mobile application (Adams Eden App). By accessing or using our services, you agree to be bound by these Terms.
              </p>
              <p className="text-slate-600 mb-4">
                If you do not agree to these Terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Description of Service</h2>
              <p className="text-slate-600 mb-4">
                Adams Eden provides a comprehensive gardening platform that includes:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li>Garden planning and design tools</li>
                <li>Plant database and recommendations</li>
                <li>Garden tracking and progress monitoring</li>
                <li>Weather integration and climate data</li>
                <li>Watering reminders and notifications</li>
                <li>E-commerce platform for plants and supplies</li>
                <li>Educational resources and community features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. User Accounts</h2>

              <h3 className="text-xl font-medium text-slate-700 mb-3">3.1 Account Creation</h3>
              <p className="text-slate-600 mb-4">
                To access certain features, you must create an account. You agree to provide accurate, current, and complete information and to update it as necessary.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">3.2 Account Security</h3>
              <p className="text-slate-600 mb-4">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">3.3 Account Termination</h3>
              <p className="text-slate-600 mb-4">
                We reserve the right to suspend or terminate your account at any time for violations of these Terms or for other reasons we deem necessary.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. User Conduct</h2>
              <p className="text-slate-600 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of the service</li>
                <li>Use the service to harass, abuse, or harm others</li>
                <li>Post false, misleading, or inappropriate content</li>
                <li>Scrape or collect data without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Content and Intellectual Property</h2>

              <h3 className="text-xl font-medium text-slate-700 mb-3">5.1 User Content</h3>
              <p className="text-slate-600 mb-4">
                You retain ownership of content you submit to our service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content in connection with our services.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">5.2 Our Content</h3>
              <p className="text-slate-600 mb-4">
                All content, features, and functionality of our service are owned by Adams Eden and are protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">5.3 Plant Database</h3>
              <p className="text-slate-600 mb-4">
                Our plant database is compiled from various sources. While we strive for accuracy, we cannot guarantee the completeness or accuracy of plant information. Users should consult local experts for specific gardening advice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Privacy and Data</h2>
              <p className="text-slate-600 mb-4">
                Your privacy is important to us. Please review our <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>, which explains how we collect, use, and protect your information.
              </p>
              <p className="text-slate-600 mb-4">
                By using our service, you consent to the collection and use of your information as described in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">7. Payments and Purchases</h2>

              <h3 className="text-xl font-medium text-slate-700 mb-3">7.1 Pricing</h3>
              <p className="text-slate-600 mb-4">
                All prices are subject to change without notice. We reserve the right to modify pricing at any time.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">7.2 Payment Processing</h3>
              <p className="text-slate-600 mb-4">
                Payments are processed through secure third-party providers. We do not store your payment information.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">7.3 Shipping and Delivery</h3>
              <p className="text-slate-600 mb-4">
                For physical products, shipping times and costs vary. We are not responsible for delays caused by shipping carriers or customs.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">7.4 Returns and Refunds</h3>
              <p className="text-slate-600 mb-4">
                Plants and seeds are living products. Returns are accepted within 30 days for dead or damaged plants. Custom orders may not be returnable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">8. Disclaimers and Limitations</h2>

              <h3 className="text-xl font-medium text-slate-700 mb-3">8.1 Service Availability</h3>
              <p className="text-slate-600 mb-4">
                We strive for high availability but cannot guarantee uninterrupted service. We may perform maintenance or updates that temporarily disrupt service.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">8.2 Gardening Advice</h3>
              <p className="text-slate-600 mb-4">
                Our service provides general gardening information and recommendations. We are not responsible for the success or failure of your gardening endeavors. Always consult local experts for specific advice.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">8.3 Weather Data</h3>
              <p className="text-slate-600 mb-4">
                Weather data is provided by third parties and may not always be accurate. We are not responsible for weather-related damages or losses.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">8.4 Limitation of Liability</h3>
              <p className="text-slate-600 mb-4">
                To the maximum extent permitted by law, Adams Eden shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">9. Mobile App Specific Terms</h2>

              <h3 className="text-xl font-medium text-slate-700 mb-3">9.1 App Store Terms</h3>
              <p className="text-slate-600 mb-4">
                Your use of the mobile app is also subject to the terms of service of your app store (Apple App Store or Google Play Store).
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">9.2 Device Permissions</h3>
              <p className="text-slate-600 mb-4">
                The app may request permissions for location, notifications, camera, and storage. You can manage these permissions in your device settings.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">9.3 Offline Functionality</h3>
              <p className="text-slate-600 mb-4">
                Some features work offline, but full functionality requires an internet connection.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">9.4 Updates</h3>
              <p className="text-slate-600 mb-4">
                We may update the app automatically. Continued use after updates constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">10. Termination</h2>
              <p className="text-slate-600 mb-4">
                We may terminate or suspend your account and access to our services immediately, without prior notice, for any reason, including breach of these Terms.
              </p>
              <p className="text-slate-600 mb-4">
                Upon termination, your right to use our services ceases immediately. All provisions that should survive termination shall remain in effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">11. Governing Law</h2>
              <p className="text-slate-600 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of Washington, without regard to its conflict of law provisions.
              </p>
              <p className="text-slate-600 mb-4">
                Any disputes arising from these Terms shall be resolved in the courts of King County, Washington.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">12. Changes to Terms</h2>
              <p className="text-slate-600 mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through our service.
              </p>
              <p className="text-slate-600 mb-4">
                Your continued use of our services after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">13. Severability</h2>
              <p className="text-slate-600 mb-4">
                If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">14. Entire Agreement</h2>
              <p className="text-slate-600 mb-4">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and Adams Eden regarding our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">15. Contact Information</h2>
              <p className="text-slate-600 mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600 mb-2"><strong>Email:</strong> legal@adamseden.com</p>
                <p className="text-slate-600 mb-2"><strong>Address:</strong> Adams Eden Garden Center & Nursery</p>
                <p className="text-slate-600"><strong>Phone:</strong> (555) 123-GROW</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center">
              These terms were last updated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
              By using Adams Eden, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
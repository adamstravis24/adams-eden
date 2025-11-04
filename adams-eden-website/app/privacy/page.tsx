import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy - Adams Eden',
  description: 'Privacy policy for Adams Eden website and mobile app. Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicy() {
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
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Privacy Policy</h1>
            <p className="text-slate-600 text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Introduction</h2>
              <p className="text-slate-600 mb-4">
                Welcome to Adams Eden ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website (adamseden.com) and mobile application (Adams Eden App).
              </p>
              <p className="text-slate-600 mb-4">
                By using our services, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-medium text-slate-700 mb-3">2.1 Personal Information</h3>
              <p className="text-slate-600 mb-4">
                We may collect personally identifiable information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li>Name and contact information (email address)</li>
                <li>Account credentials (username, password)</li>
                <li>Profile information and preferences</li>
                <li>Location data (ZIP code, city, state)</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-medium text-slate-700 mb-3">2.2 Usage Data</h3>
              <p className="text-slate-600 mb-4">
                We automatically collect certain information when you use our services:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li>Device information (device type, operating system, unique device identifiers)</li>
                <li>Log data (IP address, browser type, pages visited, time spent)</li>
                <li>Location data (GPS coordinates for weather and climate features)</li>
                <li>App usage statistics and preferences</li>
                <li>Garden planning and plant tracking data</li>
              </ul>

              <h3 className="text-xl font-medium text-slate-700 mb-3">2.3 Third-Party Data</h3>
              <p className="text-slate-600 mb-4">
                We integrate with third-party services that may collect additional data:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li><strong>Firebase:</strong> Authentication, database storage, and analytics</li>
                <li><strong>Open-Meteo API:</strong> Weather data for your location</li>
                <li><strong>NOAA Climate Data:</strong> Historical climate normals (optional)</li>
                <li><strong>Payment Processors:</strong> Secure payment processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. How We Use Your Information</h2>
              <p className="text-slate-600 mb-4">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li><strong>Service Provision:</strong> To provide, maintain, and improve our gardening planning and tracking services</li>
                <li><strong>Personalization:</strong> To customize your experience, including plant recommendations and climate-adjusted schedules</li>
                <li><strong>Weather Integration:</strong> To provide accurate weather data and frost warnings for your location</li>
                <li><strong>Notifications:</strong> To send watering reminders, weather alerts, and service updates</li>
                <li><strong>Account Management:</strong> To create and manage your account, process payments, and provide customer support</li>
                <li><strong>Analytics:</strong> To understand usage patterns and improve our services</li>
                <li><strong>Legal Compliance:</strong> To comply with legal obligations and protect our rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-slate-600 mb-4">We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">4.1 Service Providers</h3>
              <p className="text-slate-600 mb-4">
                We may share information with trusted third-party service providers who assist us in operating our services, such as:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li>Firebase (Google) for authentication and data storage</li>
                <li>Payment processors for secure transactions</li>
                <li>Analytics providers for service improvement</li>
                <li>Weather data providers for climate information</li>
              </ul>

              <h3 className="text-xl font-medium text-slate-700 mb-3">4.2 Legal Requirements</h3>
              <p className="text-slate-600 mb-4">
                We may disclose your information if required by law, court order, or government request, or to protect our rights, property, or safety, or that of our users.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">4.3 Business Transfers</h3>
              <p className="text-slate-600 mb-4">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Data Security</h2>
              <p className="text-slate-600 mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and updates</li>
                <li>Secure data storage with Firebase</li>
                <li>Limited access to personal information on a need-to-know basis</li>
              </ul>
              <p className="text-slate-600 mb-4">
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Data Retention</h2>
              <p className="text-slate-600 mb-4">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. Specifically:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li>Account data is retained while your account is active</li>
                <li>Garden planning data is retained for your continued use</li>
                <li>Usage analytics may be aggregated and retained indefinitely</li>
                <li>Deleted account data is removed within 30 days, except as required for legal compliance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">7. Your Rights and Choices</h2>
              <p className="text-slate-600 mb-4">You have the following rights regarding your personal information:</p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">7.1 Access and Portability</h3>
              <p className="text-slate-600 mb-4">
                You can access and download your personal information through your account settings or by contacting us.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">7.2 Correction</h3>
              <p className="text-slate-600 mb-4">
                You can update your personal information through your account settings.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">7.3 Deletion</h3>
              <p className="text-slate-600 mb-4">
                You can delete your account and associated data through your account settings. Some data may be retained for legal compliance.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">7.4 Opt-out</h3>
              <p className="text-slate-600 mb-4">
                You can opt out of marketing communications and adjust notification preferences in your account settings.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">7.5 Location Data</h3>
              <p className="text-slate-600 mb-4">
                You can disable location services in your device settings or app permissions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">8. Mobile App Specific Information</h2>

              <h3 className="text-xl font-medium text-slate-700 mb-3">8.1 Permissions</h3>
              <p className="text-slate-600 mb-4">
                Our mobile app may request the following permissions:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li><strong>Location:</strong> For weather data and climate-adjusted plant recommendations</li>
                <li><strong>Notifications:</strong> For watering reminders and weather alerts</li>
                <li><strong>Camera:</strong> For plant identification features</li>
                <li><strong>Storage:</strong> For offline data caching</li>
                <li><strong>Biometric:</strong> For secure authentication (optional)</li>
              </ul>

              <h3 className="text-xl font-medium text-slate-700 mb-3">8.2 Offline Functionality</h3>
              <p className="text-slate-600 mb-4">
                The app stores data locally on your device for offline use. This data is synchronized when you're online and remains secure on your device.
              </p>

              <h3 className="text-xl font-medium text-slate-700 mb-3">8.3 Background Processing</h3>
              <p className="text-slate-600 mb-4">
                The app may perform background tasks for weather monitoring and notifications. You can disable this in your device settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">9. Third-Party Services</h2>
              <p className="text-slate-600 mb-4">
                Our services integrate with third-party services. Please review their privacy policies:
              </p>
              <ul className="list-disc pl-6 text-slate-600 mb-4">
                <li><strong>Firebase:</strong> <a href="https://firebase.google.com/support/privacy" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">Firebase Privacy Policy</a></li>
                <li><strong>Google Analytics:</strong> <a href="https://policies.google.com/privacy" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
                <li><strong>Open-Meteo:</strong> <a href="https://open-meteo.com/en/terms" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">Open-Meteo Terms</a></li>
                <li><strong>NOAA:</strong> <a href="https://www.noaa.gov/privacypolicy" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">NOAA Privacy Policy</a></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">10. Children's Privacy</h2>
              <p className="text-slate-600 mb-4">
                Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">11. International Data Transfers</h2>
              <p className="text-slate-600 mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-slate-600 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We will also send you an email notification for significant changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">13. Contact Us</h2>
              <p className="text-slate-600 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600 mb-2"><strong>Email:</strong> privacy@adamseden.com</p>
                <p className="text-slate-600 mb-2"><strong>Address:</strong> Adams Eden Garden Center & Nursery</p>
                <p className="text-slate-600"><strong>Phone:</strong> (555) 123-GROW</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">14. California Privacy Rights</h2>
              <p className="text-slate-600 mb-4">
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA). You can request information about the categories and specific pieces of personal information we have collected about you, request deletion of your personal information, and opt out of the sale of your personal information (though we do not sell personal information).
              </p>
              <p className="text-slate-600 mb-4">
                To exercise these rights, please contact us using the information provided above.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center">
              This privacy policy was last updated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
              By using Adams Eden, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
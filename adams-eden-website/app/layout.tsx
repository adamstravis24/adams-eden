import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/cart/CartContext'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import SiteLayout from '@/components/SiteLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Adams Eden - Plan Your Dream Garden',
  description: 'Design your perfect garden, shop for plants and supplies, and track your garden\'s progress with our integrated app.',
  keywords: ['garden planning', 'garden design', 'plants', 'seeds', 'gardening supplies'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SubscriptionProvider>
            <CartProvider>
              <SiteLayout>
                <main>{children}</main>
                <Toaster position="top-right" />
              </SiteLayout>
            </CartProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

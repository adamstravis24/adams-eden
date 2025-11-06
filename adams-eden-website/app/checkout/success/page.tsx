"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('session_id');
    setSessionId(id);
    
    // Clear cart from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shopify-cart-id');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200 text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="mb-4 text-3xl font-bold text-slate-900">
            Order Confirmed!
          </h1>
          <p className="mb-2 text-lg text-slate-600">
            Thank you for your purchase from Adams Eden
          </p>
          {sessionId && (
            <p className="mb-8 text-sm text-slate-500">
              Order ID: {sessionId.slice(-12)}
            </p>
          )}

          {/* What's Next */}
          <div className="mb-8 rounded-lg bg-primary-50 p-6 text-left">
            <div className="flex items-start gap-3">
              <Package className="mt-1 h-6 w-6 text-primary-600" />
              <div>
                <h2 className="mb-2 font-semibold text-slate-900">
                  What happens next?
                </h2>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• You&apos;ll receive an order confirmation email shortly</li>
                  <li>• We&apos;ll send shipping updates as your order is processed</li>
                  <li>• Your plants will be carefully packaged for safe delivery</li>
                  <li>• Track your order status in your account</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-8 py-3 font-semibold text-white transition hover:bg-primary-700"
            >
              Continue Shopping
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary-600 px-8 py-3 font-semibold text-primary-600 transition hover:bg-primary-50"
            >
              View My Plants
            </Link>
          </div>

          {/* Support */}
          <p className="mt-8 text-sm text-slate-500">
            Need help?{" "}
            <Link href="/contact" className="font-semibold text-primary-600 hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

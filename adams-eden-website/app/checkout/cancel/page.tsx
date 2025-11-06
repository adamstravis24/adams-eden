"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200 text-center">
          {/* Cancel Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
            <XCircle className="h-12 w-12 text-slate-600" />
          </div>

          {/* Cancel Message */}
          <h1 className="mb-4 text-3xl font-bold text-slate-900">
            Checkout Cancelled
          </h1>
          <p className="mb-8 text-lg text-slate-600">
            Your order was not completed. Your cart items are still saved.
          </p>

          {/* Information Box */}
          <div className="mb-8 rounded-lg bg-primary-50 p-6 text-left">
            <h2 className="mb-3 font-semibold text-slate-900">
              What would you like to do?
            </h2>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Return to your cart to review your items</li>
              <li>• Continue shopping for more plants and supplies</li>
              <li>• Save items for later by keeping them in your cart</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-8 py-3 font-semibold text-white transition hover:bg-primary-700"
            >
              <RefreshCw className="h-5 w-5" />
              Try Again
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary-600 px-8 py-3 font-semibold text-primary-600 transition hover:bg-primary-50"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Shop
            </Link>
          </div>

          {/* Support */}
          <p className="mt-8 text-sm text-slate-500">
            Having trouble?{" "}
            <Link href="/contact" className="font-semibold text-primary-600 hover:underline">
              Contact us for help
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

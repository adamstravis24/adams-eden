"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useCart } from "@/contexts/cart/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatMoney } from "@/lib/shopify";

export function CheckoutPage() {
  const router = useRouter();
  const { cart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    shippingMethod: "standard",
  });

  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [user, formData.email]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && (!cart || cart.totalQuantity === 0)) {
      router.push("/shop");
    }
  }, [cart, cartLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId: cart?.id,
          customerInfo: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to proceed to checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  const shippingCost = formData.shippingMethod === "express" ? 15 : 5;
  const subtotal = cart ? Number(cart.cost.subtotalAmount.amount) : 0;
  const tax = subtotal * 0.08; // 8% tax example
  const total = subtotal + shippingCost + tax;

  if (cartLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-slate-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.totalQuantity === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </Link>

        {/* Header */}
        <div className="mt-6 mb-10">
          <h1 className="text-4xl font-bold text-slate-900">Checkout</h1>
          <p className="mt-2 text-lg text-slate-600">
            Complete your order from Adams Eden greenhouse
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information */}
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                      Email address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                        First name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                        Last name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700">
                      Street address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-slate-700">
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        placeholder="WA"
                      />
                    </div>
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-slate-700">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        required
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Shipping Method */}
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  Shipping Method
                </h2>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-start gap-4 rounded-lg border-2 border-slate-200 p-4 transition hover:border-primary-300">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="standard"
                      checked={formData.shippingMethod === "standard"}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-slate-600" />
                        <span className="font-semibold text-slate-900">Standard Shipping</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">5-7 business days</p>
                    </div>
                    <span className="font-semibold text-slate-900">$5.00</span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-4 rounded-lg border-2 border-slate-200 p-4 transition hover:border-primary-300">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="express"
                      checked={formData.shippingMethod === "express"}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-slate-600" />
                        <span className="font-semibold text-slate-900">Express Shipping</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">2-3 business days</p>
                    </div>
                    <span className="font-semibold text-slate-900">$15.00</span>
                  </label>
                </div>
              </section>

              {/* Payment Section */}
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-xl font-bold text-slate-900">Payment</h2>
                <div className="rounded-lg bg-primary-50 p-6 text-center">
                  <Lock className="mx-auto mb-3 h-12 w-12 text-primary-600" />
                  <p className="mb-2 font-semibold text-slate-900">Secure Checkout via Stripe</p>
                  <p className="text-sm text-slate-600">
                    You&apos;ll be redirected to Stripe&apos;s secure checkout to complete your payment.
                  </p>
                </div>
              </section>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full rounded-full bg-primary-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Continue to Payment
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-bold text-slate-900">Order Summary</h2>

              {/* Cart Items */}
              <div className="mb-6 space-y-4 border-b border-slate-200 pb-6">
                {cart.lines.map((line) => (
                  <div key={line.id} className="flex gap-3">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                      {line.merchandise.product.featuredImage ? (
                        <Image
                          src={line.merchandise.product.featuredImage.url}
                          alt={line.merchandise.product.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                        {line.quantity}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {line.merchandise.product.title}
                      </p>
                      <p className="text-xs text-slate-500">{line.merchandise.title}</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {formatMoney(line.cost.subtotalAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="font-medium">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (estimated)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-slate-900">Total</span>
                    <span className="text-lg font-bold text-primary-600">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 rounded-lg bg-slate-50 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  <Lock className="h-4 w-4" />
                  <span>Secure & encrypted checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

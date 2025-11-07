"use client";

import { useState } from 'react';
import { X, Lock, Check, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_PLANS, PREMIUM_FEATURES } from '@/lib/subscription';
import { useAuth } from '@/contexts/AuthContext';

type PaywallModalProps = {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
};

export default function PaywallModal({ isOpen, onClose, feature }: PaywallModalProps) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    if (!user) {
      alert('Please sign in to subscribe');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-subscription-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: selectedPlan,
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative my-16 w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h2 className="mb-1 text-xl font-bold text-slate-900">
            Unlock Premium Features
          </h2>
          {feature && (
            <p className="text-sm text-slate-600">
              {feature} is a premium feature
            </p>
          )}
        </div>

        {/* Plan Selection */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {/* Monthly Plan */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`rounded-xl border-2 p-3 text-left transition ${
              selectedPlan === 'monthly'
                ? 'border-primary-600 bg-primary-50'
                : 'border-slate-200 hover:border-primary-300'
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Monthly</h3>
              <div className={`h-4 w-4 rounded-full border-2 ${
                selectedPlan === 'monthly'
                  ? 'border-primary-600 bg-primary-600'
                  : 'border-slate-300'
              } flex items-center justify-center`}>
                {selectedPlan === 'monthly' && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div className="mb-1">
              <span className="text-xl font-bold text-slate-900">
                ${SUBSCRIPTION_PLANS.MONTHLY.price}
              </span>
              <span className="text-sm text-slate-600">/month</span>
            </div>
            <p className="text-xs text-slate-600">
              Billed monthly, cancel anytime
            </p>
          </button>

          {/* Annual Plan */}
          <button
            onClick={() => setSelectedPlan('annual')}
            className={`relative rounded-xl border-2 p-3 text-left transition ${
              selectedPlan === 'annual'
                ? 'border-primary-600 bg-primary-50'
                : 'border-slate-200 hover:border-primary-300'
            }`}
          >
            {/* Best Value Badge */}
            <div className="absolute -right-1 -top-1 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
              Save {SUBSCRIPTION_PLANS.ANNUAL.savings}
            </div>
            
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Annual</h3>
              <div className={`h-4 w-4 rounded-full border-2 ${
                selectedPlan === 'annual'
                  ? 'border-primary-600 bg-primary-600'
                  : 'border-slate-300'
              } flex items-center justify-center`}>
                {selectedPlan === 'annual' && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div className="mb-1">
              <span className="text-xl font-bold text-slate-900">
                ${SUBSCRIPTION_PLANS.ANNUAL.price}
              </span>
              <span className="text-sm text-slate-600">/year</span>
            </div>
            <p className="text-xs text-slate-600">
              ${(SUBSCRIPTION_PLANS.ANNUAL.price / 12).toFixed(2)}/month when paid annually
            </p>
          </button>
        </div>

        {/* Features List */}
        <div className="mb-4 rounded-xl bg-slate-50 p-3">
          <h4 className="mb-2 text-xs font-semibold text-slate-900">Premium includes:</h4>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {PREMIUM_FEATURES.map((feat) => (
              <div key={feat} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                <span className="text-xs text-slate-700">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscribe Button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-primary-700 hover:to-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Subscribe Now
            </span>
          )}
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  );
}

"use client";

import { ReactNode, useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import PaywallModal from './PaywallModal';
import { Lock } from 'lucide-react';

type PremiumFeatureWrapperProps = {
  children: ReactNode;
  featureName: string;
  showPreview?: boolean;
};

export default function PremiumFeatureWrapper({ 
  children, 
  featureName,
  showPreview = false 
}: PremiumFeatureWrapperProps) {
  const { isPremium, loading, checkFeatureAccess } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  const hasAccess = checkFeatureAccess(featureName);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <div className="relative">
          {/* Blurred Preview */}
          {showPreview && (
            <div className="pointer-events-none select-none blur-sm">
              {children}
            </div>
          )}

          {/* Paywall Overlay */}
          <div className={`${showPreview ? 'absolute inset-0' : ''} flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-8`}>
            <div className="max-w-md text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700">
                <Lock className="h-10 w-10 text-white" />
              </div>
              
              <h2 className="mb-3 text-2xl font-bold text-slate-900">
                Premium Feature
              </h2>
              
              <p className="mb-6 text-slate-600">
                {featureName} is available with Adams Eden Premium. 
                Unlock this and all premium features to enhance your gardening experience.
              </p>

              <button
                onClick={() => setShowPaywall(true)}
                className="rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-3 font-semibold text-white shadow-lg transition hover:from-primary-700 hover:to-primary-800"
              >
                Upgrade to Premium
              </button>

              <p className="mt-4 text-sm text-slate-500">
                Starting at $4.99/month • Cancel anytime
              </p>
            </div>
          </div>
        </div>

        <PaywallModal 
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature={featureName}
        />
      </>
    );
  }

  return <>{children}</>;
}

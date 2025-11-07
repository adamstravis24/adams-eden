"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { UserSubscription } from '@/lib/subscription';

type SubscriptionContextType = {
  subscription: UserSubscription | null;
  loading: boolean;
  isPremium: boolean;
  checkFeatureAccess: (feature: string) => boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    // Listen to user's subscription status in Firebase Realtime Database
    const subscriptionRef = ref(database, `users/${user.uid}/subscription`);

    const unsubscribe = onValue(subscriptionRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const mapped: UserSubscription = {
          status: data.status || 'none',
          subscriptionId: data.subscriptionId,
          planType: data.planType,
          currentPeriodEnd: data.currentPeriodEnd,
            // Extended lifecycle fields
          currentPeriodStart: data.currentPeriodStart,
          priceId: data.priceId,
          customerId: data.customerId,
          cancelAt: data.cancelAt ?? null,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          canceledAt: data.canceledAt ?? null,
          endedAt: data.endedAt ?? null,
          updatedAt: data.updatedAt,
        };
        setSubscription(mapped);
      } else {
        setSubscription({ status: 'none' });
      }

      setLoading(false);
    });

    return () => {
      off(subscriptionRef);
      unsubscribe();
    };
  }, [user]);

  const isPremium = subscription?.status === 'active' || subscription?.status === 'trialing';

  const checkFeatureAccess = (feature: string) => {
    const premiumFeatures = ['calendar', 'tracker', 'journal', 'planner'];
    
    if (!premiumFeatures.includes(feature.toLowerCase())) {
      return true; // Free feature
    }
    
    return isPremium;
  };

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, isPremium, checkFeatureAccess }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

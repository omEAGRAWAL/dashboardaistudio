'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import {
  FeatureKey, OrgFeatures, OrgSubscription,
  getDefaultFeatures, trialDaysLeft as calcTrialDaysLeft,
  FEATURES,
} from '@/lib/features';

interface OrgData {
  id: string;
  name: string;
  ownerId: string;
  ownerPhone?: string;
  createdAt: any;
  subscription?: OrgSubscription;
  features?: OrgFeatures;
  referral?: {
    referralCode?: string;
    referredBy?: string;
    referredByCode?: string;
  };
  metadata?: {
    notes?: string;
    suspendedAt?: any;
  };
}

interface OrgContextType {
  orgData: OrgData | null;
  subscription: OrgSubscription | null;
  features: OrgFeatures;
  isTrialing: boolean;
  trialDaysLeft: number | null;
  hasFeature: (key: FeatureKey) => boolean;
  orgLoading: boolean;
}

const OrgContext = createContext<OrgContextType>({
  orgData: null,
  subscription: null,
  features: getDefaultFeatures(),
  isTrialing: false,
  trialDaysLeft: null,
  hasFeature: () => true,
  orgLoading: true,
});

export const useOrg = () => useContext(OrgContext);

export function useFeatureAccess(featureKey: FeatureKey) {
  const { features, subscription } = useOrg();
  return {
    hasAccess: features[featureKey] ?? true,
    isTrialing: subscription?.status === 'trialing',
    planId: subscription?.planId ?? null,
  };
}

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { orgId, role, loading: authLoading } = useAuth();
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);

  useEffect(() => {
    // Superadmin has no orgId — skip loading org, grant all features
    if (authLoading) return;
    if (!orgId || role === 'superadmin') {
      setOrgData(null);
      setOrgLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'organizations', orgId), (snap) => {
      if (snap.exists()) {
        setOrgData({ id: snap.id, ...snap.data() } as OrgData);
      } else {
        setOrgData(null);
      }
      setOrgLoading(false);
    });

    return () => unsub();
  }, [orgId, role, authLoading]);

  const subscription = orgData?.subscription ?? null;

  // Build effective feature map: use stored features if present, else default all-true
  const features: OrgFeatures = orgData?.features
    ? (Object.values(FEATURES).reduce(
        (acc, key) => ({ ...acc, [key]: orgData.features![key as FeatureKey] ?? true }),
        {} as OrgFeatures
      ))
    : getDefaultFeatures();

  const isTrialing = subscription?.status === 'trialing';
  const daysLeft = subscription?.trialEndsAt
    ? calcTrialDaysLeft(subscription.trialEndsAt)
    : null;

  const hasFeature = (key: FeatureKey) => {
    if (role === 'superadmin') return true;
    return features[key] ?? true;
  };

  return (
    <OrgContext.Provider value={{
      orgData,
      subscription,
      features,
      isTrialing,
      trialDaysLeft: daysLeft,
      hasFeature,
      orgLoading,
    }}>
      {children}
    </OrgContext.Provider>
  );
}

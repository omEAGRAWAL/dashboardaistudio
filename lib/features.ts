export const FEATURES = {
  LEADS_CRM:         'leads_crm',
  BOOKINGS:          'bookings',
  PACKAGES:          'packages',
  WHATSAPP_INBOX:      'whatsapp_inbox',
  WHATSAPP_BROADCAST:  'whatsapp_broadcast',
  CHATBOT_BUILDER:     'chatbot_builder',
  WEBSITE_BUILDER:   'website_builder',
  CAMPAIGN_BUILDER:  'campaign_builder',
  BOOKING_FORM:      'booking_form',
  TEAM_MANAGEMENT:   'team_management',
  CUSTOM_DOMAIN:     'custom_domain',
  ANALYTICS:         'analytics',
  RAZORPAY_PAYMENTS: 'razorpay_payments',
  API_WEBHOOKS:      'api_webhooks',
  EMAIL_MARKETING:   'email_marketing',
} as const;

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];

export const PLAN_FEATURES: Record<string, FeatureKey[]> = {
  free_trial: Object.values(FEATURES) as FeatureKey[],
  starter: [
    FEATURES.LEADS_CRM,
    FEATURES.BOOKINGS,
    FEATURES.PACKAGES,
    FEATURES.WHATSAPP_INBOX,
    FEATURES.BOOKING_FORM,
  ],
  pro: [
    FEATURES.LEADS_CRM,
    FEATURES.BOOKINGS,
    FEATURES.PACKAGES,
    FEATURES.WHATSAPP_INBOX,
    FEATURES.WHATSAPP_BROADCAST,
    FEATURES.BOOKING_FORM,
    FEATURES.CHATBOT_BUILDER,
    FEATURES.WEBSITE_BUILDER,
    FEATURES.CAMPAIGN_BUILDER,
    FEATURES.TEAM_MANAGEMENT,
    FEATURES.CUSTOM_DOMAIN,
    FEATURES.ANALYTICS,
    FEATURES.EMAIL_MARKETING,
  ],
  enterprise: Object.values(FEATURES) as FeatureKey[],
};

export const PLAN_LABELS: Record<string, string> = {
  free_trial: 'Free Trial',
  starter:    'Starter',
  pro:        'Pro',
  enterprise: 'Enterprise',
};

export const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  free_trial: { monthly: 0,       annual: 0 },
  starter:    { monthly: 99900,   annual: 999000 },  // paise: ₹999/mo, ₹9,990/yr
  pro:        { monthly: 199900,  annual: 1999000 },
  enterprise: { monthly: 399900,  annual: 3999000 },
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  leads_crm:         'Leads CRM',
  bookings:          'Bookings',
  packages:          'Packages',
  whatsapp_inbox:      'WhatsApp Inbox',
  whatsapp_broadcast:  'WhatsApp Broadcast',
  chatbot_builder:     'Chatbot Builder',
  website_builder:   'Website Builder',
  campaign_builder:  'Campaign Builder',
  booking_form:      'Booking Form',
  team_management:   'Team Management',
  custom_domain:     'Custom Domain',
  analytics:         'Analytics',
  razorpay_payments: 'Razorpay Payments',
  api_webhooks:      'API & Webhooks',
  email_marketing:   'Email Marketing',
};

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled';
export type PlanId = 'free_trial' | 'starter' | 'pro' | 'enterprise';

export interface OrgSubscription {
  planId: PlanId;
  status: SubscriptionStatus;
  trialStartedAt?: any;
  trialEndsAt?: any;
  currentPeriodStart?: any;
  currentPeriodEnd?: any;
}

export interface OrgFeatures extends Record<FeatureKey, boolean> {}

export function getDefaultFeatures(): OrgFeatures {
  return Object.values(FEATURES).reduce(
    (acc, f) => ({ ...acc, [f]: true }),
    {} as OrgFeatures
  );
}

export function featuresFromPlan(planId: PlanId): OrgFeatures {
  const enabled = PLAN_FEATURES[planId] ?? [];
  return Object.values(FEATURES).reduce(
    (acc, f) => ({ ...acc, [f]: enabled.includes(f as FeatureKey) }),
    {} as OrgFeatures
  );
}

export function trialDaysLeft(trialEndsAt: any): number | null {
  if (!trialEndsAt) return null;
  const end = trialEndsAt.toDate ? trialEndsAt.toDate() : new Date(trialEndsAt);
  const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { featuresFromPlan, FEATURES } from '@/lib/features';
import type { PlanId, FeatureKey } from '@/lib/features';

async function verifySuperadmin(req: NextRequest): Promise<string | null> {
  const uid = req.headers.get('x-uid');
  if (!uid) return null;
  const snap = await adminDb.doc(`users/${uid}`).get();
  return (snap.exists && snap.data()?.role === 'superadmin') ? uid : null;
}

export async function POST(req: NextRequest) {
  try {
    const callerUid = await verifySuperadmin(req);
    if (!callerUid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { orgId, planId, status, trialEndsAt, features, notes } = body as {
      orgId: string;
      planId?: PlanId;
      status?: string;
      trialEndsAt?: string;
      features?: Partial<Record<FeatureKey, boolean>>;
      notes?: string;
    };

    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });

    const orgRef = adminDb.doc(`organizations/${orgId}`);
    const orgSnap = await orgRef.get();
    if (!orgSnap.exists) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

    const existing = orgSnap.data()!;
    const update: Record<string, any> = {
      'metadata.lastAdminActionAt': FieldValue.serverTimestamp(),
      'metadata.lastAdminActionBy': callerUid,
    };

    if (planId) {
      update['subscription.planId'] = planId;
      const planFeatures = featuresFromPlan(planId);
      const merged = { ...planFeatures, ...(features || {}) };
      Object.values(FEATURES).forEach((key) => {
        update[`features.${key}`] = merged[key as FeatureKey] ?? true;
      });
    } else if (features) {
      Object.entries(features).forEach(([key, val]) => {
        update[`features.${key}`] = val;
      });
    }

    if (status) {
      update['subscription.status'] = status;
      if (status === 'suspended') {
        update['metadata.suspendedAt'] = FieldValue.serverTimestamp();
      } else if (existing.metadata?.suspendedAt) {
        update['metadata.suspendedAt'] = null;
      }
    }

    if (trialEndsAt) {
      update['subscription.trialEndsAt'] = new Date(trialEndsAt);
      if (!existing.subscription?.trialStartedAt) {
        update['subscription.trialStartedAt'] = FieldValue.serverTimestamp();
      }
      if (!update['subscription.status']) {
        update['subscription.status'] = 'trialing';
      }
    }

    if (notes !== undefined) {
      update['metadata.notes'] = notes;
    }

    await orgRef.update(update);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('update-org-subscription error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

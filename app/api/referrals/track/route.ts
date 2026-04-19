import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { code, newOrgId } = await req.json() as { code: string; newOrgId: string };
    if (!code || !newOrgId) {
      return NextResponse.json({ error: 'code and newOrgId required' }, { status: 400 });
    }

    // Find org that owns this referral code
    const snap = await adminDb
      .collection('organizations')
      .where('referral.referralCode', '==', code.toUpperCase())
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    const referrerDoc = snap.docs[0];
    const referrerOrgId = referrerDoc.id;
    const referrerData = referrerDoc.data();

    // Get new org info
    const newOrgDoc = await adminDb.doc(`organizations/${newOrgId}`).get();
    if (!newOrgDoc.exists) {
      return NextResponse.json({ error: 'New org not found' }, { status: 404 });
    }
    const newOrgData = newOrgDoc.data()!;

    // Get new org owner email
    const newOwnerDoc = await adminDb.doc(`users/${newOrgData.ownerId}`).get();
    const newOwnerEmail = newOwnerDoc.data()?.email || '';

    // Create referral record
    await adminDb.collection('referrals').add({
      code: code.toUpperCase(),
      referrerOrgId,
      referrerOwnerId: referrerData.ownerId || '',
      referredOrgId: newOrgId,
      referredOwnerId: newOrgData.ownerId,
      referredEmail: newOwnerEmail,
      status: 'pending',
      rewardType: 'discount_month',
      rewardValue: 99900, // ₹999 in paise
      rewardCreditedAt: null,
      convertedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    });

    // Update new org with referral info
    await adminDb.doc(`organizations/${newOrgId}`).update({
      'referral.referredBy': referrerOrgId,
      'referral.referredByCode': code.toUpperCase(),
    });

    return NextResponse.json({ success: true, referrerOrgId });
  } catch (err: any) {
    console.error('referrals/track error:', err);
    // Silent failure — don't block signup
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

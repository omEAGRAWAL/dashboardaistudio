import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Public endpoint — no auth required.
// Returns ONLY non-sensitive Razorpay config fields (keyId, advancePercentage).
// keySecret and webhookSecret are NEVER returned.
export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get('orgId');
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });

    const snap = await adminDb.collection('razorpay_config').doc(orgId).get();
    if (!snap.exists) {
      return NextResponse.json({ configured: false });
    }
    const data = snap.data()!;
    return NextResponse.json({
      configured: true,
      keyId: data.keyId,
      advancePercentage: data.advancePercentage ?? 30,
    });
  } catch (err: any) {
    console.error('[public-config]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

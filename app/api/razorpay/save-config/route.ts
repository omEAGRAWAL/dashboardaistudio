import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    // Verify Firebase ID token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { orgId, keyId, keySecret, webhookSecret, advancePercentage, advanceType, advanceFixedAmount } = body;

    if (!orgId || !keyId) {
      return NextResponse.json({ error: 'orgId and keyId are required' }, { status: 400 });
    }

    // Verify the user belongs to this org
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 403 });
    }
    const userData = userDoc.data()!;
    if (userData.orgId !== orgId && userData.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const configRef = adminDb.collection('razorpay_config').doc(orgId);
    const existingSnap = await configRef.get();
    const existingConfig = existingSnap.exists ? existingSnap.data()! : {};
    const nextKeySecret = keySecret?.trim() || existingConfig.keySecret;
    const nextWebhookSecret = webhookSecret?.trim() || existingConfig.webhookSecret || '';

    if (!nextKeySecret) {
      return NextResponse.json({ error: 'keySecret is required for first-time setup' }, { status: 400 });
    }

    const type: 'percentage' | 'fixed' = advanceType === 'fixed' ? 'fixed' : 'percentage';

    // Validate based on advance type
    const pct = Number(advancePercentage);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      return NextResponse.json({ error: 'advancePercentage must be between 1 and 100' }, { status: 400 });
    }
    const fixedAmt = Number(advanceFixedAmount ?? 0);
    if (type === 'fixed' && (isNaN(fixedAmt) || fixedAmt < 1)) {
      return NextResponse.json({ error: 'advanceFixedAmount must be at least ₹1' }, { status: 400 });
    }

    // Store config — keySecret never goes back to client
    await configRef.set({
      keyId: keyId.trim(),
      keySecret: nextKeySecret,
      webhookSecret: nextWebhookSecret,
      advanceType: type,
      advancePercentage: pct,
      advanceFixedAmount: fixedAmt,
      currency: 'INR',
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Return only non-sensitive fields
    return NextResponse.json({ success: true, keyId: keyId.trim(), advanceType: type, advancePercentage: pct, advanceFixedAmount: fixedAmt });
  } catch (err: any) {
    console.error('[save-config]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: return only non-sensitive config fields for the UI
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const orgId = req.nextUrl.searchParams.get('orgId');
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) return NextResponse.json({ error: 'User not found' }, { status: 403 });
    const userData = userDoc.data()!;
    if (userData.orgId !== orgId && userData.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snap = await adminDb.collection('razorpay_config').doc(orgId).get();
    if (!snap.exists) {
      return NextResponse.json({ configured: false });
    }
    const data = snap.data()!;
    // NEVER return keySecret or webhookSecret
    return NextResponse.json({
      configured: true,
      keyId: data.keyId,
      advanceType: data.advanceType ?? 'percentage',
      advancePercentage: data.advancePercentage ?? 30,
      advanceFixedAmount: data.advanceFixedAmount ?? 0,
      hasWebhookSecret: !!data.webhookSecret,
    });
  } catch (err: any) {
    console.error('[get-config]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }
    // Check uniqueness
    const snap = await adminDb
      .collection('organizations')
      .where('referral.referralCode', '==', code)
      .limit(1)
      .get();
    if (snap.empty) return code;
  }
  throw new Error('Could not generate unique referral code');
}

async function verifySuperadmin(req: NextRequest): Promise<string | null> {
  const uid = req.headers.get('x-uid');
  if (!uid) return null;
  const snap = await adminDb.doc(`users/${uid}`).get();
  return (snap.exists && snap.data()?.role === 'superadmin') ? uid : null;
}

export async function GET(req: NextRequest) {
  try {
    const uid = await verifySuperadmin(req);
    if (!uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const orgId = new URL(req.url).searchParams.get('orgId');
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });

    const orgSnap = await adminDb.doc(`organizations/${orgId}`).get();
    const code = orgSnap.data()?.referral?.referralCode || null;

    // Referral stats
    const [totalSnap, convertedSnap] = await Promise.all([
      adminDb.collection('referrals').where('referrerOrgId', '==', orgId).get(),
      adminDb.collection('referrals').where('referrerOrgId', '==', orgId).where('status', '==', 'converted').get(),
    ]);

    return NextResponse.json({
      code,
      stats: {
        total: totalSnap.size,
        converted: convertedSnap.size,
        pending: totalSnap.size - convertedSnap.size,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = await verifySuperadmin(req);
    if (!uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { orgId, action } = await req.json() as { orgId: string; action: 'generate' | 'revoke' };
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });

    const orgRef = adminDb.doc(`organizations/${orgId}`);

    if (action === 'generate') {
      const code = await generateUniqueCode();
      await orgRef.update({ 'referral.referralCode': code });
      return NextResponse.json({ code });
    }

    if (action === 'revoke') {
      await orgRef.update({ 'referral.referralCode': null });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

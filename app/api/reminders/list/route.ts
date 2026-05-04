import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  let isSuperadmin = false;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userDoc = await adminDb.doc(`users/${uid}`).get();
  if (!userDoc.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const userData = userDoc.data()!;
  const orgId = userData.orgId;
  isSuperadmin = userData.role === 'superadmin';

  const { searchParams } = new URL(req.url);
  const filterLeadId = searchParams.get('leadId');
  const filterStatus = searchParams.get('status');

  let q = adminDb.collection('reminders') as FirebaseFirestore.Query;

  if (!isSuperadmin) {
    q = q.where('orgId', '==', orgId);
  }
  if (filterLeadId) {
    q = q.where('leadId', '==', filterLeadId);
  }
  if (filterStatus) {
    q = q.where('status', '==', filterStatus);
  }

  q = q.orderBy('scheduledAt', 'asc');

  const snap = await q.get();
  const reminders = snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    scheduledAt: d.data().scheduledAt?.toDate?.()?.toISOString() ?? null,
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? null,
    sentAt: d.data().sentAt?.toDate?.()?.toISOString() ?? null,
  }));

  return NextResponse.json({ reminders });
}

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userDoc = await adminDb.doc(`users/${uid}`).get();
  if (!userDoc.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const orgId = userDoc.data()?.orgId;
  if (!orgId) return NextResponse.json({ error: 'User has no organization' }, { status: 400 });

  const body = await req.json();
  const { leadId, leadName, leadPhone, title, note, scheduledAt, recipientIds, channels } = body;

  if (!leadId || !title || !scheduledAt) {
    return NextResponse.json({ error: 'leadId, title, scheduledAt are required' }, { status: 400 });
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return NextResponse.json({ error: 'Invalid scheduledAt date' }, { status: 400 });
  }

  const ref = await adminDb.collection('reminders').add({
    orgId,
    leadId,
    leadName: leadName || '',
    leadPhone: leadPhone || '',
    title,
    note: note || '',
    scheduledAt: scheduledDate,
    recipientIds: recipientIds ?? [],
    channels: channels ?? ['email', 'push'],
    status: 'pending',
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id });
}

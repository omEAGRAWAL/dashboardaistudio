import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

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
  const role = userDoc.data()?.role;

  const { reminderId } = await req.json();
  if (!reminderId) return NextResponse.json({ error: 'reminderId is required' }, { status: 400 });

  const reminderDoc = await adminDb.doc(`reminders/${reminderId}`).get();
  if (!reminderDoc.exists) return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });

  const reminder = reminderDoc.data()!;

  // Only allow cancellation by members of the same org (superadmin can cancel any)
  if (role !== 'superadmin' && reminder.orgId !== orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (reminder.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending reminders can be cancelled' }, { status: 400 });
  }

  await adminDb.doc(`reminders/${reminderId}`).update({ status: 'cancelled' });
  return NextResponse.json({ success: true });
}

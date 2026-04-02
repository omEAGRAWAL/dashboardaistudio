import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getNextAssignee } from '@/lib/round-robin';
import { sendLeadNotification } from '@/lib/send-push-notification';

export async function POST(req: NextRequest) {
  try {
    // Verify Firebase ID token
    const authHeader = req.headers.get('Authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's orgId
    const userDoc = await adminDb.doc(`users/${uid}`).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const orgId = userDoc.data()?.orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 400 });
    }

    const body = await req.json();
    const { name, phone, source, pax, travelDate, category, latestRemark, sourceId } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // Get next assignee via round-robin
    const assigneeId = await getNextAssignee(orgId);

    const leadData: Record<string, any> = {
      name: String(name).trim(),
      phone: String(phone).trim(),
      source: source ? String(source).trim() : 'Manual',
      pax: Number(pax) || 1,
      status: 'New Enquiry',
      category: category || 'None',
      orgId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (travelDate) leadData.travelDate = String(travelDate).trim();
    if (latestRemark) leadData.latestRemark = String(latestRemark).trim();
    if (sourceId) leadData.sourceId = String(sourceId).trim();
    if (assigneeId) leadData.assigneeId = assigneeId;

    const docRef = await adminDb.collection('leads').add(leadData);

    // Send push notification to assigned agent (fire-and-forget)
    if (assigneeId) {
      sendLeadNotification(assigneeId, { name: leadData.name, phone: leadData.phone, source: leadData.source, category: leadData.category, pax: leadData.pax, travelDate: leadData.travelDate }, docRef.id).catch(() => {});
    }

    return NextResponse.json({ success: true, id: docRef.id, assigneeId }, { status: 201 });
  } catch (err) {
    console.error('[leads/create] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

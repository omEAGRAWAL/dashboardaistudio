import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getMetaCreds, sendText } from '@/lib/meta-whatsapp';

// ─── GET — list broadcasts for an org ────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });

  const snap = await adminDb
    .collection('broadcasts')
    .where('orgId', '==', orgId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  const broadcasts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ broadcasts });
}

// ─── POST — create and send a broadcast ──────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { orgId, message, segment, customPhones } = await req.json();

    if (!orgId || !message || !segment) {
      return NextResponse.json(
        { error: 'orgId, message, and segment are required' },
        { status: 400 },
      );
    }

    // Resolve recipient phone numbers
    const phones = await resolveRecipients(orgId, segment, customPhones);

    if (phones.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found for the selected segment.' },
        { status: 400 },
      );
    }

    // Create broadcast record (status: sending)
    const broadcastRef = await adminDb.collection('broadcasts').add({
      orgId,
      message,
      segment,
      totalRecipients: phones.length,
      sentCount: 0,
      failedCount: 0,
      status: 'sending',
      createdAt: FieldValue.serverTimestamp(),
    });

    // Resolve provider
    const metaCreds = await getMetaCreds(orgId);
    const twilioClient = metaCreds ? null : await getTwilioClient(orgId);

    let sentCount = 0;
    let failedCount = 0;

    for (const rawPhone of phones) {
      const phone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone.replace(/\D/g, '')}`;
      try {
        if (metaCreds) {
          await sendText(metaCreds, phone, message);
        } else if (twilioClient) {
          await twilioClient.client.messages.create({
            from: `whatsapp:${twilioClient.from}`,
            to: `whatsapp:${phone}`,
            body: message,
          });
        } else {
          throw new Error('No WhatsApp provider configured');
        }

        await adminDb.collection('whatsapp_messages').add({
          orgId,
          conversationId: `${orgId}_${phone.replace('+', '')}`,
          direction: 'outbound',
          body: message,
          customerPhone: phone,
          sentAt: FieldValue.serverTimestamp(),
          broadcastId: broadcastRef.id,
        });

        sentCount++;
      } catch {
        failedCount++;
      }
    }

    await broadcastRef.update({
      status: 'completed',
      sentCount,
      failedCount,
      completedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      broadcastId: broadcastRef.id,
      sentCount,
      failedCount,
      total: phones.length,
    });
  } catch (err: any) {
    console.error('[broadcast]', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveRecipients(
  orgId: string,
  segment: string,
  customPhones?: string[],
): Promise<string[]> {
  if (segment === 'custom') {
    return (customPhones ?? []).map((p) => p.trim()).filter(Boolean);
  }

  let q = adminDb.collection('leads').where('orgId', '==', orgId) as FirebaseFirestore.Query;

  if (segment !== 'all') {
    q = q.where('status', '==', segment);
  }

  const snap = await q.get();
  const seen = new Set<string>();
  const phones: string[] = [];

  snap.docs.forEach((d) => {
    const phone: string = (d.data().phone ?? '').trim();
    if (phone && !seen.has(phone)) {
      seen.add(phone);
      phones.push(phone);
    }
  });

  return phones;
}

async function getTwilioClient(orgId: string) {
  const numDoc = await adminDb.doc(`whatsapp_numbers/${orgId}`).get();
  if (!numDoc.exists) return null;
  const { phoneNumber, source } = numDoc.data()!;

  if (source === 'agency') {
    const credDoc = await adminDb.doc(`whatsapp_credentials/${orgId}`).get();
    if (!credDoc.exists) return null;
    const { accountSid, authToken } = credDoc.data()!;
    return { client: twilio(accountSid, authToken), from: phoneNumber };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return { client: twilio(sid, token), from: phoneNumber };
}

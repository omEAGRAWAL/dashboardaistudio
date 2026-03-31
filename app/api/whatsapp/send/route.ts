import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/** Resolve which Twilio credentials to use for an org */
async function getTwilioClient(orgId: string): Promise<{ client: ReturnType<typeof twilio>; from: string } | null> {
  const numDoc = await adminDb.doc(`whatsapp_numbers/${orgId}`).get();
  if (!numDoc.exists) return null;
  const { phoneNumber, source } = numDoc.data()!;

  if (source === 'agency') {
    // Agency has their own Twilio account
    const credDoc = await adminDb.doc(`whatsapp_credentials/${orgId}`).get();
    if (!credDoc.exists) return null;
    const { accountSid, authToken } = credDoc.data()!;
    return { client: twilio(accountSid, authToken), from: phoneNumber };
  }

  // Use Om's master Twilio account
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  return { client: twilio(accountSid, authToken), from: phoneNumber };
}

export async function POST(req: NextRequest) {
  try {
    const { orgId, to, body, conversationId } = await req.json();

    if (!orgId || !to || !body) {
      return NextResponse.json({ error: 'orgId, to, and body are required' }, { status: 400 });
    }

    const resolved = await getTwilioClient(orgId);
    if (!resolved) {
      return NextResponse.json(
        { error: 'No WhatsApp number assigned to this org. Contact your admin.' },
        { status: 404 }
      );
    }
    const { client, from } = resolved;

    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const message = await client.messages.create({
      from: `whatsapp:${from}`,
      to: toFormatted,
      body,
    });

    const customerPhone = to.replace(/^whatsapp:/, '');
    const convId = conversationId || `${orgId}_${customerPhone.replace('+', '')}`;

    await adminDb.collection('whatsapp_messages').add({
      orgId,
      conversationId: convId,
      direction: 'outbound',
      body,
      customerPhone,
      sentAt: FieldValue.serverTimestamp(),
      twilioSid: message.sid,
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (err: any) {
    console.error('WhatsApp send error:', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

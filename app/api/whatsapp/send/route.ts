import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getMetaCreds, sendText } from '@/lib/meta-whatsapp';

export async function POST(req: NextRequest) {
  try {
    const { orgId, to, body, conversationId } = await req.json();

    if (!orgId || !to || !body) {
      return NextResponse.json({ error: 'orgId, to, and body are required' }, { status: 400 });
    }

    const customerPhone = to.replace(/^whatsapp:/, '').replace(/^\+/, '');
    const convId = conversationId || `${orgId}_${customerPhone}`;

    // ── Try Meta first ──
    const metaCreds = await getMetaCreds(orgId);
    if (metaCreds) {
      const toFull = to.startsWith('+') ? to : `+${to.replace(/^whatsapp:/, '')}`;
      const res = await sendText(metaCreds, toFull, body);

      await adminDb.collection('whatsapp_messages').add({
        orgId,
        conversationId: convId,
        direction: 'outbound',
        body,
        customerPhone: toFull,
        sentAt: FieldValue.serverTimestamp(),
        metaMessageId: res?.messages?.[0]?.id ?? '',
      });

      return NextResponse.json({ success: true, provider: 'meta', id: res?.messages?.[0]?.id });
    }

    // ── Fall back to Twilio ──
    const twilioClient = await getTwilioClient(orgId);
    if (!twilioClient) {
      return NextResponse.json(
        { error: 'No WhatsApp number assigned to this org. Contact your admin.' },
        { status: 404 },
      );
    }

    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const message = await twilioClient.client.messages.create({
      from: `whatsapp:${twilioClient.from}`,
      to: toFormatted,
      body,
    });

    await adminDb.collection('whatsapp_messages').add({
      orgId,
      conversationId: convId,
      direction: 'outbound',
      body,
      customerPhone: to.replace(/^whatsapp:/, ''),
      sentAt: FieldValue.serverTimestamp(),
      twilioSid: message.sid,
    });

    return NextResponse.json({ success: true, provider: 'twilio', sid: message.sid });
  } catch (err: any) {
    console.error('[WhatsApp send]', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
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

  return {
    client: twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!),
    from: phoneNumber,
  };
}

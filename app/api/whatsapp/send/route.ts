import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { orgId, to, body, conversationId } = await req.json();

    if (!orgId || !to || !body) {
      return NextResponse.json({ error: 'orgId, to, and body are required' }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: 'Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.local' },
        { status: 500 }
      );
    }

    // Get org's assigned WhatsApp number
    const numDoc = await getDoc(doc(db, 'whatsapp_numbers', orgId));
    if (!numDoc.exists()) {
      return NextResponse.json(
        { error: 'No WhatsApp number assigned to this org. Contact your admin.' },
        { status: 404 }
      );
    }
    const { phoneNumber } = numDoc.data();

    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      from: `whatsapp:${phoneNumber}`,
      to: `whatsapp:${to}`,
      body,
    });

    const customerPhone = to.replace(/^whatsapp:/, '');
    const convId = conversationId || `${orgId}_${customerPhone.replace('+', '')}`;

    await addDoc(collection(db, 'whatsapp_messages'), {
      orgId,
      conversationId: convId,
      direction: 'outbound',
      body,
      customerPhone,
      sentAt: serverTimestamp(),
      twilioSid: message.sid,
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (err: any) {
    console.error('WhatsApp send error:', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

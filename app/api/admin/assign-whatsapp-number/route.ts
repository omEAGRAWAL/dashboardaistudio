import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { orgId, phoneNumber } = await req.json();

    if (!orgId || !phoneNumber) {
      return NextResponse.json({ error: 'orgId and phoneNumber are required' }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: 'Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.' },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    // Verify number exists in the Twilio account
    const numbers = await client.incomingPhoneNumbers.list({ phoneNumber });
    const matched = numbers.find((n) => n.phoneNumber === phoneNumber);
    if (!matched) {
      return NextResponse.json(
        { error: `Phone number ${phoneNumber} not found in your Twilio account` },
        { status: 404 }
      );
    }

    // Set the webhook URL on the number
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com';
    const webhookUrl = `${appUrl}/api/webhooks/whatsapp`;
    await client.incomingPhoneNumbers(matched.sid).update({
      smsUrl: webhookUrl,
      smsMethod: 'POST',
    });

    // Save mapping to Firestore
    await setDoc(doc(db, 'whatsapp_numbers', orgId), {
      phoneNumber,
      twilioPhoneNumberSid: matched.sid,
      assignedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, phoneNumber, sid: matched.sid, webhookUrl });
  } catch (err: any) {
    console.error('Assign WhatsApp number error:', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

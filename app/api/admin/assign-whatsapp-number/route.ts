import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/admin/assign-whatsapp-number
 *
 * Two modes:
 *   mode "om"     — Om assigns a number from his own Twilio account to an org
 *   mode "verify" — Verify and save an agency's own Twilio credentials + number
 *
 * Body (mode "om"):
 *   { orgId, phoneNumber }
 *
 * Body (mode "verify"):
 *   { orgId, phoneNumber, ownAccountSid, ownAuthToken }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId, phoneNumber, ownAccountSid, ownAuthToken } = body;
    const mode: 'om' | 'agency' = ownAccountSid ? 'agency' : 'om';

    if (!orgId || !phoneNumber) {
      return NextResponse.json({ error: 'orgId and phoneNumber are required' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com';
    const webhookUrl = `${appUrl}/api/webhooks/whatsapp`;

    if (mode === 'agency') {
      // --- Agency brings their own Twilio account ---
      if (!ownAuthToken) {
        return NextResponse.json({ error: 'ownAuthToken is required for agency mode' }, { status: 400 });
      }

      // Validate agency credentials by making a test API call
      const agencyClient = twilio(ownAccountSid, ownAuthToken);
      const numbers = await agencyClient.incomingPhoneNumbers.list({ phoneNumber });
      const matched = numbers.find((n) => n.phoneNumber === phoneNumber);
      if (!matched) {
        return NextResponse.json(
          { error: `Number ${phoneNumber} not found in the provided Twilio account` },
          { status: 404 }
        );
      }

      // Set webhook URL on their number
      await agencyClient.incomingPhoneNumbers(matched.sid).update({
        smsUrl: webhookUrl,
        smsMethod: 'POST',
      });

      // Save public info to whatsapp_numbers (no credentials here)
      await adminDb.doc(`whatsapp_numbers/${orgId}`).set({
        phoneNumber,
        twilioPhoneNumberSid: matched.sid,
        source: 'agency',
        assignedAt: FieldValue.serverTimestamp(),
      });

      // Save credentials securely in separate protected collection
      await adminDb.doc(`whatsapp_credentials/${orgId}`).set({
        accountSid: ownAccountSid,
        authToken: ownAuthToken,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, phoneNumber, sid: matched.sid, source: 'agency', webhookUrl });
    }

    // --- Om assigns from his own Twilio account ---
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      return NextResponse.json({ error: 'Twilio not configured in server env' }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    // Handle sandbox number (skip verification)
    if (phoneNumber === '+14155238886') {
      await adminDb.doc(`whatsapp_numbers/${orgId}`).set({
        phoneNumber,
        twilioPhoneNumberSid: 'sandbox',
        source: 'om',
        assignedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true, phoneNumber, sid: 'sandbox', source: 'om', webhookUrl });
    }

    // Verify number exists in Om's Twilio account
    const numbers = await client.incomingPhoneNumbers.list({ phoneNumber });
    const matched = numbers.find((n) => n.phoneNumber === phoneNumber);
    if (!matched) {
      return NextResponse.json(
        { error: `Number ${phoneNumber} not found in Om's Twilio account` },
        { status: 404 }
      );
    }

    // Set webhook URL
    await client.incomingPhoneNumbers(matched.sid).update({
      smsUrl: webhookUrl,
      smsMethod: 'POST',
    });

    // Save to Firestore
    await adminDb.doc(`whatsapp_numbers/${orgId}`).set({
      phoneNumber,
      twilioPhoneNumberSid: matched.sid,
      source: 'om',
      assignedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, phoneNumber, sid: matched.sid, source: 'om', webhookUrl });
  } catch (err: any) {
    console.error('Assign WhatsApp number error:', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { orgId } = await req.json();
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });

    await adminDb.doc(`whatsapp_numbers/${orgId}`).delete();
    await adminDb.doc(`whatsapp_credentials/${orgId}`).delete().catch(() => {}); // ignore if not exists

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

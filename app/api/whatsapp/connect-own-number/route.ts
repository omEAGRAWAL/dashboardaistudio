import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/whatsapp/connect-own-number
 * Called by org_admin to connect their own Twilio WhatsApp number.
 * Delegates to the assign-whatsapp-number admin API.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId, phoneNumber, ownAccountSid, ownAuthToken } = body;

    if (!orgId || !phoneNumber || !ownAccountSid || !ownAuthToken) {
      return NextResponse.json(
        { error: 'orgId, phoneNumber, ownAccountSid, and ownAuthToken are required' },
        { status: 400 }
      );
    }

    // Reuse the admin assign endpoint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const res = await fetch(`${appUrl}/api/admin/assign-whatsapp-number`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, phoneNumber, ownAccountSid, ownAuthToken }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

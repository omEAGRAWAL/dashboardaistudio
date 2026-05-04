import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const META_VER = 'v19.0';

export async function POST(req: NextRequest) {
  try {
    const { orgId, phoneNumberId, accessToken } = await req.json();

    if (!orgId || !phoneNumberId || !accessToken) {
      return NextResponse.json(
        { error: 'orgId, phoneNumberId, and accessToken are required' },
        { status: 400 },
      );
    }

    // Validate credentials by fetching phone number info from Meta Graph API
    const verifyRes = await fetch(
      `https://graph.facebook.com/${META_VER}/${phoneNumberId}?fields=display_phone_number,verified_name`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      throw new Error(verifyData.error?.message ?? 'Invalid Meta credentials — check your Phone Number ID and token.');
    }

    const phoneNumber: string = verifyData.display_phone_number ?? phoneNumberId;
    const verifiedName: string = verifyData.verified_name ?? '';

    await adminDb.doc(`whatsapp_numbers/${orgId}`).set(
      {
        source: 'meta_agency',
        phoneNumberId,
        phoneNumber,
        verifiedName,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await adminDb.doc(`whatsapp_credentials/${orgId}`).set(
      {
        accessToken,
        phoneNumberId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({ success: true, phoneNumber, verifiedName });
  } catch (err: any) {
    console.error('[connect-meta-number]', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { orgId } = await req.json();
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });

    await Promise.all([
      adminDb.doc(`whatsapp_numbers/${orgId}`).delete(),
      adminDb.doc(`whatsapp_credentials/${orgId}`).delete(),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

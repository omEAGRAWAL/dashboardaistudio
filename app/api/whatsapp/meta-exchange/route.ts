import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const META_VER = 'v19.0';
const META_BASE = `https://graph.facebook.com/${META_VER}`;

async function metaGet(path: string, token: string) {
  const res = await fetch(`${META_BASE}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Meta API ${res.status}`);
  return data;
}

// ─── POST — exchange Embedded Signup code for a stored long-lived token ───────
//
// Called after the agency completes Meta's Embedded Signup popup.
// Flow:
//   1. Exchange one-time auth code → short-lived user token    (server-only)
//   2. Exchange short-lived token  → 60-day long-lived token   (server-only)
//   3. Fetch phone number display info to confirm identity
//   4. Subscribe app to WABA webhooks so inbound messages reach us
//   5. Persist everything to Firestore (credentials never touch the browser)

export async function POST(req: NextRequest) {
  try {
    const { orgId, code, phoneNumberId, wabaId } = await req.json();

    if (!orgId || !code || !phoneNumberId) {
      return NextResponse.json(
        { error: 'orgId, code, and phoneNumberId are required' },
        { status: 400 },
      );
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: 'META_APP_ID / META_APP_SECRET not configured on server.' },
        { status: 500 },
      );
    }

    // ── Step 1: code → short-lived user token ────────────────────────────────
    const codeRes = await fetch(
      `${META_BASE}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`,
    );
    const codeData = await codeRes.json();
    if (!codeRes.ok) {
      throw new Error(codeData.error?.message ?? 'Failed to exchange authorization code.');
    }
    const shortToken: string = codeData.access_token;

    // ── Step 2: short-lived → 60-day long-lived token ────────────────────────
    const longRes = await fetch(
      `${META_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`,
    );
    const longData = await longRes.json();
    if (!longRes.ok) {
      throw new Error(longData.error?.message ?? 'Failed to get long-lived token.');
    }
    const accessToken: string = longData.access_token;
    const expiresIn: number = longData.expires_in ?? 5_183_944; // default 60 days
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // ── Step 3: Verify phone number and fetch display info ───────────────────
    const phoneData = await metaGet(
      `${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
      accessToken,
    );
    const phoneNumber: string = phoneData.display_phone_number ?? '';
    const verifiedName: string = phoneData.verified_name ?? '';
    const qualityRating: string = phoneData.quality_rating ?? '';

    // ── Step 4: Subscribe app to WABA webhooks ───────────────────────────────
    if (wabaId) {
      await fetch(`${META_BASE}/${wabaId}/subscribed_apps`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch((e) => console.warn('[meta-exchange] webhook subscription failed:', e.message));
    }

    // ── Step 5: Persist ───────────────────────────────────────────────────────
    await adminDb.doc(`whatsapp_numbers/${orgId}`).set(
      {
        source: 'meta_agency',
        phoneNumberId,
        wabaId: wabaId ?? null,
        phoneNumber,
        verifiedName,
        qualityRating,
        tokenExpiresAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await adminDb.doc(`whatsapp_credentials/${orgId}`).set(
      {
        accessToken,
        phoneNumberId,
        wabaId: wabaId ?? null,
        tokenExpiresAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({ success: true, phoneNumber, verifiedName, tokenExpiresAt, qualityRating });
  } catch (err: any) {
    console.error('[meta-exchange]', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

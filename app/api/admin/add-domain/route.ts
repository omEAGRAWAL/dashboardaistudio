import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // optional
const PLATFORM_HOST = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? '';

function vercelUrl(path: string) {
  const base = `https://api.vercel.com${path}`;
  return VERCEL_TEAM_ID ? `${base}?teamId=${VERCEL_TEAM_ID}` : base;
}

/**
 * POST /api/admin/add-domain
 * Body: { orgId, hostname, type: 'subdomain' | 'custom' }
 *
 * - Writes domains/{hostname} → { orgId, type } in Firestore
 * - For type='custom': also adds domain to Vercel project
 * - Updates organizations/{orgId} with subdomain/customDomain field
 */
export async function POST(req: NextRequest) {
  try {
    const { orgId, hostname, type } = await req.json() as {
      orgId: string;
      hostname: string;
      type: 'subdomain' | 'custom';
    };

    if (!orgId || !hostname || !type) {
      return NextResponse.json({ error: 'orgId, hostname, and type are required' }, { status: 400 });
    }

    // Validate hostname format
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!hostnameRegex.test(hostname)) {
      return NextResponse.json({ error: 'Invalid hostname format' }, { status: 400 });
    }

    let vercelResponse: any = null;

    if (type === 'custom') {
      // Add to Vercel project
      if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
        return NextResponse.json(
          { error: 'VERCEL_TOKEN and VERCEL_PROJECT_ID env vars are not set' },
          { status: 500 }
        );
      }

      const vRes = await fetch(vercelUrl(`/v10/projects/${VERCEL_PROJECT_ID}/domains`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: hostname }),
      });

      vercelResponse = await vRes.json();

      if (!vRes.ok && vercelResponse.error?.code !== 'domain_already_in_use') {
        return NextResponse.json(
          { error: vercelResponse.error?.message ?? 'Failed to add domain to Vercel' },
          { status: vRes.status }
        );
      }
    }

    // Write reverse-lookup doc
    await adminDb.doc(`domains/${hostname}`).set({
      orgId,
      type,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update org doc
    const orgField = type === 'subdomain' ? 'subdomain' : 'customDomain';
    await adminDb.doc(`organizations/${orgId}`).update({ [orgField]: hostname });

    return NextResponse.json({ success: true, hostname, vercel: vercelResponse });
  } catch (err: any) {
    console.error('[add-domain] error:', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/add-domain
 * Body: { orgId, hostname, type: 'subdomain' | 'custom' }
 *
 * - Removes domains/{hostname} from Firestore
 * - For type='custom': removes from Vercel project
 * - Clears the org's subdomain/customDomain field
 */
export async function DELETE(req: NextRequest) {
  try {
    const { orgId, hostname, type } = await req.json() as {
      orgId: string;
      hostname: string;
      type: 'subdomain' | 'custom';
    };

    if (!orgId || !hostname) {
      return NextResponse.json({ error: 'orgId and hostname are required' }, { status: 400 });
    }

    if (type === 'custom' && VERCEL_TOKEN && VERCEL_PROJECT_ID) {
      const vRes = await fetch(
        vercelUrl(`/v10/projects/${VERCEL_PROJECT_ID}/domains/${encodeURIComponent(hostname)}`),
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
        }
      );
      // 404 is fine — domain may already be removed
      if (!vRes.ok && vRes.status !== 404) {
        const body = await vRes.json();
        return NextResponse.json(
          { error: body.error?.message ?? 'Failed to remove domain from Vercel' },
          { status: vRes.status }
        );
      }
    }

    await adminDb.doc(`domains/${hostname}`).delete();

    const orgField = type === 'subdomain' ? 'subdomain' : 'customDomain';
    await adminDb.doc(`organizations/${orgId}`).update({ [orgField]: FieldValue.delete() });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[remove-domain] error:', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}

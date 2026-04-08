import { NextRequest, NextResponse } from 'next/server';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

function vercelUrl(path: string) {
  const base = `https://api.vercel.com${path}`;
  return VERCEL_TEAM_ID ? `${base}?teamId=${VERCEL_TEAM_ID}` : base;
}

/**
 * GET /api/admin/check-domain?domain=www.agency.com
 *
 * Returns Vercel domain status:
 * {
 *   verified: boolean,
 *   configuredBy: 'cname' | 'a' | null,
 *   verification: [{ type, domain, value, reason }]
 * }
 */
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain');
  if (!domain) {
    return NextResponse.json({ error: 'domain query param is required' }, { status: 400 });
  }

  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return NextResponse.json(
      { error: 'VERCEL_TOKEN and VERCEL_PROJECT_ID are not configured' },
      { status: 500 }
    );
  }

  const res = await fetch(
    vercelUrl(`/v9/projects/${VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}`),
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  );

  if (res.status === 404) {
    return NextResponse.json({ verified: false, notFound: true });
  }

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? 'Failed to check domain' },
      { status: res.status }
    );
  }

  return NextResponse.json({
    verified: data.verified ?? false,
    configuredBy: data.configuredBy ?? null,
    verification: data.verification ?? [],
  });
}

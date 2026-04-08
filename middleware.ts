import { NextRequest, NextResponse } from 'next/server';
import firebaseConfig from './firebase-applet-config.json';

const PLATFORM_HOST = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? 'localhost:3000';

// Module-level cache: hostname → { orgId | null, expiry }
const cache = new Map<string, { orgId: string | null; exp: number }>();

async function resolveHostToOrgId(hostname: string): Promise<string | null> {
  const now = Date.now();
  const hit = cache.get(hostname);
  if (hit && hit.exp > now) return hit.orgId;

  try {
    const { projectId, apiKey, firestoreDatabaseId } = firebaseConfig;
    const url =
      `https://firestore.googleapis.com/v1/projects/${projectId}` +
      `/databases/${firestoreDatabaseId}/documents/domains/${encodeURIComponent(hostname)}` +
      `?key=${apiKey}`;

    const res = await fetch(url);

    if (res.status === 404) {
      cache.set(hostname, { orgId: null, exp: now + 60_000 }); // 1 min negative cache
      return null;
    }
    if (!res.ok) return null;

    const data = await res.json();
    const orgId: string | null = data.fields?.orgId?.stringValue ?? null;
    cache.set(hostname, { orgId, exp: now + 300_000 }); // 5 min positive cache
    return orgId;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const pathname = req.nextUrl.pathname;

  const bareHost = host.split(':')[0];
  const platformBare = PLATFORM_HOST.split(':')[0];

  // Pass through platform domain and localhost
  if (
    bareHost === platformBare ||
    bareHost === `www.${platformBare}` ||
    bareHost.includes('localhost') ||
    bareHost === '127.0.0.1'
  ) {
    return NextResponse.next();
  }

  const orgId = await resolveHostToOrgId(bareHost);
  if (!orgId) return NextResponse.next();

  // Rewrite: agency.com/packages → /site/[orgId]/packages
  const url = req.nextUrl.clone();
  url.pathname = `/site/${orgId}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Exclude static assets and API routes from middleware
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/).*)'],
};

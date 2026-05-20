import { NextRequest, NextResponse } from 'next/server';
import firebaseConfig from './firebase-applet-config.json';

const PLATFORM_HOST = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? 'localhost:3000';

// Module-level cache: hostname -> { orgId | null, expiry }
// staleOrgId is kept so it can be used as a fallback when the live fetch fails.
const cache = new Map<string, { orgId: string | null; exp: number; staleOrgId?: string | null }>();

async function fetchOrgIdForHostname(hostname: string, signal: AbortSignal) {
  const { projectId, apiKey, firestoreDatabaseId } = firebaseConfig;
  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/${firestoreDatabaseId}/documents/domains/${encodeURIComponent(hostname)}` +
    `?key=${apiKey}`;

  const res = await fetch(url, { signal });
  if (res.status === 404) return { found: false, orgId: null as string | null };
  if (!res.ok) throw new Error(`Domain lookup failed: ${res.status}`);

  const data = await res.json();
  return { found: true, orgId: data.fields?.orgId?.stringValue ?? null };
}

async function resolveHostToOrgId(hostname: string): Promise<string | null> {
  const now = Date.now();
  const hit = cache.get(hostname);
  if (hit && hit.exp > now) return hit.orgId;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);

  try {
    let lookupHost = hostname;
    let result = await fetchOrgIdForHostname(lookupHost, controller.signal);
    if (!result.found && hostname.startsWith('www.')) {
      lookupHost = hostname.slice(4);
      result = await fetchOrgIdForHostname(lookupHost, controller.signal);
    }

    if (!result.found) {
      cache.set(hostname, { orgId: null, exp: now + 60_000, staleOrgId: null });
      return null;
    }
    const orgId = result.orgId;
    cache.set(hostname, { orgId, exp: now + 300_000, staleOrgId: orgId });
    if (lookupHost !== hostname) cache.set(lookupHost, { orgId, exp: now + 300_000, staleOrgId: orgId });
    return orgId;
  } catch {
    return hit?.staleOrgId ?? null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const pathname = req.nextUrl.pathname;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-public-pathname', pathname);

  const bareHost = host.split(':')[0].toLowerCase();
  const platformBare = PLATFORM_HOST.split(':')[0].toLowerCase();

  // Pass through platform domain and localhost, but preserve the public path for metadata.
  if (
    bareHost === platformBare ||
    bareHost === `www.${platformBare}` ||
    bareHost.includes('localhost') ||
    bareHost === '127.0.0.1'
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Keep discovery endpoints at the original host. The routes generate domain-aware
  // robots, sitemaps, and LLM summaries.
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml' || pathname === '/llms.txt') {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Already routed: prevent double rewriting.
  if (pathname.startsWith('/site/') || pathname.startsWith('/campaign/')) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const orgId = await resolveHostToOrgId(bareHost);
  if (!orgId) return NextResponse.next({ request: { headers: requestHeaders } });

  const url = req.nextUrl.clone();

  // agency.com/campaign -> /campaign/[orgId]
  if (pathname === '/campaign') {
    url.pathname = `/campaign/${orgId}`;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  // agency.com/ -> /site/[orgId]
  // agency.com/package/abc -> /site/[orgId]/package/abc
  url.pathname = `/site/${orgId}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|api/|icons/|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.webp$).*)'],
};

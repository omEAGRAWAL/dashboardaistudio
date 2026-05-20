import { adminDb } from '@/lib/firebase-admin';

export const PLATFORM_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://travelycrm.reviu.store';
export const PLATFORM_HOST = process.env.NEXT_PUBLIC_PLATFORM_HOST || new URL(PLATFORM_URL).host;

export interface AgencyDomainContext {
  host: string;
  orgId: string;
  type?: 'subdomain' | 'custom';
  canonicalHost: string;
}

export interface WebsiteSettingsSeo {
  agencyName?: string;
  agencyLogo?: string;
  heroImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  metaTitle?: string;
  metaDescription?: string;
  aboutTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsApp?: string;
  pageAboutUs?: string;
  pageTermsConditions?: string;
  pagePrivacyPolicy?: string;
  pageCancellationRefund?: string;
  updatedAt?: any;
}

export interface PublicPackageSeo {
  id: string;
  title?: string;
  description?: string;
  destination?: string;
  imageUrl?: string;
  images?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export function normalizeHost(host: string | null | undefined) {
  return (host || '').split(',')[0].trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
}

export function isPlatformHost(host: string) {
  const normalized = normalizeHost(host);
  const platform = normalizeHost(PLATFORM_HOST);
  return (
    !normalized ||
    normalized === platform ||
    normalized === `www.${platform}` ||
    normalized === 'localhost' ||
    normalized === '127.0.0.1'
  );
}

export function protocolFromHeader(value: string | null | undefined) {
  return (value || '').split(',')[0].trim() || 'https';
}

export function cleanPublicPath(pathname: string, orgId?: string) {
  let path = pathname || '/';
  if (orgId && path.startsWith(`/site/${orgId}`)) {
    path = path.slice(`/site/${orgId}`.length) || '/';
  }
  if (orgId && path.startsWith(`/campaign/${orgId}`)) {
    path = '/campaign';
  }
  return path.startsWith('/') ? path : `/${path}`;
}

export function absoluteUrl(base: string, pathname = '/') {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${cleanBase}${cleanPath === '/' ? '' : cleanPath}`;
}

export function timestampToDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  if (typeof value._seconds === 'number') return new Date(value._seconds * 1000);
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}

export function latestDate(...values: any[]) {
  const dates = values.map(timestampToDate).filter(Boolean) as Date[];
  if (!dates.length) return undefined;
  return new Date(Math.max(...dates.map(date => date.getTime())));
}

export async function resolveAgencyByHost(host: string): Promise<AgencyDomainContext | null> {
  const normalized = normalizeHost(host);
  if (isPlatformHost(normalized)) return null;

  let lookupHost = normalized;
  let domainSnap = await adminDb.doc(`domains/${lookupHost}`).get();
  if (!domainSnap.exists && normalized.startsWith('www.')) {
    lookupHost = normalized.slice(4);
    domainSnap = await adminDb.doc(`domains/${lookupHost}`).get();
  }
  if (!domainSnap.exists) return null;

  const domain = domainSnap.data() || {};
  const orgId = domain.orgId as string | undefined;
  if (!orgId) return null;

  const orgSnap = await adminDb.doc(`organizations/${orgId}`).get();
  const org = orgSnap.exists ? orgSnap.data() || {} : {};
  const canonicalHost = normalizeHost(org.customDomain || org.subdomain || domain.canonicalHost || lookupHost);

  return {
    host: normalized,
    orgId,
    type: domain.type,
    canonicalHost: canonicalHost || normalized,
  };
}

export async function getOrgCanonicalBase(orgId: string, requestHost?: string, protocol = 'https') {
  const normalizedHost = normalizeHost(requestHost);
  if (normalizedHost && !isPlatformHost(normalizedHost)) {
    const ctx = await resolveAgencyByHost(normalizedHost);
    if (ctx?.orgId === orgId) return `${protocol}://${ctx.canonicalHost}`;
  }

  const orgSnap = await adminDb.doc(`organizations/${orgId}`).get();
  const org = orgSnap.exists ? orgSnap.data() || {} : {};
  const host = normalizeHost(org.customDomain || org.subdomain);
  return host ? `https://${host}` : PLATFORM_URL;
}

export async function getWebsiteSettings(orgId: string): Promise<WebsiteSettingsSeo | null> {
  const snap = await adminDb.doc(`website_settings/${orgId}`).get();
  return snap.exists ? (snap.data() as WebsiteSettingsSeo) : null;
}

export async function getPublicPackages(orgId: string): Promise<PublicPackageSeo[]> {
  const snap = await adminDb.collection('packages').where('orgId', '==', orgId).get();
  return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, any>) }));
}

export async function getPublicPackage(packageId: string): Promise<PublicPackageSeo | null> {
  const snap = await adminDb.doc(`packages/${packageId}`).get();
  return snap.exists ? ({ id: snap.id, ...(snap.data() as Record<string, any>) }) : null;
}

export function truncateDescription(value: string | undefined, fallback: string, max = 155) {
  const source = (value || fallback).replace(/\s+/g, ' ').trim();
  if (source.length <= max) return source;
  return `${source.slice(0, max - 1).trim()}...`;
}

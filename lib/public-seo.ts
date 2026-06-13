import { adminDb } from '@/lib/firebase-admin';
import { slugify } from '@/lib/slug';

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
  agencyTagline?: string;
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
  blogEnabled?: boolean;
  blogTitle?: string;
  blogSubtitle?: string;
  blogPosts?: PublicBlogPostSeo[];
  updatedAt?: any;
}

export interface PublicPackageSeo {
  id: string;
  orgId?: string;
  slug?: string;
  title?: string;
  description?: string;
  destination?: string;
  duration?: string;
  category?: string;
  imageUrl?: string;
  images?: string[];
  priceDouble?: number;
  priceTriple?: number;
  priceQuad?: number;
  itinerary?: Array<{ day?: number; title?: string; description?: string }>;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface PublicBlogPostSeo {
  id?: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  authorName?: string;
  category?: string;
  status?: 'draft' | 'published';
  publishedAt?: any;
  updatedAt?: any;
  metaTitle?: string;
  metaDescription?: string;
  relatedPackageIds?: string[];
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

export async function getPublicPackage(packageIdOrSlug: string, orgId?: string): Promise<PublicPackageSeo | null> {
  const snap = await adminDb.doc(`packages/${packageIdOrSlug}`).get();
  if (snap.exists) {
    const pkg = { id: snap.id, ...(snap.data() as Record<string, any>) } as PublicPackageSeo;
    if (!orgId || pkg.orgId === orgId) return pkg;
  }

  if (!orgId) return null;

  const cleanSlug = slugify(packageIdOrSlug, packageIdOrSlug);
  const bySlug = await adminDb
    .collection('packages')
    .where('orgId', '==', orgId)
    .where('slug', '==', cleanSlug)
    .limit(1)
    .get();

  if (bySlug.empty) return null;
  const doc = bySlug.docs[0];
  return { id: doc.id, ...(doc.data() as Record<string, any>) } as PublicPackageSeo;
}

export function truncateDescription(value: string | undefined, fallback: string, max = 155) {
  const source = (value || fallback).replace(/\s+/g, ' ').trim();
  if (source.length <= max) return source;
  return `${source.slice(0, max - 1).trim()}...`;
}

export function stripHtml(value: string | undefined) {
  return (value || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSeoText(value: string | undefined) {
  return stripHtml(value).replace(/\s+/g, ' ').trim();
}

function truncateTitle(value: string, max = 60) {
  const source = cleanSeoText(value);
  if (source.length <= max) return source;
  return source.slice(0, max - 1).replace(/\s+\S*$/, '').trim();
}

function hasSearchIntent(value: string) {
  return /\b(travel|tour|trip|package|holiday|vacation|destination|agency)\b/i.test(value);
}

export function getSeoDestinations(packages: Pick<PublicPackageSeo, 'destination'>[], limit = 4) {
  const seen = new Set<string>();
  const destinations: string[] = [];

  for (const pkg of packages) {
    const destination = cleanSeoText(pkg.destination);
    if (!destination) continue;
    const key = destination.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    destinations.push(destination);
    if (destinations.length >= limit) break;
  }

  return destinations;
}

export function buildAgencySeoTitle(settings: WebsiteSettingsSeo | null | undefined, packages: Pick<PublicPackageSeo, 'destination'>[] = []) {
  const agencyName = cleanSeoText(settings?.agencyName) || 'Travel Agency';
  const customTitle = cleanSeoText(settings?.metaTitle);

  if (customTitle.length >= 24 && hasSearchIntent(customTitle)) {
    return truncateTitle(customTitle);
  }

  const destinations = getSeoDestinations(packages, 2);
  const titleWithDestinations = `${agencyName} Travel Packages & Tours${destinations.length ? ` for ${destinations.join(' & ')}` : ''}`;
  return truncateTitle(titleWithDestinations.length <= 60 ? titleWithDestinations : `${agencyName} Travel Packages & Tours`);
}

export function buildAgencySeoDescription(
  settings: WebsiteSettingsSeo | null | undefined,
  packages: Pick<PublicPackageSeo, 'destination'>[] = [],
) {
  const agencyName = cleanSeoText(settings?.agencyName) || 'Travel Agency';
  const customDescription = cleanSeoText(settings?.metaDescription || settings?.heroSubtitle);

  if (customDescription.length >= 120) {
    return truncateDescription(customDescription, customDescription, 220);
  }

  const destinations = getSeoDestinations(packages, 4);
  const packageLabel = packages.length > 0
    ? `${packages.length} curated travel package${packages.length === 1 ? '' : 's'}`
    : 'curated travel packages';
  const destinationText = destinations.length ? ` for ${destinations.join(', ')}` : '';
  const contactText = settings?.contactWhatsApp
    ? 'Get WhatsApp booking support'
    : 'Contact the team';

  return truncateDescription(
    `${agencyName} offers ${packageLabel}${destinationText} with itinerary planning, hotel options, pricing details, and custom trip support. ${contactText} to plan your next holiday.`,
    `Explore travel packages and destinations from ${agencyName}.`,
    220,
  );
}

export function sanitizePublicHtml(value: string | undefined) {
  return (value || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\s(on\w+)=(["']).*?\2/gi, '')
    .replace(/\s(href|src)=(["'])javascript:[\s\S]*?\2/gi, ' $1="#"');
}

export function getPackageSlug(pkg: Pick<PublicPackageSeo, 'id' | 'slug' | 'title' | 'destination'>) {
  return slugify(pkg.slug, pkg.id);
}

export function packagePath(pkg: Pick<PublicPackageSeo, 'id' | 'slug' | 'title' | 'destination'>) {
  return `/package/${getPackageSlug(pkg)}`;
}

export function getMinPackagePrice(pkg: Pick<PublicPackageSeo, 'priceDouble' | 'priceTriple' | 'priceQuad'>) {
  const prices = [pkg.priceDouble, pkg.priceTriple, pkg.priceQuad].filter((price): price is number => typeof price === 'number' && price > 0);
  return prices.length ? Math.min(...prices) : undefined;
}

export function getBlogSlug(post: PublicBlogPostSeo, index = 0) {
  return slugify(post.slug || post.title, `travel-guide-${index + 1}`);
}

export function blogPostPath(post: PublicBlogPostSeo, index = 0) {
  return `/blog/${getBlogSlug(post, index)}`;
}

export function getPublishedBlogPosts(settings: WebsiteSettingsSeo | null | undefined) {
  if (settings?.blogEnabled === false) return [];

  return (settings?.blogPosts || [])
    .map((post, index) => ({
      ...post,
      slug: getBlogSlug(post, index),
      id: post.id || getBlogSlug(post, index),
    }))
    .filter(post => post.title && post.status !== 'draft')
    .sort((a, b) => {
      const bDate = timestampToDate(b.publishedAt || b.updatedAt)?.getTime() || 0;
      const aDate = timestampToDate(a.publishedAt || a.updatedAt)?.getTime() || 0;
      return bDate - aDate;
    });
}

export function getPublishedBlogPost(settings: WebsiteSettingsSeo | null | undefined, slug: string) {
  const cleanSlug = slugify(slug, slug);
  return getPublishedBlogPosts(settings).find(post => post.slug === cleanSlug) || null;
}

export function estimateReadTime(value: string | undefined) {
  const words = stripHtml(value).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

import { Metadata } from 'next';
import { headers } from 'next/headers';
import {
  absoluteUrl,
  buildAgencySeoDescription,
  buildAgencySeoTitle,
  cleanPublicPath,
  getOrgCanonicalBase,
  getPublicPackages,
  getWebsiteSettings,
  getSeoDestinations,
  protocolFromHeader,
} from '@/lib/public-seo';

export async function generateMetadata(
  { params }: { params: Promise<{ orgId: string }> }
): Promise<Metadata> {
  const { orgId } = await params;
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const protocol = protocolFromHeader(h.get('x-forwarded-proto'));
  const publicPath = cleanPublicPath(h.get('x-public-pathname') || '/', orgId);

  const [settings, packages, canonicalBase] = await Promise.all([
    getWebsiteSettings(orgId),
    getPublicPackages(orgId),
    getOrgCanonicalBase(orgId, host, protocol),
  ]);

  const agencyName = settings?.agencyName || 'Travel Agency';
  const title = buildAgencySeoTitle(settings, packages);
  const description = buildAgencySeoDescription(settings, packages);
  const image = settings?.heroImage || settings?.agencyLogo;
  const canonical = absoluteUrl(canonicalBase, publicPath);
  const keywords = [agencyName, 'travel packages', 'tour packages', 'trip planning', ...getSeoDestinations(packages, 6)];

  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      siteName: agencyName,
      ...(image ? { images: [{ url: image, alt: agencyName }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

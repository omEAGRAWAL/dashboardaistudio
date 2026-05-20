import { Metadata } from 'next';
import { headers } from 'next/headers';
import {
  absoluteUrl,
  getOrgCanonicalBase,
  getPublicPackage,
  getWebsiteSettings,
  protocolFromHeader,
  truncateDescription,
} from '@/lib/public-seo';

export async function generateMetadata(
  { params }: { params: Promise<{ orgId: string; packageId: string }> }
): Promise<Metadata> {
  const { orgId, packageId } = await params;
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const protocol = protocolFromHeader(h.get('x-forwarded-proto'));

  const [settings, pkg, canonicalBase] = await Promise.all([
    getWebsiteSettings(orgId),
    getPublicPackage(packageId),
    getOrgCanonicalBase(orgId, host, protocol),
  ]);

  const agencyName = settings?.agencyName || 'Travel Agency';
  const packageTitle = pkg?.title || 'Travel Package';
  const title = `${packageTitle} | ${agencyName}`;
  const description = truncateDescription(
    pkg?.description,
    `${packageTitle}${pkg?.destination ? ` in ${pkg.destination}` : ''} by ${agencyName}. View details and book online.`
  );
  const image = pkg?.images?.[0] || pkg?.imageUrl || settings?.heroImage || settings?.agencyLogo;
  const canonical = absoluteUrl(canonicalBase, `/package/${packageId}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: agencyName,
      ...(image ? { images: [{ url: image, alt: packageTitle }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function PackageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

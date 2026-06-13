import { Metadata } from 'next';
import { headers } from 'next/headers';
import {
  absoluteUrl,
  getMinPackagePrice,
  getOrgCanonicalBase,
  getPublicPackage,
  getWebsiteSettings,
  packagePath,
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
    getPublicPackage(packageId, orgId),
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
  const canonical = absoluteUrl(canonicalBase, pkg ? packagePath(pkg) : `/package/${packageId}`);

  return {
    title: { absolute: title },
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

export default async function PackageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string; packageId: string }>;
}) {
  const { orgId, packageId } = await params;
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const protocol = protocolFromHeader(h.get('x-forwarded-proto'));

  const [settings, pkg, canonicalBase] = await Promise.all([
    getWebsiteSettings(orgId),
    getPublicPackage(packageId, orgId),
    getOrgCanonicalBase(orgId, host, protocol),
  ]);

  if (!pkg) return <>{children}</>;

  const agencyName = settings?.agencyName || 'Travel Agency';
  const canonical = absoluteUrl(canonicalBase, packagePath(pkg));
  const minPrice = getMinPackagePrice(pkg);
  const image = pkg.images?.[0] || pkg.imageUrl || settings?.heroImage || settings?.agencyLogo;
  const packageSchema = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: pkg.title,
    description: truncateDescription(pkg.description, `${pkg.title || 'Travel package'} by ${agencyName}.`, 260),
    image,
    url: canonical,
    provider: {
      '@type': 'TravelAgency',
      name: agencyName,
      url: canonicalBase,
      telephone: settings?.contactPhone,
      email: settings?.contactEmail,
    },
    touristType: pkg.category,
    itinerary: pkg.itinerary?.map(day => ({
      '@type': 'TouristAttraction',
      name: day.title || `Day ${day.day || ''}`.trim(),
      description: day.description,
    })),
    offers: minPrice
      ? {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: minPrice,
          availability: 'https://schema.org/InStock',
          url: canonical,
        }
      : undefined,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: agencyName, item: absoluteUrl(canonicalBase, '/') },
      { '@type': 'ListItem', position: 2, name: 'Packages', item: `${absoluteUrl(canonicalBase, '/')}#packages` },
      { '@type': 'ListItem', position: 3, name: pkg.title || 'Travel Package', item: canonical },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(packageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}

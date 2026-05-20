import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import {
  absoluteUrl,
  latestDate,
  PLATFORM_URL,
  resolveAgencyByHost,
  getPublicPackages,
  getWebsiteSettings,
  timestampToDate,
} from '@/lib/public-seo';

const CITIES = [
  'delhi', 'mumbai', 'bangalore', 'hyderabad', 'chennai',
  'kolkata', 'jaipur', 'ahmedabad', 'pune', 'kochi',
];

function platformSitemap(): MetadataRoute.Sitemap {
  const stableLastModified = new Date('2026-05-01');
  const staticPages: MetadataRoute.Sitemap = [
    { url: PLATFORM_URL, lastModified: stableLastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${PLATFORM_URL}/marketing`, lastModified: stableLastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${PLATFORM_URL}/features`, lastModified: stableLastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${PLATFORM_URL}/pricing`, lastModified: stableLastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${PLATFORM_URL}/blog`, lastModified: stableLastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${PLATFORM_URL}/travel-crm-vs-leadsquared`, lastModified: stableLastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${PLATFORM_URL}/travel-crm-vs-spreadsheets`, lastModified: stableLastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${PLATFORM_URL}/whatsapp-bot-travel-agency`, lastModified: stableLastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${PLATFORM_URL}/travel-lead-management`, lastModified: stableLastModified, changeFrequency: 'monthly', priority: 0.8 },
  ];

  const cityPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${PLATFORM_URL}/travel-crm-${city}`,
    lastModified: stableLastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...cityPages];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const protocol = (h.get('x-forwarded-proto') || 'https').split(',')[0];
  const ctx = await resolveAgencyByHost(host);

  if (!ctx) return platformSitemap();

  const base = `${protocol}://${ctx.canonicalHost}`;
  const [settings, packages] = await Promise.all([
    getWebsiteSettings(ctx.orgId),
    getPublicPackages(ctx.orgId),
  ]);

  const settingsUpdated = timestampToDate(settings?.updatedAt);
  const packageUpdated = latestDate(...packages.flatMap(pkg => [pkg.updatedAt, pkg.createdAt]));
  const homeLastModified = latestDate(settingsUpdated, packageUpdated) || settingsUpdated;

  const urls: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl(base, '/'),
      lastModified: homeLastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  if (settings?.aboutTitle || settings?.pageAboutUs) {
    urls.push({
      url: absoluteUrl(base, '/about-us'),
      lastModified: settingsUpdated,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  if (settings?.pageTermsConditions) {
    urls.push({ url: absoluteUrl(base, '/terms-conditions'), lastModified: settingsUpdated, changeFrequency: 'yearly', priority: 0.3 });
  }
  if (settings?.pagePrivacyPolicy) {
    urls.push({ url: absoluteUrl(base, '/privacy-policy'), lastModified: settingsUpdated, changeFrequency: 'yearly', priority: 0.3 });
  }
  if (settings?.pageCancellationRefund) {
    urls.push({ url: absoluteUrl(base, '/cancellation-refund'), lastModified: settingsUpdated, changeFrequency: 'yearly', priority: 0.3 });
  }
  if (settings?.contactPhone || settings?.contactEmail || settings?.contactWhatsApp) {
    urls.push({ url: `${absoluteUrl(base, '/')}#contact`, lastModified: settingsUpdated, changeFrequency: 'monthly', priority: 0.5 });
  }

  for (const pkg of packages) {
    urls.push({
      url: absoluteUrl(base, `/package/${pkg.id}`),
      lastModified: latestDate(pkg.updatedAt, pkg.createdAt, settingsUpdated),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  return urls;
}

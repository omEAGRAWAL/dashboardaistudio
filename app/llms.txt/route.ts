import { headers } from 'next/headers';
import {
  absoluteUrl,
  blogPostPath,
  getPublishedBlogPosts,
  PLATFORM_URL,
  packagePath,
  resolveAgencyByHost,
  getPublicPackages,
  getWebsiteSettings,
  truncateDescription,
} from '@/lib/public-seo';

export const revalidate = 3600;

function textResponse(body: string) {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

export async function GET() {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const protocol = (h.get('x-forwarded-proto') || 'https').split(',')[0];
  const ctx = await resolveAgencyByHost(host);

  if (!ctx) {
    return textResponse(`# Yatrik

Yatrik is travel CRM software for Indian travel agencies and tour operators.

## Key URLs
- Home: ${PLATFORM_URL}
- Features: ${PLATFORM_URL}/features
- Pricing: ${PLATFORM_URL}/pricing
- Travel lead management: ${PLATFORM_URL}/travel-lead-management
- WhatsApp bot for travel agencies: ${PLATFORM_URL}/whatsapp-bot-travel-agency

## Product Summary
Yatrik helps agencies manage leads, packages, bookings, campaigns, WhatsApp follow-ups, and public agency websites.
`);
  }

  const base = `${protocol}://${ctx.canonicalHost}`;
  const [settings, packages] = await Promise.all([
    getWebsiteSettings(ctx.orgId),
    getPublicPackages(ctx.orgId),
  ]);

  const agencyName = settings?.agencyName || 'Travel Agency';
  const summary = truncateDescription(settings?.metaDescription || settings?.heroSubtitle, `${agencyName} publishes travel packages and accepts enquiries online.`, 260);
  const packageLines = packages
    .slice(0, 50)
    .map(pkg => `- ${pkg.title || 'Travel Package'}: ${absoluteUrl(base, packagePath(pkg))}${pkg.destination ? ` (${pkg.destination})` : ''}`)
    .join('\n');
  const blogPosts = getPublishedBlogPosts(settings);
  const blogLines = blogPosts
    .slice(0, 20)
    .map((post, index) => `- ${post.title || 'Travel Guide'}: ${absoluteUrl(base, blogPostPath(post, index))}${post.excerpt ? ` - ${truncateDescription(post.excerpt, '', 120)}` : ''}`)
    .join('\n');

  return textResponse(`# ${agencyName}

${summary}

## Key URLs
- Home: ${absoluteUrl(base, '/')}
- Packages: ${absoluteUrl(base, '/')}#packages
- Travel guides: ${absoluteUrl(base, '/blog')}
- Contact: ${absoluteUrl(base, '/')}#contact
- Sitemap: ${absoluteUrl(base, '/sitemap.xml')}

## Contact
${settings?.contactPhone ? `- Phone: ${settings.contactPhone}\n` : ''}${settings?.contactEmail ? `- Email: ${settings.contactEmail}\n` : ''}${settings?.contactWhatsApp ? `- WhatsApp: ${settings.contactWhatsApp}\n` : ''}
## Packages
${packageLines || '- No public packages are currently listed.'}

## Travel Guides
${blogLines || '- No public travel guides are currently published.'}
`);
}

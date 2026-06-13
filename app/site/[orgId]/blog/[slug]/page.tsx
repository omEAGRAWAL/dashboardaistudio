import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { adminDb } from '@/lib/firebase-admin';
import {
  absoluteUrl,
  blogPostPath,
  estimateReadTime,
  getMinPackagePrice,
  getPublishedBlogPost,
  packagePath,
  sanitizePublicHtml,
  stripHtml,
  timestampToDate,
  truncateDescription,
} from '@/lib/public-seo';
import type { PublicPackageSeo } from '@/lib/public-seo';

export const revalidate = 60;

function getPublicUrlTools(orgId: string, host: string, protocol: string, publicPathname: string) {
  const isDirectSiteRoute = publicPathname.startsWith(`/site/${orgId}`);
  const sitePath = (path: string) => isDirectSiteRoute ? `/site/${orgId}${path === '/' ? '' : path}` : path;
  const absolutePublicUrl = (path = '/') => absoluteUrl(`${protocol}://${host}`, sitePath(path));
  return { sitePath, absolutePublicUrl };
}

export async function generateMetadata(
  { params }: { params: Promise<{ orgId: string; slug: string }> }
): Promise<Metadata> {
  const { orgId, slug } = await params;
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const protocol = (h.get('x-forwarded-proto') || 'https').split(',')[0];
  const publicPathname = h.get('x-public-pathname') || `/site/${orgId}/blog/${slug}`;
  const { absolutePublicUrl } = getPublicUrlTools(orgId, host, protocol, publicPathname);
  const snap = await adminDb.doc(`website_settings/${orgId}`).get();
  const settings = snap.exists ? (snap.data() as Record<string, any>) : null;
  const post = getPublishedBlogPost(settings, slug);
  const agencyName = settings?.agencyName || 'Travel Agency';

  if (!post) {
    return {
      title: { absolute: `Travel Guide | ${agencyName}` },
      robots: { index: false, follow: true },
    };
  }

  const title = post.metaTitle || `${post.title} | ${agencyName}`;
  const description = truncateDescription(
    post.metaDescription || post.excerpt || stripHtml(post.content),
    `Read this travel guide from ${agencyName}.`
  );

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absolutePublicUrl(blogPostPath(post)) },
    openGraph: {
      type: 'article',
      title,
      description,
      url: absolutePublicUrl(blogPostPath(post)),
      siteName: agencyName,
      publishedTime: timestampToDate(post.publishedAt)?.toISOString(),
      modifiedTime: timestampToDate(post.updatedAt)?.toISOString(),
      authors: [post.authorName || agencyName],
      ...(post.coverImage ? { images: [{ url: post.coverImage, alt: post.title || title }] } : {}),
    },
    twitter: {
      card: post.coverImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  };
}

export default async function AgencyBlogPostPage(
  { params }: { params: Promise<{ orgId: string; slug: string }> }
) {
  const { orgId, slug } = await params;
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const protocol = (h.get('x-forwarded-proto') || 'https').split(',')[0];
  const publicPathname = h.get('x-public-pathname') || `/site/${orgId}/blog/${slug}`;
  const { sitePath, absolutePublicUrl } = getPublicUrlTools(orgId, host, protocol, publicPathname);

  const [settingsSnap, packagesSnap] = await Promise.all([
    adminDb.doc(`website_settings/${orgId}`).get(),
    adminDb.collection('packages').where('orgId', '==', orgId).limit(4).get(),
  ]);

  const settings = settingsSnap.exists ? (settingsSnap.data() as Record<string, any>) : null;
  const post = getPublishedBlogPost(settings, slug);
  if (!post) notFound();

  const packages = packagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PublicPackageSeo));
  const tc = settings?.themeColor || '#4f46e5';
  const agencyName = settings?.agencyName || 'Travel Agency';
  const headingFont = settings?.fontStyle === 'serif' ? "Georgia,'Times New Roman',serif" : 'inherit';
  const published = timestampToDate(post.publishedAt || post.updatedAt);
  const description = truncateDescription(post.excerpt || stripHtml(post.content), `Read this travel guide from ${agencyName}.`, 220);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    image: post.coverImage,
    datePublished: timestampToDate(post.publishedAt || post.updatedAt)?.toISOString(),
    dateModified: timestampToDate(post.updatedAt || post.publishedAt)?.toISOString(),
    author: { '@type': 'Person', name: post.authorName || agencyName },
    publisher: {
      '@type': 'Organization',
      name: agencyName,
      logo: settings?.agencyLogo ? { '@type': 'ImageObject', url: settings.agencyLogo } : undefined,
    },
    mainEntityOfPage: absolutePublicUrl(blogPostPath(post)),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absolutePublicUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Travel Guides', item: absolutePublicUrl('/blog') },
      { '@type': 'ListItem', position: 3, name: post.title, item: absolutePublicUrl(blogPostPath(post)) },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <article>
        <header className="bg-gray-950 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link href={sitePath('/blog')} className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white transition-colors mb-10">
              <ArrowLeft className="w-4 h-4" />
              Travel guides
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-white/55 mb-5">
              {post.category && <span style={{ color: tc }}>{post.category}</span>}
              {published && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {published.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              <span>{estimateReadTime(post.content)}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6" style={{ fontFamily: headingFont }}>
              {post.title}
            </h1>
            {description && <p className="text-lg text-white/65 leading-relaxed">{description}</p>}
          </div>
          {post.coverImage && (
            <div className="relative h-[360px] md:h-[520px]">
              <Image
                src={post.coverImage}
                alt={post.title || `${agencyName} travel guide`}
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            </div>
          )}
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: sanitizePublicHtml(post.content) || `<p>${description}</p>` }}
              />
              <div className="mt-12 p-6 rounded-2xl border border-gray-100 bg-gray-50">
                <h2 className="text-xl font-bold mb-2">Ready to plan this trip?</h2>
                <p className="text-gray-500 mb-5">Explore packages or contact {agencyName} for a custom itinerary.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href={sitePath('/#packages')} className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-white font-bold" style={{ backgroundColor: tc }}>
                    View packages <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href={sitePath('/#contact')} className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-gray-200 font-bold text-gray-700 hover:bg-gray-50">
                    Contact agency
                  </Link>
                </div>
              </div>
            </div>

            <aside className="lg:col-span-4">
              <div className="sticky top-6 space-y-8">
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-6">
                  <h2 className="text-lg font-bold mb-4">Featured packages</h2>
                  <div className="space-y-4">
                    {packages.map(pkg => {
                      const minPrice = getMinPackagePrice(pkg);
                      return (
                        <Link key={pkg.id} href={sitePath(packagePath(pkg))} className="block group">
                          <p className="font-semibold text-gray-900 group-hover:opacity-80">{pkg.title}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {pkg.destination || 'Travel package'}
                            {minPrice ? ` from Rs. ${minPrice.toLocaleString('en-IN')}` : ''}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 p-6">
                  <h2 className="text-lg font-bold mb-2">{agencyName}</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {settings?.agencyTagline || settings?.footerText || 'Curated travel planning, package booking, and support for your next journey.'}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </main>
  );
}

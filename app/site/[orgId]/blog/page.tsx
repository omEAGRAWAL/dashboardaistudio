import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { BookOpen, CalendarDays, MapPin, ArrowRight } from 'lucide-react';
import { adminDb } from '@/lib/firebase-admin';
import {
  absoluteUrl,
  blogPostPath,
  estimateReadTime,
  getMinPackagePrice,
  getPublishedBlogPosts,
  packagePath,
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
  { params }: { params: Promise<{ orgId: string }> }
): Promise<Metadata> {
  const { orgId } = await params;
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const protocol = (h.get('x-forwarded-proto') || 'https').split(',')[0];
  const publicPathname = h.get('x-public-pathname') || `/site/${orgId}/blog`;
  const { absolutePublicUrl } = getPublicUrlTools(orgId, host, protocol, publicPathname);
  const snap = await adminDb.doc(`website_settings/${orgId}`).get();
  const settings = snap.exists ? (snap.data() as Record<string, any>) : null;
  const agencyName = settings?.agencyName || 'Travel Agency';
  const title = `${settings?.blogTitle || 'Travel Guides'} | ${agencyName}`;
  const description = truncateDescription(
    settings?.blogSubtitle,
    `Travel guides, destination tips, and trip planning advice from ${agencyName}.`
  );

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absolutePublicUrl('/blog') },
    openGraph: {
      type: 'website',
      title,
      description,
      url: absolutePublicUrl('/blog'),
      siteName: agencyName,
      ...(settings?.heroImage ? { images: [{ url: settings.heroImage, alt: title }] } : {}),
    },
    twitter: {
      card: settings?.heroImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(settings?.heroImage ? { images: [settings.heroImage] } : {}),
    },
  };
}

export default async function AgencyBlogPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const protocol = (h.get('x-forwarded-proto') || 'https').split(',')[0];
  const publicPathname = h.get('x-public-pathname') || `/site/${orgId}/blog`;
  const { sitePath, absolutePublicUrl } = getPublicUrlTools(orgId, host, protocol, publicPathname);

  const [settingsSnap, packagesSnap] = await Promise.all([
    adminDb.doc(`website_settings/${orgId}`).get(),
    adminDb.collection('packages').where('orgId', '==', orgId).limit(6).get(),
  ]);

  const settings = settingsSnap.exists ? (settingsSnap.data() as Record<string, any>) : null;
  const posts = getPublishedBlogPosts(settings);
  const packages = packagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PublicPackageSeo));
  const tc = settings?.themeColor || '#4f46e5';
  const agencyName = settings?.agencyName || 'Travel Agency';
  const headingFont = settings?.fontStyle === 'serif' ? "Georgia,'Times New Roman',serif" : 'inherit';

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${agencyName} travel guides`,
    url: absolutePublicUrl('/blog'),
    description: truncateDescription(settings?.blogSubtitle, `Travel guides from ${agencyName}.`, 200),
    blogPost: posts.slice(0, 20).map((post, index) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: absolutePublicUrl(blogPostPath(post, index)),
      datePublished: timestampToDate(post.publishedAt || post.updatedAt)?.toISOString(),
      image: post.coverImage,
      author: { '@type': 'Organization', name: post.authorName || agencyName },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absolutePublicUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Travel Guides', item: absolutePublicUrl('/blog') },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Link href={sitePath('/')} className="text-sm text-white/60 hover:text-white transition-colors">
            Back to {agencyName}
          </Link>
          <div className="max-w-3xl mt-10">
            <p className="text-xs font-bold tracking-[0.25em] uppercase mb-4" style={{ color: tc }}>Travel Guides</p>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-5" style={{ fontFamily: headingFont }}>
              {settings?.blogTitle || 'Latest Travel Guides'}
            </h1>
            <p className="text-lg text-white/65 leading-relaxed">
              {settings?.blogSubtitle || 'Destination advice, seasonal travel ideas, and trip planning notes from our travel experts.'}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {posts.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 rounded-2xl bg-gray-50">
            <BookOpen className="w-14 h-14 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Travel guides coming soon</h2>
            <p className="text-gray-500">The agency is preparing destination guides and planning tips.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-8">
              {posts.map((post, index) => {
                const published = timestampToDate(post.publishedAt || post.updatedAt);
                const excerpt = post.excerpt || truncateDescription(stripHtml(post.content), `Read ${post.title || 'this travel guide'} from ${agencyName}.`, 180);
                return (
                  <article key={post.id || post.slug} className="group border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all">
                    <Link href={sitePath(blogPostPath(post, index))} className="grid grid-cols-1 md:grid-cols-5">
                      <div className="relative min-h-64 md:col-span-2 bg-gray-100">
                        {post.coverImage ? (
                          <Image
                            src={post.coverImage}
                            alt={post.title || `${agencyName} travel guide`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="(max-width: 768px) 100vw, 40vw"
                          />
                        ) : (
                          <div className="h-full min-h-64 flex items-center justify-center" style={{ color: tc }}>
                            <BookOpen className="w-12 h-12 opacity-50" />
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-3 p-7">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-semibold mb-4">
                          {post.category && <span style={{ color: tc }}>{post.category}</span>}
                          {published && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {published.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                          <span>{estimateReadTime(post.content)}</span>
                        </div>
                        <h2 className="text-2xl font-black leading-tight mb-3 group-hover:opacity-80" style={{ fontFamily: headingFont }}>
                          {post.title}
                        </h2>
                        <p className="text-gray-500 leading-relaxed mb-6">{excerpt}</p>
                        <span className="inline-flex items-center gap-2 font-bold" style={{ color: tc }}>
                          Read guide <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>

            <aside className="lg:col-span-4">
              <div className="sticky top-6 space-y-8">
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-6">
                  <h2 className="text-lg font-bold mb-4">Popular packages</h2>
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
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

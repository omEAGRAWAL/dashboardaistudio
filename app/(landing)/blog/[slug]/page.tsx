import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPlatformBlogPost, platformBlogPosts } from '@/lib/platform-blog';

const BASE_URL = 'https://travelycrm.reviu.store';

export function generateStaticParams() {
  return platformBlogPosts.map(post => ({ slug: post.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPlatformBlogPost(slug);
  if (!post) return { title: 'Travel CRM Blog | Yatrik' };

  return {
    title: `${post.title} | Yatrik Blog`,
    description: post.excerpt,
    alternates: { canonical: `${BASE_URL}/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `${BASE_URL}/blog/${post.slug}`,
      siteName: 'Yatrik',
      publishedTime: post.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function PlatformBlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = getPlatformBlogPost(slug);
  if (!post) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'Yatrik' },
    publisher: { '@type': 'Organization', name: 'Yatrik' },
    mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <article className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/blog" className="text-sm text-blue-600 font-medium hover:underline">
          Back to blog
        </Link>
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-blue-600 mt-10 mb-4">
          {post.category}
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-5">
          {post.title}
        </h1>
        <p className="text-gray-500 text-sm mb-10">
          {new Date(post.date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}{' '}
          / {post.readTime}
        </p>
        <div className="blog-content">
          {post.content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-gray-100 bg-gray-50 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Want a travel CRM built for these workflows?</h2>
          <p className="text-gray-600 mb-5">
            Yatrik helps Indian travel agencies manage leads, packages, bookings, WhatsApp follow-ups, and public websites from one dashboard.
          </p>
          <Link href="/pricing" className="inline-flex items-center rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
            View pricing
          </Link>
        </div>
      </article>
    </main>
  );
}

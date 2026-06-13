import Link from 'next/link';
import { headers } from 'next/headers';

function getSiteBase(pathname: string | null) {
  const match = pathname?.match(/^\/site\/([^/]+)/);
  return match ? `/site/${match[1]}` : '';
}

export default async function NotFound() {
  const h = await headers();
  const siteBase = getSiteBase(h.get('x-public-pathname'));
  const homeHref = siteBase || '/';
  const packagesHref = siteBase ? `${siteBase}#packages` : '/#packages';
  const contactHref = siteBase ? `${siteBase}#contact` : '/#contact';

  return (
    <main className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4 py-16">
      <section className="w-full max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-indigo-600 mb-4">404</p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-5">Page Not Found</h1>
        <p className="text-gray-500 text-lg leading-relaxed mb-8">
          The page may have moved, expired, or been typed incorrectly. You can return home, browse travel packages, or contact the team for help.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={homeHref} className="w-full sm:w-auto rounded-full bg-gray-950 px-6 py-3 text-sm font-bold text-white hover:bg-gray-800 transition-colors">
            Go Home
          </Link>
          <Link href={packagesHref} className="w-full sm:w-auto rounded-full border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            View Packages
          </Link>
          <Link href={contactHref} className="w-full sm:w-auto rounded-full border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            Contact
          </Link>
        </div>
      </section>
    </main>
  );
}

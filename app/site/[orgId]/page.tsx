import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import {
  MapPin, Clock, ArrowRight, Phone, Mail, MessageCircle,
  Instagram, Star, Award, Shield, Users, Globe, BookOpen,
} from 'lucide-react';
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
import { NavbarClient } from './NavbarClient';
import { ContactForm } from './ContactForm';

export const revalidate = 60;

const FEAT_ICONS = [
  <Award key="a" className="w-7 h-7" />,
  <Shield key="b" className="w-7 h-7" />,
  <Users key="c" className="w-7 h-7" />,
  <Globe key="d" className="w-7 h-7" />,
];

export default async function PublicSitePage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const protocol = (h.get('x-forwarded-proto') || 'https').split(',')[0];
  const publicPathname = h.get('x-public-pathname') || `/site/${orgId}`;
  const isDirectSiteRoute = publicPathname.startsWith(`/site/${orgId}`);
  const sitePath = (path: string) => isDirectSiteRoute ? `/site/${orgId}${path === '/' ? '' : path}` : path;
  const absolutePublicUrl = (path = '/') => absoluteUrl(`${protocol}://${host}`, sitePath(path));

  const [settingsSnap, pkgsSnap] = await Promise.all([
    adminDb.doc(`website_settings/${orgId}`).get(),
    adminDb.collection('packages').where('orgId', '==', orgId).get(),
  ]);

  const settings = settingsSnap.exists ? (settingsSnap.data() as Record<string, any>) : null;
  const packages = pkgsSnap.docs.map(d => ({ id: d.id, ...d.data() } as PublicPackageSeo));
  const blogPosts = getPublishedBlogPosts(settings).slice(0, 3);

  const tc = settings?.themeColor || '#4f46e5';
  const agencyName = settings?.agencyName || 'Travel Agency';
  const heroImage = settings?.heroImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop';
  const overlayOpacity = (settings?.heroOverlayOpacity ?? 45) / 100;
  const galleryImages: string[] = settings?.galleryImages || [];
  const isSerif = settings?.fontStyle === 'serif';
  const headingFont = isSerif ? "Georgia,'Times New Roman',serif" : 'inherit';

  const featureItems: any[] = settings?.featureItems?.length > 0 ? settings!.featureItems : [
    { title: 'Expert Local Guides', description: 'Professional guides ensuring authentic experiences at every destination.' },
    { title: 'Best Price Guarantee', description: 'Competitive pricing with handpicked hotels and exclusive group deals.' },
    { title: '24/7 Travel Support', description: 'Round-the-clock assistance before, during, and after your trip.' },
    { title: 'Custom Packages', description: 'Tailored itineraries built around your unique travel preferences.' },
  ];

  const statItems: any[] = settings?.statItems?.length > 0 ? settings!.statItems : [
    { value: '10+', label: 'Years Experience' },
    { value: '500+', label: 'Trips Organized' },
    { value: '1000+', label: 'Happy Travelers' },
    { value: '50+', label: 'Destinations' },
  ];

  const testimonialItems: any[] = settings?.testimonialItems || [];
  const showTestimonials = settings?.testimonialsEnabled && testimonialItems.length > 0;
  const showFeatures = settings?.featuresEnabled !== false;
  const showStats = settings?.statsEnabled !== false;

  const navLinks = [
    { href: '#packages', label: 'Packages' },
    ...(galleryImages.length > 0 ? [{ href: '#gallery', label: 'Gallery' }] : []),
    ...(settings?.aboutTitle ? [{ href: '#about', label: 'About' }] : []),
    ...(blogPosts.length > 0 ? [{ href: sitePath('/blog'), label: 'Blog' }] : []),
    { href: '#contact', label: 'Contact' },
  ];

  const agencySchema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: agencyName,
    url: absolutePublicUrl('/'),
    description: truncateDescription(settings?.metaDescription || settings?.heroSubtitle, `${agencyName} curates travel packages and accepts trip enquiries online.`, 240),
    image: settings?.agencyLogo || heroImage,
    telephone: settings?.contactPhone,
    email: settings?.contactEmail,
    sameAs: [settings?.socialInstagram, settings?.socialFacebook].filter(Boolean),
    areaServed: packages.map(pkg => pkg.destination).filter(Boolean).slice(0, 20),
  };

  const packageListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${agencyName} travel packages`,
    itemListElement: packages.slice(0, 30).map((pkg, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absolutePublicUrl(packagePath(pkg)),
      name: pkg.title,
      item: {
        '@type': 'TouristTrip',
        name: pkg.title,
        description: truncateDescription(pkg.description, `${pkg.title || 'Travel package'} by ${agencyName}`, 220),
        image: pkg.images?.[0] || pkg.imageUrl,
        touristType: pkg.category,
        itinerary: pkg.itinerary?.map((day: any) => day.title || day.description).filter(Boolean),
        offers: getMinPackagePrice(pkg)
          ? {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: getMinPackagePrice(pkg),
              availability: 'https://schema.org/InStock',
              url: absolutePublicUrl(packagePath(pkg)),
            }
          : undefined,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-white antialiased" style={{ fontFamily: isSerif ? headingFont : 'inherit' }}>

      {/* Announcement Bar */}
      {settings?.announcementBarEnabled && settings?.announcementBarText && (
        <div className="text-white text-center text-sm py-2.5 px-4 font-semibold" style={{ backgroundColor: tc }}>
          {settings.announcementBarText}
        </div>
      )}

      {/* Navbar — client for scroll effect */}
      <NavbarClient
        settings={settings ? {
          agencyLogo: settings.agencyLogo ?? null,
          agencyTagline: settings.agencyTagline ?? null,
          announcementBarEnabled: settings.announcementBarEnabled ?? false,
          announcementBarText: settings.announcementBarText ?? null,
        } : null}
        tc={tc}
        agencyName={agencyName}
        navLinks={navLinks}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(agencySchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(packageListSchema) }}
      />

      {/* Hero */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt={`${agencyName} travel packages and tour planning`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto w-full" style={{ paddingTop: 'calc(72px + 1.5rem)' }}>
          {settings?.agencyTagline && (
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase text-white/65 mb-2 sm:mb-3">
              — {settings.agencyTagline} —
            </p>
          )}
          <h1
            className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-2 sm:mb-3 leading-tight tracking-tight drop-shadow-xl"
            style={{ fontFamily: headingFont }}
          >
            {settings?.heroTitle || 'Discover Your Next Adventure'}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-white/75 mb-4 sm:mb-5 font-normal max-w-xl mx-auto leading-relaxed">
            {settings?.heroSubtitle || 'Explore the world with our curated travel packages.'}
          </p>
          <div className="flex items-center justify-center gap-2.5">
            <a
              href="#packages"
              className="inline-flex items-center gap-2 px-5 py-2 sm:px-7 sm:py-2.5 rounded-full text-white font-semibold text-sm shadow-lg hover:scale-105 transition-all"
              style={{ backgroundColor: tc }}
            >
              {settings?.heroCta || 'Explore Packages'} <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-5 py-2 sm:px-7 sm:py-2.5 rounded-full text-white font-semibold text-sm border border-white/50 hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              Contact Us
            </a>
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <svg className="w-6 h-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </section>

      {/* Features / USPs */}
      {showFeatures && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureItems.slice(0, 4).map((feat: any, i: number) => (
                <div key={i} className="group p-7 rounded-3xl border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-white group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: tc }}>
                    {FEAT_ICONS[i] || <Globe className="w-7 h-7" />}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{feat.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Packages */}
      <section id="packages" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: tc }}>Our Offerings</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5 leading-tight" style={{ fontFamily: headingFont }}>
              {settings?.packagesTitle || 'Popular Packages'}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {settings?.packagesSubtitle || 'Choose from our handpicked selection of premium travel experiences.'}
            </p>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-16 text-gray-300">
              <Globe className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">No packages available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map(pkg => {
                const coverImage = pkg.images?.[0] || pkg.imageUrl || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop';
                const minPrice = getMinPackagePrice(pkg);
                return (
                  <Link href={sitePath(packagePath(pkg))} key={pkg.id} className="group block">
                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 h-full flex flex-col">
                      <div className="relative overflow-hidden h-60">
                        <Image
                          src={coverImage}
                          alt={`${pkg.title || 'Travel package'}${pkg.destination ? ` in ${pkg.destination}` : ''}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        {minPrice && (
                          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                            <span className="text-[10px] font-bold text-gray-400 mr-0.5">from</span>
                            <span className="font-black text-gray-900 text-sm">₹{minPrice}</span>
                          </div>
                        )}
                        {pkg.images && pkg.images.length > 1 && (
                          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] text-white font-semibold">
                            📷 {pkg.images.length} photos
                          </div>
                        )}
                        {pkg.duration && (
                          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] text-white font-semibold">
                            <Clock className="w-3 h-3" />{pkg.duration}
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-1.5 text-sm font-semibold mb-2" style={{ color: tc }}>
                          <MapPin className="w-3.5 h-3.5" />{pkg.destination}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight" style={{ fontFamily: headingFont }}>
                          {pkg.title}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1 mb-5">{pkg.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex gap-4">
                            {[{ label: 'Dbl', price: pkg.priceDouble }, { label: 'Tri', price: pkg.priceTriple }, { label: 'Quad', price: pkg.priceQuad }].map((t: any) => (
                              <div key={t.label} className="text-center">
                                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">{t.label}</p>
                                <p className="text-sm font-black text-gray-900">₹{t.price || '—'}</p>
                              </div>
                            ))}
                          </div>
                          <span className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full text-white transition-all group-hover:scale-105 shadow-md" style={{ backgroundColor: tc }}>
                            View <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Blog */}
      {blogPosts.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <p className="text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: tc }}>Travel Guides</p>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 leading-tight" style={{ fontFamily: headingFont }}>
                  {settings?.blogTitle || 'Latest Travel Guides'}
                </h2>
                <p className="text-lg text-gray-500 max-w-2xl">
                  {settings?.blogSubtitle || 'Destination advice, seasonal tips, and planning notes from our travel experts.'}
                </p>
              </div>
              <Link
                href={sitePath('/blog')}
                className="inline-flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-full text-white shadow-md hover:shadow-lg transition-all"
                style={{ backgroundColor: tc }}
              >
                View all guides <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogPosts.map((post, index) => {
                const published = timestampToDate(post.publishedAt || post.updatedAt);
                const excerpt = post.excerpt || truncateDescription(stripHtml(post.content), `Read ${post.title || 'this travel guide'} from ${agencyName}.`, 140);
                return (
                  <article key={post.id || post.slug} className="group">
                    <Link href={sitePath(blogPostPath(post, index))} className="block">
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                        <div className="relative h-52 bg-gray-100">
                          {post.coverImage ? (
                            <Image
                              src={post.coverImage}
                              alt={post.title || `${agencyName} travel guide`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ color: tc }}>
                              <BookOpen className="w-12 h-12 opacity-50" />
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold mb-3">
                            {post.category && <span style={{ color: tc }}>{post.category}</span>}
                            {post.category && <span>/</span>}
                            <span>{published ? published.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : estimateReadTime(post.content)}</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 leading-tight mb-3 group-hover:opacity-80" style={{ fontFamily: headingFont }}>
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{excerpt}</p>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section id="gallery" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: tc }}>Photo Gallery</p>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5" style={{ fontFamily: headingFont }}>
                {settings?.galleryTitle || 'Our Destinations'}
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">Stunning places we&apos;ve explored and curated for you.</p>
            </div>
            <div className="columns-2 md:columns-3 gap-4 space-y-4">
              {galleryImages.map((img: string, i: number) => (
                <div key={i} className="break-inside-avoid rounded-2xl overflow-hidden group relative">
                  <Image
                    src={img}
                    alt={`${agencyName} destination gallery ${i + 1}`}
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Bar */}
      {showStats && (
        <section className="py-20" style={{ backgroundColor: tc }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
              {statItems.map((stat: any, i: number) => (
                <div key={i}>
                  <p className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</p>
                  <p className="text-white/70 font-semibold text-sm uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About */}
      {settings?.aboutTitle && (
        <section id="about" className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {settings.aboutImage && (
                <div className="relative">
                  <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] relative">
                    <Image
                      src={settings.aboutImage}
                      alt={`About ${agencyName}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-48 h-48 rounded-3xl -z-10 opacity-20" style={{ backgroundColor: tc }} />
                </div>
              )}
              <div className={!settings.aboutImage ? 'lg:col-span-2 max-w-3xl mx-auto text-center' : ''}>
                <p className="text-xs font-bold tracking-[0.25em] uppercase mb-4" style={{ color: tc }}>About Us</p>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: headingFont }}>
                  {settings.aboutTitle}
                </h2>
                <p className="text-gray-500 leading-relaxed text-lg whitespace-pre-wrap">{settings.aboutDescription}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {showTestimonials && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: tc }}>Testimonials</p>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5" style={{ fontFamily: headingFont }}>
                {settings.testimonialsTitle || 'What Our Travelers Say'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonialItems.map((t: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  <div className="flex mb-4">
                    {Array.from({ length: t.rating || 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-base leading-relaxed italic mb-6 flex-1">&quot;{t.quote}&quot;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    {t.avatar
                      ? <Image src={t.avatar} alt={t.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                      : <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: tc }}>{t.name?.charAt(0)}</div>
                    }
                    <div>
                      <p className="font-bold text-gray-900">{t.name}</p>
                      <p className="text-sm text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: tc }}>Get In Touch</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5" style={{ fontFamily: headingFont }}>Let&apos;s Plan Your Trip</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Have questions? We&apos;d love to hear from you.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <ContactForm orgId={orgId} tc={tc} />
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {settings?.contactPhone && (
                <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: tc }}><Phone className="w-5 h-5" /></div>
                  <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Phone</p><p className="font-semibold text-gray-900">{settings.contactPhone}</p></div>
                </a>
              )}
              {settings?.contactEmail && (
                <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: tc }}><Mail className="w-5 h-5" /></div>
                  <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email</p><p className="font-semibold text-gray-900">{settings.contactEmail}</p></div>
                </a>
              )}
              {settings?.contactWhatsApp && (
                <a href={`https://wa.me/${settings.contactWhatsApp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 bg-green-50 rounded-2xl border border-green-100 hover:shadow-md transition-shadow group">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform"><MessageCircle className="w-5 h-5" /></div>
                  <div><p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-0.5">WhatsApp</p><p className="font-semibold text-gray-900">{settings.contactWhatsApp}</p></div>
                </a>
              )}
              {(settings?.socialInstagram || settings?.socialFacebook) && (
                <div className="p-5 bg-white rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Follow Us</p>
                  <div className="flex gap-3">
                    {settings.socialInstagram && (
                      <a href={settings.socialInstagram} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {settings.socialFacebook && (
                      <a href={settings.socialFacebook} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {settings?.agencyLogo
                  ? <Image src={settings.agencyLogo} alt={agencyName} width={200} height={36} className="h-9 w-auto rounded-lg" />
                  : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: tc }}>{agencyName.charAt(0)}</div>
                }
                <span className="font-bold text-lg">{agencyName}</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                {settings?.footerText || 'Making your dream vacations a reality with expertly curated travel packages.'}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-5">Quick Links</h4>
              <div className="space-y-3">
                {navLinks.map(l => <a key={l.href} href={l.href} className="block text-sm text-gray-500 hover:text-white transition-colors">{l.label}</a>)}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-5">Contact</h4>
              <div className="space-y-3 text-sm text-gray-500">
                {settings?.contactPhone && <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-2 hover:text-white transition-colors"><Phone className="w-4 h-4 flex-shrink-0" />{settings.contactPhone}</a>}
                {settings?.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2 hover:text-white transition-colors"><Mail className="w-4 h-4 flex-shrink-0" />{settings.contactEmail}</a>}
                {settings?.contactWhatsApp && <a href={`https://wa.me/${settings.contactWhatsApp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white transition-colors"><MessageCircle className="w-4 h-4 flex-shrink-0" />{settings.contactWhatsApp}</a>}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-5">Legal</h4>
              <div className="space-y-3">
                <Link href={sitePath('/about-us')} className="block text-sm text-gray-500 hover:text-white transition-colors">About Us</Link>
                <Link href={sitePath('/privacy-policy')} className="block text-sm text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href={sitePath('/terms-conditions')} className="block text-sm text-gray-500 hover:text-white transition-colors">Terms &amp; Conditions</Link>
                <Link href={sitePath('/cancellation-refund')} className="block text-sm text-gray-500 hover:text-white transition-colors">Cancellation &amp; Refund</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} {agencyName}. All rights reserved.</p>
            <p className="text-xs text-gray-700">Powered by Yatrik</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      {settings?.contactWhatsApp && (
        <a href={`https://wa.me/${settings.contactWhatsApp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all">
          <MessageCircle className="w-7 h-7" />
        </a>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  MapPin, Clock, ArrowRight, Phone, Mail, MessageCircle,
  Instagram, Star, Send, Award, Shield, Users, Globe,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';

const FEAT_ICONS = [
  <Award key="a" className="w-7 h-7" />,
  <Shield key="b" className="w-7 h-7" />,
  <Users key="c" className="w-7 h-7" />,
  <Globe key="d" className="w-7 h-7" />,
];

export default function PublicSitePage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [settings, setSettings] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const [formData, setFormData] = useState({ name: '', phone: '', email: '', destination: '', message: '' });
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    try {
      await addDoc(collection(db, 'leads'), {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        latestRemark: [formData.destination && `Destination: ${formData.destination}`, formData.message].filter(Boolean).join(' | ') || null,
        source: 'Website',
        status: 'New Enquiry',
        category: 'None',
        pax: 1,
        orgId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setFormState('success');
      setFormData({ name: '', phone: '', email: '', destination: '', message: '' });
    } catch {
      setFormState('error');
    }
  };

  useEffect(() => {
    if (!orgId) return;
    const fetchData = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'website_settings', orgId));
        if (settingsDoc.exists()) setSettings(settingsDoc.data());
        const pkgsSnapshot = await getDocs(query(collection(db, 'packages'), where('orgId', '==', orgId)));
        setPackages(pkgsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [orgId]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-medium">Loading...</p>
      </div>
    </div>
  );

  const tc = settings?.themeColor || '#4f46e5';
  const agencyName = settings?.agencyName || 'Travel Agency';
  const heroImage = settings?.heroImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop';
  const overlayOpacity = (settings?.heroOverlayOpacity ?? 45) / 100;
  const galleryImages: string[] = settings?.galleryImages || [];
  const isSerif = settings?.fontStyle === 'serif';
  const headingFont = isSerif ? "Georgia,'Times New Roman',serif" : 'inherit';

  const featureItems: any[] = settings?.featureItems?.length > 0 ? settings.featureItems : [
    { title: 'Expert Local Guides', description: 'Professional guides ensuring authentic experiences at every destination.' },
    { title: 'Best Price Guarantee', description: 'Competitive pricing with handpicked hotels and exclusive group deals.' },
    { title: '24/7 Travel Support', description: 'Round-the-clock assistance before, during, and after your trip.' },
    { title: 'Custom Packages', description: 'Tailored itineraries built around your unique travel preferences.' },
  ];

  const statItems: any[] = settings?.statItems?.length > 0 ? settings.statItems : [
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
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-white antialiased" style={{ fontFamily: isSerif ? headingFont : 'inherit' }}>

      {/* Announcement Bar */}
      {settings?.announcementBarEnabled && settings?.announcementBarText && (
        <div className="text-white text-center text-sm py-2.5 px-4 font-semibold" style={{ backgroundColor: tc }}>
          {settings.announcementBarText}
        </div>
      )}

      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100' : 'bg-transparent'}`}
        style={{ top: settings?.announcementBarEnabled && settings?.announcementBarText ? '40px' : '0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-[72px] items-center">
            <div className="flex items-center gap-3">
              {settings?.agencyLogo
                ? <img src={settings.agencyLogo} alt={agencyName} className="h-10 w-auto rounded-lg object-cover" />
                : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: tc }}>{agencyName.charAt(0)}</div>
              }
              <div>
                <span className={`font-black text-xl tracking-tight ${scrolled ? 'text-gray-900' : 'text-white'}`}>{agencyName}</span>
                {settings?.agencyTagline && (
                  <p className={`text-[11px] leading-none mt-0.5 ${scrolled ? 'text-gray-400' : 'text-white/60'}`}>{settings.agencyTagline}</p>
                )}
              </div>
            </div>
            <div className="hidden md:flex gap-8 items-center">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className={`text-sm font-semibold transition-colors hover:opacity-70 ${scrolled ? 'text-gray-700' : 'text-white/90'}`}>
                  {link.label}
                </a>
              ))}
              <a href="#contact" className="text-sm font-bold px-6 py-2.5 rounded-full text-white shadow-lg hover:opacity-90 hover:shadow-xl transition-all" style={{ backgroundColor: tc }}>
                Book Now
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
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
          <ChevronDown className="w-6 h-6 text-white/50" />
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
                const prices = [pkg.priceDouble, pkg.priceTriple, pkg.priceQuad].filter(p => p > 0);
                const minPrice = prices.length ? Math.min(...prices) : null;
                return (
                  <Link href={`/package/${pkg.id}`} key={pkg.id} className="group block">
                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 h-full flex flex-col">
                      <div className="relative overflow-hidden h-60">
                        <img src={coverImage} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
                            {[{ label: 'Dbl', price: pkg.priceDouble }, { label: 'Tri', price: pkg.priceTriple }, { label: 'Quad', price: pkg.priceQuad }].map(t => (
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

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section id="gallery" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: tc }}>Photo Gallery</p>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5" style={{ fontFamily: headingFont }}>
                {settings?.galleryTitle || 'Our Destinations'}
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">Stunning places we've explored and curated for you.</p>
            </div>
            <div className="columns-2 md:columns-3 gap-4 space-y-4">
              {galleryImages.map((img: string, i: number) => (
                <div key={i} className="break-inside-avoid rounded-2xl overflow-hidden group relative">
                  <img src={img} alt={`Destination ${i + 1}`} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
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
                  <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/5]">
                    <img src={settings.aboutImage} alt="About" className="w-full h-full object-cover" />
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
                  <p className="text-gray-600 text-base leading-relaxed italic mb-6 flex-1">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    {t.avatar
                      ? <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
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
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5" style={{ fontFamily: headingFont }}>Let's Plan Your Trip</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Have questions? We'd love to hear from you.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                {formState === 'success' ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${tc}20` }}>
                      <Send className="w-7 h-7" style={{ color: tc }} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Enquiry Received!</h3>
                    <p className="text-gray-500 text-sm mb-6">We'll get back to you shortly.</p>
                    <button onClick={() => setFormState('idle')} className="text-sm font-semibold underline" style={{ color: tc }}>Send another</button>
                  </div>
                ) : (
                  <form className="space-y-5" onSubmit={handleContact}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Full Name *</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50 text-sm" placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Phone *</label>
                        <input type="tel" required value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50 text-sm" placeholder="+91 98765 43210" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email</label>
                      <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50 text-sm" placeholder="you@email.com" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Destination Interest</label>
                      <input type="text" value={formData.destination} onChange={e => setFormData(p => ({ ...p, destination: e.target.value }))} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50 text-sm" placeholder="e.g. Bali, Europe, etc." />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Message</label>
                      <textarea rows={4} value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50 text-sm resize-none" placeholder="Tell us about your travel plans..." />
                    </div>
                    {formState === 'error' && (
                      <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
                    )}
                    <button type="submit" disabled={formState === 'submitting'} className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-base shadow-md hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100" style={{ backgroundColor: tc }}>
                      <Send className="w-5 h-5" /> {formState === 'submitting' ? 'Sending...' : 'Send Enquiry'}
                    </button>
                  </form>
                )}
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
                  ? <img src={settings.agencyLogo} alt={agencyName} className="h-9 w-auto rounded-lg" />
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
                <Link href={`/site/${orgId}/about-us`} className="block text-sm text-gray-500 hover:text-white transition-colors">About Us</Link>
                <Link href={`/site/${orgId}/privacy-policy`} className="block text-sm text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href={`/site/${orgId}/terms-conditions`} className="block text-sm text-gray-500 hover:text-white transition-colors">Terms &amp; Conditions</Link>
                <Link href={`/site/${orgId}/cancellation-refund`} className="block text-sm text-gray-500 hover:text-white transition-colors">Cancellation &amp; Refund</Link>
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

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  MapPin, Clock, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight,
  Users, Flag, Zap, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Star, Calendar, Phone, MessageCircle, AlertCircle, X
} from 'lucide-react';
import Link from 'next/link';

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: 'bg-green-100 text-green-700 border-green-200',
  Moderate: 'bg-amber-100 text-amber-700 border-amber-200',
  Challenging: 'bg-orange-100 text-orange-700 border-orange-200',
  Expert: 'bg-red-100 text-red-700 border-red-200',
};

type Tab = 'overview' | 'highlights' | 'itinerary' | 'inclusions' | 'notes';

export default function PackageDetailsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const packageId = params.packageId as string;

  const [settings, setSettings] = useState<any>(null);
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));

  const [form, setForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    travelDate: '', sharingType: 'double', numberOfPersons: 2,
  });

  useEffect(() => {
    if (!orgId || !packageId) return;
    const fetch = async () => {
      try {
        const [sSnap, pSnap] = await Promise.all([
          getDoc(doc(db, 'website_settings', orgId)),
          getDoc(doc(db, 'packages', packageId)),
        ]);
        if (sSnap.exists()) setSettings(sSnap.data());
        if (pSnap.exists()) setPkg({ id: pSnap.id, ...pSnap.data() });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [orgId, packageId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
  if (!pkg) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Package not found.</div>
  );

  const tc = settings?.themeColor || '#4f46e5';
  const agencyName = settings?.agencyName || 'Travel Agency';
  const isSerif = settings?.fontStyle === 'serif';
  const headingFont = isSerif ? "Georgia,'Times New Roman',serif" : 'inherit';

  const allImages: string[] = pkg.images?.length ? pkg.images : pkg.imageUrl ? [pkg.imageUrl] : ['https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop'];
  const highlights: string[] = pkg.highlights || [];
  const inclusions: string[] = pkg.inclusions || [];
  const exclusions: string[] = pkg.exclusions || [];
  const itinerary: any[] = pkg.itinerary || [];

  const tabs = ([
    { id: 'overview' as Tab, label: 'Overview', show: true },
    { id: 'highlights' as Tab, label: 'Highlights', show: highlights.length > 0 },
    { id: 'itinerary' as Tab, label: `Itinerary (${itinerary.length} days)`, show: itinerary.length > 0 },
    { id: 'inclusions' as Tab, label: 'Inclusions', show: inclusions.length > 0 || exclusions.length > 0 },
    { id: 'notes' as Tab, label: 'Notes & Terms', show: !!pkg.note },
  ] as const).filter(t => t.show);

  const prices: Record<string, number> = { double: pkg.priceDouble || 0, triple: pkg.priceTriple || 0, quad: pkg.priceQuad || 0 };
  const calcTotal = () => prices[form.sharingType] * Number(form.numberOfPersons);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        orgId, packageId: pkg.id, packageTitle: pkg.title,
        customerName: form.customerName, customerEmail: form.customerEmail,
        customerPhone: form.customerPhone, travelDate: form.travelDate,
        sharingType: form.sharingType, numberOfPersons: Number(form.numberOfPersons),
        totalPrice: calcTotal(), status: 'Pending', source: 'Website',
        createdAt: serverTimestamp(),
      });
      setBookingSuccess(true);
    } catch (e) { alert('Failed to submit. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const toggleDay = (i: number) => setExpandedDays(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
  const prevImg = () => setCurrentImg(i => (i === 0 ? allImages.length - 1 : i - 1));
  const nextImg = () => setCurrentImg(i => (i === allImages.length - 1 ? 0 : i + 1));

  const inp = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:outline-none bg-gray-50 text-sm transition-all";

  return (
    <div className="min-h-screen bg-white antialiased font-sans" style={{ fontFamily: isSerif ? headingFont : 'inherit' }}>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
            <X className="w-5 h-5" />
          </button>
          <button onClick={e => { e.stopPropagation(); prevImg(); }} className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <img src={allImages[currentImg]} alt="" className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          <button onClick={e => { e.stopPropagation(); nextImg(); }} className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allImages.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setCurrentImg(i); }}
                className={`w-2 h-2 rounded-full transition-all ${i === currentImg ? 'bg-white w-4' : 'bg-white/40'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href={`/site/${orgId}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {agencyName}
          </Link>
          <div className="flex items-center gap-2">
            {settings?.contactWhatsApp && (
              <a href={`https://wa.me/${settings.contactWhatsApp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 transition-colors">
                <MessageCircle className="w-4 h-4" /> Enquire
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Gallery */}
      <div className="relative bg-black">
        {/* Main image */}
        <div className="relative h-[55vh] min-h-[380px] max-h-[600px] overflow-hidden cursor-pointer group" onClick={() => setLightbox(true)}>
          <img src={allImages[currentImg]} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

          {/* Nav arrows */}
          {allImages.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prevImg(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
              <button onClick={e => { e.stopPropagation(); nextImg(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
            </>
          )}

          {/* Counter + expand hint */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            {allImages.length > 1 && (
              <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {currentImg + 1} / {allImages.length}
              </span>
            )}
            <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full hidden md:block">
              Click to expand
            </span>
          </div>
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="bg-black px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-7xl mx-auto">
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setCurrentImg(i)}
                  className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === currentImg ? 'border-white scale-105' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left: Package Details */}
          <div className="lg:col-span-2">
            {/* Title block */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: tc }}>
                  <MapPin className="w-4 h-4" />{pkg.destination}
                </span>
                {pkg.category && (
                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">{pkg.category}</span>
                )}
                {pkg.difficulty && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${DIFFICULTY_COLOR[pkg.difficulty] || 'bg-gray-100 text-gray-700'}`}>{pkg.difficulty}</span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight" style={{ fontFamily: headingFont }}>
                {pkg.title}
              </h1>

              {/* Meta badges */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">{pkg.duration}</span>
                </div>
                {pkg.departureCity && (
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                    <Flag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">From {pkg.departureCity}</span>
                  </div>
                )}
                {(pkg.minGroupSize || pkg.maxGroupSize) && (
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">
                      {pkg.minGroupSize && pkg.maxGroupSize ? `${pkg.minGroupSize}–${pkg.maxGroupSize} pax` : pkg.maxGroupSize ? `Up to ${pkg.maxGroupSize} pax` : `Min ${pkg.minGroupSize} pax`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-current text-current' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                    style={activeTab === tab.id ? { color: tc, borderColor: tc } : {}}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
              {/* Overview */}
              {activeTab === 'overview' && (
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 leading-relaxed text-base whitespace-pre-wrap">{pkg.description}</p>
                </div>
              )}

              {/* Highlights */}
              {activeTab === 'highlights' && highlights.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-5">Experiences and attractions that make this package special.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5" style={{ backgroundColor: tc }}>
                          {i + 1}
                        </div>
                        <p className="text-gray-800 font-medium text-sm leading-relaxed">{h}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itinerary */}
              {activeTab === 'itinerary' && itinerary.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-5">A detailed day-by-day plan of your journey.</p>
                  {itinerary.map((day, i) => (
                    <div key={i} className={`rounded-2xl border overflow-hidden transition-all ${expandedDays.has(i) ? 'border-gray-200 shadow-sm' : 'border-gray-100'}`}>
                      <button type="button" onClick={() => toggleDay(i)}
                        className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ backgroundColor: tc }}>
                          {day.day}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-base">{day.title || `Day ${day.day}`}</p>
                          {!expandedDays.has(i) && day.description && (
                            <p className="text-gray-400 text-sm truncate mt-0.5">{day.description}</p>
                          )}
                        </div>
                        {expandedDays.has(i) ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                      </button>
                      {expandedDays.has(i) && day.description && (
                        <div className="px-5 pb-5 pl-[72px]">
                          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">{day.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Inclusions */}
              {activeTab === 'inclusions' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {inclusions.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        What's Included
                      </h3>
                      <ul className="space-y-2.5">
                        {inclusions.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {exclusions.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                        <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                          <XCircle className="w-4 h-4 text-red-500" />
                        </div>
                        Not Included
                      </h3>
                      <ul className="space-y-2.5">
                        {exclusions.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-500 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {activeTab === 'notes' && pkg.note && (
                <div>
                  <div className="flex items-center gap-2 mb-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-amber-800 text-sm font-medium">Please read all terms before booking.</p>
                  </div>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">{pkg.note}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden sticky top-24">
              {bookingSuccess ? (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">Booking Received!</h3>
                  <p className="text-gray-500 mb-7 leading-relaxed">Thank you! Our team will contact you shortly to confirm your booking.</p>
                  <Link href={`/site/${orgId}`}
                    className="block w-full py-3.5 rounded-2xl text-white font-bold text-center shadow-md hover:shadow-xl hover:scale-[1.02] transition-all"
                    style={{ backgroundColor: tc }}>
                    Back to Home
                  </Link>
                </div>
              ) : (
                <>
                  {/* Price header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="grid grid-cols-3 gap-2">
                      {[{ label: 'Double', price: pkg.priceDouble }, { label: 'Triple', price: pkg.priceTriple }, { label: 'Quad', price: pkg.priceQuad }].map(t => (
                        <div key={t.label} className={`text-center p-3 rounded-xl border-2 cursor-pointer transition-all ${form.sharingType === t.label.toLowerCase() ? 'border-current bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                          style={form.sharingType === t.label.toLowerCase() ? { borderColor: tc, backgroundColor: `${tc}10` } : {}}
                          onClick={() => setForm(f => ({ ...f, sharingType: t.label.toLowerCase() }))}>
                          <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-1">{t.label}</p>
                          <p className="font-black text-gray-900 text-sm">₹{t.price || '—'}</p>
                          <p className="text-[8px] text-gray-400 mt-0.5">per person</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleBooking} className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Full Name *</label>
                      <input required type="text" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                        className={inp} placeholder="Your name" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Phone *</label>
                      <input required type="tel" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                        className={inp} placeholder="+91 98765 43210" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Email</label>
                      <input type="email" value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                        className={inp} placeholder="you@email.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Travel Date</label>
                        <input type="date" value={form.travelDate} onChange={e => setForm(f => ({ ...f, travelDate: e.target.value }))}
                          className={inp} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Persons *</label>
                        <input required type="number" min="1" value={form.numberOfPersons} onChange={e => setForm(f => ({ ...f, numberOfPersons: parseInt(e.target.value) || 1 }))}
                          className={inp + ' text-center font-bold'} />
                      </div>
                    </div>

                    {/* Total */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-500">₹{prices[form.sharingType]} × {form.numberOfPersons} persons</span>
                        <span className="text-2xl font-black text-gray-900">₹{calcTotal().toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-gray-400">{form.sharingType.charAt(0).toUpperCase() + form.sharingType.slice(1)} sharing — per person rate</p>
                    </div>

                    <button type="submit" disabled={submitting}
                      className="w-full py-4 rounded-2xl text-white font-black text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                      style={{ backgroundColor: tc }}>
                      {submitting ? 'Submitting...' : 'Book This Package'}
                    </button>
                    <p className="text-[10px] text-gray-400 text-center">No payment required now. We'll confirm & collect payment separately.</p>
                  </form>

                  {/* Direct contact */}
                  {settings?.contactWhatsApp && (
                    <div className="px-5 pb-5">
                      <div className="border-t border-gray-100 pt-4 flex items-center justify-center gap-2">
                        <span className="text-xs text-gray-400">Or chat directly:</span>
                        <a href={`https://wa.me/${settings.contactWhatsApp.replace(/[^0-9]/g, '')}?text=Hi! I'm interested in ${pkg.title}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-sm font-bold text-green-600 hover:text-green-700">
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp FAB (mobile) */}
      {settings?.contactWhatsApp && (
        <a href={`https://wa.me/${settings.contactWhatsApp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all lg:hidden">
          <MessageCircle className="w-7 h-7" />
        </a>
      )}
    </div>
  );
}

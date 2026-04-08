'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  MapPin, Clock, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight,
  Users, Flag, Zap, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Star, Calendar, Phone, MessageCircle, AlertCircle, X, Minus, Plus,
} from 'lucide-react';
import Link from 'next/link';

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: 'bg-green-100 text-green-700 border-green-200',
  Moderate: 'bg-amber-100 text-amber-700 border-amber-200',
  Challenging: 'bg-orange-100 text-orange-700 border-orange-200',
  Expert: 'bg-red-100 text-red-700 border-red-200',
};

type Tab = 'overview' | 'highlights' | 'itinerary' | 'inclusions' | 'notes';

interface BookingField {
  id: string;
  key?: string;
  label: string;
  type: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
  enabled: boolean;
  order: number;
  isDefault: boolean;
}

const DEFAULT_FIELDS: BookingField[] = [
  { id: 'f_name', key: 'customerName', label: 'Full Name', type: 'text', placeholder: 'Full Name', required: true, enabled: true, order: 0, isDefault: true },
  { id: 'f_phone', key: 'customerPhone', label: 'Phone Number (WhatsApp)', type: 'tel', placeholder: 'Phone Number', required: true, enabled: true, order: 1, isDefault: true },
  { id: 'f_email', key: 'customerEmail', label: 'Email Address', type: 'email', placeholder: 'Email Address', required: false, enabled: true, order: 2, isDefault: true },
  { id: 'f_date', key: 'travelDate', label: 'Travel Date', type: 'date', required: false, enabled: true, order: 3, isDefault: true },
  { id: 'f_state', key: 'state', label: 'State', type: 'select', options: [], required: false, enabled: true, order: 4, isDefault: true },
  { id: 'f_city', key: 'city', label: 'City', type: 'text', placeholder: 'City', required: false, enabled: true, order: 5, isDefault: true },
  { id: 'f_source', key: 'leadSource', label: 'Source', type: 'select', options: [], required: false, enabled: true, order: 6, isDefault: true },
];

function DynamicField({ field, value, onChange, color }: {
  field: BookingField; value: string; onChange: (v: string) => void; color: string;
}) {
  const base = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none transition-all";
  const focusStyle = { '--tw-ring-color': color } as React.CSSProperties;

  if (field.type === 'select') {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
          {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <select value={value} onChange={e => onChange(e.target.value)} required={field.required}
          className={base + ' bg-white appearance-none'} style={focusStyle}>
          <option value="">Select...</option>
          {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }
  if (field.type === 'textarea') {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
          {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <textarea value={value} onChange={e => onChange(e.target.value)} required={field.required}
          placeholder={field.placeholder} rows={3}
          className={base + ' resize-none'} style={focusStyle} />
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
        {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={field.type} value={value} onChange={e => onChange(e.target.value)}
        required={field.required} placeholder={field.placeholder}
        className={base} style={focusStyle} />
    </div>
  );
}

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

  // Multi-step booking state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2>(1);
  const [bookingFields, setBookingFields] = useState<BookingField[]>(DEFAULT_FIELDS);
  const [bookingColor, setBookingColor] = useState('#22c55e');

  const [ticketQty, setTicketQty] = useState<Record<string, number>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!orgId || !packageId) return;
    (async () => {
      try {
        const [sSnap, pSnap] = await Promise.all([
          getDoc(doc(db, 'website_settings', orgId)),
          getDoc(doc(db, 'packages', packageId)),
        ]);
        if (sSnap.exists()) {
          const data = sSnap.data();
          setSettings(data);
          if (data.bookingForm) {
            setBookingColor(data.bookingForm.bookingColor || '#22c55e');
            if (data.bookingForm.fields?.length) {
              setBookingFields(data.bookingForm.fields.sort((a: BookingField, b: BookingField) => a.order - b.order));
            }
          }
        }
        if (pSnap.exists()) setPkg({ id: pSnap.id, ...pSnap.data() });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
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

  const calcTotal = () =>
    ticketTypes.reduce((sum, t) => sum + (ticketQty[t.type] || 0) * t.price, 0);
  
  const totalPersons = () =>
    ticketTypes.reduce((sum, t) => sum + (ticketQty[t.type] || 0), 0);
  
  const dominantType = () => {
    let dominant = 'double';
    let max = -1;
    ticketTypes.forEach(t => {
      if ((ticketQty[t.type] || 0) > max) { max = ticketQty[t.type] || 0; dominant = t.type; }
    });
    return dominant;
  };

  const ticketTypes = [
    { type: 'double', label: 'Dual Occupancy', price: pkg.priceDouble },
    { type: 'triple', label: 'Triple Occupancy', price: pkg.priceTriple },
    { type: 'quad', label: 'Quad Occupancy', price: pkg.priceQuad },
  ].filter(t => t.price > 0);

  const activeFields = bookingFields.filter(f => f.enabled);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Build standard fields from mapped keys
      const standardData: Record<string, any> = {};
      const customFieldsData: Record<string, string> = {};

      activeFields.forEach(field => {
        const val = fieldValues[field.id] || '';
        if (field.key) {
          standardData[field.key] = val;
        } else {
          customFieldsData[field.id] = val;
        }
      });

      const ticketBreakdown = ticketTypes.map(t => ({
        type: t.type, label: t.label, quantity: ticketQty[t.type] || 0, pricePerPerson: t.price,
      }));

      await addDoc(collection(db, 'bookings'), {
        orgId,
        packageId: pkg.id,
        packageTitle: pkg.title,
        customerName: standardData.customerName || '',
        customerEmail: standardData.customerEmail || '',
        customerPhone: standardData.customerPhone || '',
        travelDate: standardData.travelDate || '',
        state: standardData.state || '',
        city: standardData.city || '',
        leadSource: standardData.leadSource || '',
        sharingType: dominantType(),
        numberOfPersons: totalPersons(),
        ticketBreakdown,
        totalPrice: calcTotal(),
        status: 'Pending',
        source: 'Website',
        customFields: customFieldsData,
        createdAt: serverTimestamp(),
      });
      setBookingSuccess(true);
      setBookingOpen(false);
    } catch { alert('Failed to submit. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const openBooking = () => {
    setBookingStep(1);
    setBookingSuccess(false);
    setFieldValues({});
    setTicketQty({ double: 1, triple: 1, quad: 1 });
    setBookingOpen(true);
  };

  const toggleDay = (i: number) => setExpandedDays(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
  const prevImg = () => setCurrentImg(i => (i === 0 ? allImages.length - 1 : i - 1));
  const nextImg = () => setCurrentImg(i => (i === allImages.length - 1 ? 0 : i + 1));

  // Booking overlay (2-step)
  const BookingOverlay = () => (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setBookingOpen(false)}>
      <div className="w-full sm:w-[420px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <button onClick={() => bookingStep === 1 ? setBookingOpen(false) : setBookingStep(1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h2 className="font-bold text-gray-900 text-[15px]">
              {bookingStep === 1 ? 'Create Tickets & Pay' : 'Who Is Booking?'}
            </h2>
            <p className="text-xs text-gray-400 truncate">{pkg.title}</p>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1">
            {[1, 2].map(s => (
              <div key={s} className={`rounded-full transition-all ${bookingStep === s ? 'w-4 h-2' : 'w-2 h-2'}`}
                style={{ backgroundColor: s <= bookingStep ? bookingColor : '#e5e7eb' }} />
            ))}
          </div>
        </div>

        {/* Step 1: Ticket Selection */}
        {bookingStep === 1 && (
          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            {/* Travel Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Selected Date</label>
              <input type="date" value={fieldValues['f_date'] || ''}
                onChange={e => setFieldValues(v => ({ ...v, f_date: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none"
                style={{ accentColor: bookingColor }} />
            </div>

            {/* Ticket types */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Select Ticket(s)</label>
              <div className="space-y-2">
                {ticketTypes.map(t => (
                  <div key={t.type} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{t.label}</p>
                      <p className="text-xs text-gray-500">₹{t.price?.toLocaleString()} per person</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 shadow-sm p-0.5">
                      <button type="button"
                        onClick={() => setTicketQty(q => ({ ...q, [t.type]: Math.max(0, (q[t.type] || 0) - 1) }))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 font-bold text-gray-600 transition-colors">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-sm text-gray-900">
                        {ticketQty[t.type] || 0}
                      </span>
                      <button type="button"
                        onClick={() => setTicketQty(q => ({ ...q, [t.type]: (q[t.type] || 0) + 1 }))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 font-bold text-gray-600 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100">
              <div>
                <p className="text-xs text-gray-500">
                  {totalPersons()} tickets selected
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Includes all sharing types</p>
              </div>
              <p className="text-2xl font-black text-gray-900">₹{calcTotal().toLocaleString()}</p>
            </div>

            <button type="button"
              onClick={() => setBookingStep(2)}
              disabled={calcTotal() === 0}
              className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-md hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-40"
              style={{ backgroundColor: bookingColor }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Customer Info */}
        {bookingStep === 2 && (
          <form onSubmit={handleBooking} className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Package summary */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                {allImages[0] && (
                  <img src={allImages[0]} alt={pkg.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-1">{pkg.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {totalPersons()} tickets · ₹{calcTotal().toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Dynamic fields */}
              {activeFields
                .filter(f => f.id !== 'f_date') // date already collected in step 1
                .map(field => (
                  <DynamicField
                    key={field.id}
                    field={field}
                    value={fieldValues[field.id] || ''}
                    onChange={v => setFieldValues(prev => ({ ...prev, [field.id]: v }))}
                    color={bookingColor}
                  />
                ))}
            </div>

            {/* Sticky footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0 space-y-2">
              <button type="submit" disabled={submitting}
                className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-md hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
                style={{ backgroundColor: bookingColor }}>
                {submitting ? 'Submitting...' : 'Confirm Booking'}
              </button>
              <p className="text-[10px] text-gray-400 text-center">No payment required now. We'll confirm & collect payment separately.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white antialiased font-sans" style={{ fontFamily: isSerif ? headingFont : 'inherit' }}>

      {/* Booking Overlay */}
      {bookingOpen && <BookingOverlay />}

      {/* Booking Success Banner (mobile) */}
      {bookingSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold lg:hidden">
          <CheckCircle2 className="w-4 h-4" /> Booking submitted!
        </div>
      )}

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
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors group">
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
        <div className="relative h-[55vh] min-h-[380px] max-h-[600px] overflow-hidden cursor-pointer group" onClick={() => setLightbox(true)}>
          <img src={allImages[currentImg]} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28 lg:pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left: Package Details */}
          <div className="lg:col-span-2">
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

            <div className="min-h-[300px]">
              {activeTab === 'overview' && (
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 leading-relaxed text-base whitespace-pre-wrap">{pkg.description}</p>
                </div>
              )}
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

          {/* Right: Booking Card (desktop) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden sticky top-24">
              {bookingSuccess ? (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">Booking Received!</h3>
                  <p className="text-gray-500 mb-7 leading-relaxed">Thank you! Our team will contact you shortly to confirm your booking.</p>
                  <Link href="/"
                    className="block w-full py-3.5 rounded-2xl text-white font-bold text-center shadow-md hover:shadow-xl hover:scale-[1.02] transition-all"
                    style={{ backgroundColor: tc }}>
                    Back to Home
                  </Link>
                </div>
              ) : (
                <>
                  {/* Price header */}
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Book This Package</h3>
                    <div className="flex gap-1">
                      {[1, 2].map(s => (
                        <div key={s} className={`rounded-full transition-all ${bookingStep === s ? 'w-4 h-2' : 'w-2 h-2'}`}
                          style={{ backgroundColor: s <= bookingStep ? bookingColor : '#e5e7eb' }} />
                      ))}
                    </div>
                  </div>

                  {/* Desktop multi-step form */}
                  {bookingStep === 1 ? (
                    <div className="p-5 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Select Ticket(s)</label>
                        <div className="space-y-2">
                          {ticketTypes.map(t => (
                            <div key={t.type} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900">{t.label}</p>
                                <p className="text-xs text-gray-500">₹{t.price?.toLocaleString()} per person</p>
                              </div>
                              <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 shadow-sm p-0.5">
                                <button type="button"
                                  onClick={() => setTicketQty(q => ({ ...q, [t.type]: Math.max(0, (q[t.type] || 0) - 1) }))}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 font-bold text-gray-600 transition-colors">
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-7 text-center font-bold text-sm text-gray-900">
                                  {ticketQty[t.type] || 0}
                                </span>
                                <button type="button"
                                  onClick={() => setTicketQty(q => ({ ...q, [t.type]: (q[t.type] || 0) + 1 }))}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 font-bold text-gray-600 transition-colors">
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-500">{totalPersons()} tickets</span>
                          <span className="text-2xl font-black text-gray-900">₹{calcTotal().toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-gray-400">Total amount including all selected tickets</p>
                      </div>

                      <button type="button" onClick={() => setBookingStep(2)} disabled={calcTotal() === 0}
                        className="w-full py-4 rounded-2xl text-white font-black text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-40"
                        style={{ backgroundColor: bookingColor }}>
                        Continue →
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleBooking} className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                      <div className="flex items-center gap-2 mb-1">
                        <button type="button" onClick={() => setBookingStep(1)} className="text-xs text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1">
                          <ChevronLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <span className="text-sm font-bold text-gray-900 flex-1">Your Details</span>
                        <span className="text-xs text-gray-400 font-semibold">₹{calcTotal().toLocaleString()}</span>
                      </div>

                      {activeFields
                        .filter(f => f.id !== 'f_date')
                        .map(field => (
                          <DynamicField
                            key={field.id}
                            field={field}
                            value={fieldValues[field.id] || ''}
                            onChange={v => setFieldValues(prev => ({ ...prev, [field.id]: v }))}
                            color={bookingColor}
                          />
                        ))}

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Travel Date</label>
                        <input type="date" value={fieldValues['f_date'] || ''}
                          onChange={e => setFieldValues(v => ({ ...v, f_date: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none" />
                      </div>

                      <button type="submit" disabled={submitting}
                        className="w-full py-4 rounded-2xl text-white font-black text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                        style={{ backgroundColor: bookingColor }}>
                        {submitting ? 'Submitting...' : 'Confirm Booking'}
                      </button>
                      <p className="text-[10px] text-gray-400 text-center">No payment required now.</p>
                    </form>
                  )}

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

      {/* Mobile sticky Book Now bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500">{totalPersons()} tickets selected</p>
            <p className="font-black text-gray-900 text-lg">₹{calcTotal().toLocaleString()}</p>
          </div>
          {bookingSuccess ? (
            <div className="flex items-center gap-2 px-5 py-3 bg-green-100 text-green-700 rounded-2xl font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Booked!
            </div>
          ) : (
            <button onClick={openBooking}
              className="px-6 py-3.5 rounded-2xl text-white font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-95"
              style={{ backgroundColor: bookingColor }}>
              Book Now
            </button>
          )}
        </div>
      </div>

      {/* WhatsApp FAB */}
      {settings?.contactWhatsApp && (
        <a href={`https://wa.me/${settings.contactWhatsApp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
          className="fixed bottom-20 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all lg:hidden">
          <MessageCircle className="w-7 h-7" />
        </a>
      )}
    </div>
  );
}

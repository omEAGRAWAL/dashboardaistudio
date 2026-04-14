'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Instagram, MessageCircle, FileText, ChevronLeft, Minus, Plus,
  Luggage, CheckCircle2, ChevronRight, Tag,
} from 'lucide-react';

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];
const LEAD_SOURCES = ['Instagram','Facebook','WhatsApp','Google','Reference','Website','Other'];

interface TicketQty { double: number; triple: number; quad: number }

export default function CampaignPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [settings, setSettings] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Booking state
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Payment state
  const [rzpConfig, setRzpConfig] = useState<{ keyId: string; advancePercentage: number } | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Step 1 fields
  const [travelDate, setTravelDate] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [source, setSource] = useState('');

  // Step 2 ticket quantities
  const [ticketQty, setTicketQty] = useState<TicketQty>({ double: 1, triple: 1, quad: 1 });
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [acceptSlot, setAcceptSlot] = useState(false);
  const [acceptTnc, setAcceptTnc] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const [sSnap, pkgsSnap] = await Promise.all([
          getDoc(doc(db, 'campaign_settings', orgId)),
          getDocs(query(collection(db, 'packages'), where('orgId', '==', orgId))),
        ]);
        if (sSnap.exists()) setSettings(sSnap.data());
        else {
          // fallback to website_settings for agency name/social etc.
          const ws = await getDoc(doc(db, 'website_settings', orgId));
          if (ws.exists()) setSettings(ws.data());
        }
        setPackages(pkgsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [orgId]);

  const accentColor = settings?.accentColor || '#F59E0B';
  const bgColor = settings?.bgColor || '#ffffff';
  const agencyName = settings?.agencyName || settings?.agencyName || 'Travel Agency';
  const whatsapp = settings?.whatsapp || settings?.contactWhatsApp || '';
  const instagram = settings?.instagram || settings?.socialInstagram || '';
  const logoUrl = settings?.logoUrl || '';
  const poweredByText = settings?.poweredByText || 'logout.studio';

  // Categories
  const allCats = Array.from(
    new Set(packages.map(p => p.campaignCategory || p.category).filter(Boolean))
  );
  const categories = ['All', ...allCats];
  const filteredPkgs = selectedCategory === 'All'
    ? packages
    : packages.filter(p => (p.campaignCategory || p.category) === selectedCategory);

  // Load Razorpay config for this org
  useEffect(() => {
    if (!orgId) return;
    fetch(`/api/razorpay/public-config?orgId=${orgId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.configured) setRzpConfig({ keyId: data.keyId, advancePercentage: data.advancePercentage ?? 30 }); })
      .catch(() => {});
  }, [orgId]);

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise(resolve => {
      if ((window as any).Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const handleRazorpayPayment = useCallback(async (bookingId: string, paymentType: 'advance' | 'full') => {
    if (!rzpConfig || !orgId) return;
    setPaymentLoading(true);
    try {
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, orgId, paymentType }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load payment gateway');

      await new Promise<void>((resolve) => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.orderId,
          name: agencyName,
          description: selectedPkg?.title || 'Package Booking',
          theme: { color: accentColor },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                  bookingId,
                  orgId,
                }),
              });
              if (verifyRes.ok) {
                setShowPaymentModal(false);
                setBookingSuccess(true);
              } else {
                alert('Payment verification failed. Please contact support.');
              }
            } catch { alert('Payment verification failed.'); }
            resolve();
          },
          modal: { ondismiss: () => resolve() },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', () => resolve());
        rzp.open();
      });
    } catch (err: any) {
      alert(`Payment error: ${err.message}`);
    } finally {
      setPaymentLoading(false);
    }
  }, [rzpConfig, orgId, agencyName, selectedPkg, accentColor, loadRazorpayScript]);

  // Ticket calculation for selected package
  const getTicketTypes = (pkg: any) => [
    { type: 'double' as const, label: 'Dual Occupancy', price: pkg?.priceDouble },
    { type: 'triple' as const, label: 'Triple Occupancy', price: pkg?.priceTriple },
    { type: 'quad' as const, label: 'Quad Occupancy', price: pkg?.priceQuad },
  ].filter(t => t.price > 0);

  const calcTotal = (pkg: any) =>
    getTicketTypes(pkg).reduce((sum, t) => sum + (ticketQty[t.type] || 0) * t.price, 0);

  const openBooking = (pkg: any) => {
    setSelectedPkg(pkg);
    setBookingStep(1);
    setBookingSuccess(false);
    setTravelDate(''); setName(''); setPhone(''); setEmail('');
    setState(''); setCity(''); setSource('');
    setTicketQty({ double: 1, triple: 1, quad: 1 });
    setAcceptSlot(false); setAcceptTnc(false); setCouponCode('');
    setBookingOpen(true);
  };

  const handleBookingSubmit = async () => {
    if (!selectedPkg || !orgId) return;
    setSubmitting(true);
    try {
      const ticketTypes = getTicketTypes(selectedPkg);
      const ticketBreakdown = ticketTypes.map(t => ({
        type: t.type, label: t.label, quantity: ticketQty[t.type] || 0, pricePerPerson: t.price,
      }));
      const totalTickets = ticketBreakdown.reduce((s, t) => s + t.quantity, 0);
      const dominant = ticketBreakdown.reduce((a, b) => a.quantity >= b.quantity ? a : b);

      const docRef = await addDoc(collection(db, 'bookings'), {
        orgId,
        packageId: selectedPkg.id,
        packageTitle: selectedPkg.title,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        travelDate,
        state,
        city,
        leadSource: source,
        sharingType: dominant.type,
        numberOfPersons: totalTickets,
        ticketBreakdown,
        totalPrice: calcTotal(selectedPkg),
        couponCode: couponCode || '',
        status: 'Pending',
        source: 'Campaign',
        paymentStatus: 'payment_pending',
        createdAt: serverTimestamp(),
      });
      setBookingOpen(false);
      // If Razorpay configured, show payment choice
      if (rzpConfig) {
        setPendingBookingId(docRef.id);
        setShowPaymentModal(true);
      } else {
        setBookingSuccess(true);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
      <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin"
        style={{ borderTopColor: accentColor }} />
    </div>
  );

  const bgStyle: React.CSSProperties = {
    background: `
      radial-gradient(ellipse 80% 55% at -5% 0%, rgba(255,89,65,0.42) 0%, transparent 55%),
      radial-gradient(ellipse 65% 50% at 108% 5%, rgba(60,160,255,0.38) 0%, transparent 55%),
      radial-gradient(ellipse 70% 55% at -5% 102%, rgba(80,200,120,0.42) 0%, transparent 55%),
      radial-gradient(ellipse 65% 50% at 108% 98%, rgba(200,80,200,0.38) 0%, transparent 55%),
      ${bgColor}
    `,
    minHeight: '100vh',
  };

  // ── Derived overlay values (computed at render, not inside a sub-component) ──
  const overlayTicketTypes = selectedPkg ? getTicketTypes(selectedPkg) : [];
  const overlayTotal = selectedPkg ? calcTotal(selectedPkg) : 0;
  const overlayCover = selectedPkg ? (selectedPkg.images?.[0] || selectedPkg.imageUrl) : '';
  const overlayMinPrice = overlayTicketTypes.length ? Math.min(...overlayTicketTypes.map(t => t.price)) : 0;
  const overlayMaxPrice = overlayTicketTypes.length ? Math.max(...overlayTicketTypes.map(t => t.price)) : 0;
  const overlayHasPrices = overlayTicketTypes.length > 0 && overlayMaxPrice > 0;
  const overlayDiscountPct = selectedPkg?.priceOriginal > overlayMaxPrice
    ? Math.round(((selectedPkg.priceOriginal - overlayMinPrice) / selectedPkg.priceOriginal) * 100)
    : null;

  return (
    <div style={bgStyle}>
      {/* Success Banner */}
      {bookingSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" /> Booking submitted! We'll reach out soon.
        </div>
      )}

      {/* ── Razorpay Payment Modal ── */}
      {showPaymentModal && pendingBookingId && rzpConfig && selectedPkg && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full sm:w-[400px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-2 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Booking Submitted!</h2>
              <p className="text-sm text-gray-500 mb-5">Complete your payment to confirm the booking.</p>
            </div>
            <div className="px-6 pb-6 space-y-3">
              {/* Advance */}
              <button
                disabled={paymentLoading}
                onClick={() => handleRazorpayPayment(pendingBookingId, 'advance')}
                className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-md hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-between px-5"
                style={{ backgroundColor: accentColor }}
              >
                <span>Pay Advance ({rzpConfig.advancePercentage}%)</span>
                <span className="font-black">₹{Math.round(calcTotal(selectedPkg) * rzpConfig.advancePercentage / 100).toLocaleString('en-IN')}</span>
              </button>
              {/* Full */}
              <button
                disabled={paymentLoading}
                onClick={() => handleRazorpayPayment(pendingBookingId, 'full')}
                className="w-full py-4 rounded-2xl border-2 text-gray-800 font-bold text-base hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-between px-5"
                style={{ borderColor: accentColor }}
              >
                <span>Pay Full Amount</span>
                <span className="font-black">₹{calcTotal(selectedPkg).toLocaleString('en-IN')}</span>
              </button>
              {/* Pay Later */}
              <button
                disabled={paymentLoading}
                onClick={() => { setShowPaymentModal(false); setBookingSuccess(true); }}
                className="w-full py-3 rounded-2xl text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                {paymentLoading ? 'Processing payment…' : 'Pay Later — Agent will contact me'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Overlay — inlined to avoid component-inside-component remount issue */}
      {bookingOpen && selectedPkg && (
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => setBookingOpen(false)}>
        <div
          className="w-full sm:w-[400px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() => bookingStep === 1 ? setBookingOpen(false) : setBookingStep(1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600 flex-shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center min-w-0">
              <h2 className="font-bold text-gray-900 text-[15px]">
                {bookingStep === 1 ? 'Who Is Booking?' : 'Create Tickets & Pay'}
              </h2>
              <p className="text-xs text-gray-400 truncate">{selectedPkg.title}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {[1, 2, 3].map(s => (
                <div key={s}
                  className="rounded-full transition-all"
                  style={{
                    width: bookingStep === s ? 16 : 8,
                    height: 8,
                    backgroundColor: s <= bookingStep ? accentColor : '#e5e7eb',
                  }} />
              ))}
            </div>
          </div>

          {/* Step 1: Who Is Booking? */}
          {bookingStep === 1 && (
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* Package mini-card */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3">
                {overlayCover && <img src={overlayCover} alt={selectedPkg.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-1">{selectedPkg.title}</p>
                  {overlayHasPrices && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      From ₹{overlayMinPrice.toLocaleString()}/- {selectedPkg.priceOriginal > overlayMaxPrice && (
                        <span className="line-through text-gray-400">₹{selectedPkg.priceOriginal?.toLocaleString()}</span>
                      )}
                    </p>
                  )}
                </div>
                {overlayDiscountPct && (
                  <span className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg text-white"
                    style={{ backgroundColor: accentColor }}>
                    {overlayDiscountPct}% off
                  </span>
                )}
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Date</label>
                <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none"
                  style={{ accentColor }} />
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Full Name" required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none" />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number (WhatsApp)</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="Phone Number" required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none" />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none" />
              </div>

              {/* State */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">State</label>
                <div className="relative">
                  <select value={state} onChange={e => setState(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none appearance-none pr-8">
                    <option value="">Select...</option>
                    {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* City */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">City</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none" />
              </div>

              {/* Source */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Source</label>
                <div className="relative">
                  <select value={source} onChange={e => setSource(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none appearance-none pr-8">
                    <option value="">Select...</option>
                    {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
          {bookingStep === 1 && (
            <div className="px-5 pb-5 pt-2 flex-shrink-0">
              <button
                onClick={() => { if (!name || !phone) { alert('Name and Phone are required'); return; } setBookingStep(2); }}
                className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-md hover:brightness-110 transition-all"
                style={{ backgroundColor: accentColor }}>
                Next
              </button>
            </div>
          )}

          {/* Step 2: Tickets & Pay */}
          {bookingStep === 2 && (
            <>
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                {/* Selected date */}
                {travelDate && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Selected Date</p>
                    <p className="font-semibold text-sm" style={{ color: accentColor }}>
                      {new Date(travelDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}

                {/* Ticket types */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Ticket(s)</p>
                  <div className="space-y-2">
                    {overlayTicketTypes.map(t => (
                      <div key={t.type} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{t.label}</p>
                          <p className="text-xs text-gray-500">: ₹{t.price?.toLocaleString()}.00</p>
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

                {/* Apply Coupon */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button"
                    onClick={() => setCouponOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <span className="flex items-center gap-2"><Tag className="w-4 h-4 text-gray-400" />Apply Coupon</span>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${couponOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {couponOpen && (
                    <div className="px-4 pb-3 flex gap-2">
                      <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
                      <button type="button"
                        className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                        style={{ backgroundColor: accentColor }}>
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                {/* Checkboxes */}
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={acceptSlot} onChange={e => setAcceptSlot(e.target.checked)}
                      className="mt-0.5 flex-shrink-0" style={{ accentColor }} />
                    <span className="text-xs text-gray-600">
                      Reserve your slot by paying ₹{overlayTotal.toLocaleString()}/-
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={acceptTnc} onChange={e => setAcceptTnc(e.target.checked)}
                      className="mt-0.5 flex-shrink-0" style={{ accentColor }} />
                    <span className="text-xs text-gray-600">
                      I have read and accept the Refunds, Cancellation Policy &amp; Terms &amp; Conditions
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 pb-5 pt-2 flex-shrink-0 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-black text-gray-900">₹{overlayTotal.toLocaleString()}</p>
                  <button type="button" className="text-xs font-semibold underline text-gray-500">Details</button>
                </div>
                <button
                  onClick={handleBookingSubmit}
                  disabled={submitting || overlayTotal === 0}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-md hover:brightness-110 transition-all disabled:opacity-40"
                  style={{ backgroundColor: accentColor }}>
                  {submitting ? 'Submitting...' : 'Pay Now'}
                </button>
                <p className="text-center text-[10px] text-gray-400">
                  🔒 secured by : {poweredByText}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* Page Content — constrained width */}
      <div className="max-w-md mx-auto px-4 pb-12">

        {/* Top Header */}
        <div className="flex flex-col items-center pt-10 pb-6 gap-3">
          {/* Logo Circle */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: accentColor }}>
            {logoUrl
              ? <img src={logoUrl} alt={agencyName} className="w-full h-full object-cover rounded-full" />
              : <Luggage className="w-10 h-10 text-gray-900" />
            }
          </div>

          {/* Agency Name */}
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">{agencyName}</h1>

          {/* Social Icons */}
          {(instagram || whatsapp) && (
            <div className="flex items-center gap-3">
              {instagram && (
                <a
                  href={`https://instagram.com/${instagram.replace('@', '')}`}
                  target="_blank" rel="noreferrer"
                  className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm hover:scale-105 transition-transform border border-gray-100">
                  <Instagram className="w-5 h-5 text-gray-700" />
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank" rel="noreferrer"
                  className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm hover:scale-105 transition-transform border border-gray-100">
                  <MessageCircle className="w-5 h-5 text-gray-700" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Category Tabs */}
        {allCats.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border"
                style={
                  selectedCategory === cat
                    ? { backgroundColor: '#111827', color: '#fff', borderColor: '#111827' }
                    : { backgroundColor: 'transparent', color: '#374151', borderColor: '#d1d5db' }
                }>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Package List */}
        <div className="space-y-2.5">
          {filteredPkgs.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No packages found.</div>
          )}
          {filteredPkgs.map(pkg => {
            const cover = pkg.images?.[0] || pkg.imageUrl;
            return (
              <div
                key={pkg.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm"
                style={{ backgroundColor: accentColor }}>
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/60 shadow-sm">
                  {cover
                    ? <img src={cover} alt={pkg.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Luggage className="w-4 h-4 text-gray-400" />
                      </div>
                  }
                </div>

                {/* Name */}
                <p className="flex-1 font-black text-xs uppercase text-gray-900 line-clamp-2 leading-tight">
                  {pkg.title}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {pkg.pdfUrl && (
                    <a
                      href={pkg.pdfUrl}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 bg-gray-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-full hover:bg-gray-700 transition-colors">
                      <FileText className="w-3 h-3" /> PDF
                    </a>
                  )}
                  <button
                    onClick={() => openBooking(pkg)}
                    className="bg-gray-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-full hover:bg-gray-700 transition-colors">
                    Book
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-10">
          Powered by: {poweredByText}
        </p>
      </div>
    </div>
  );
}

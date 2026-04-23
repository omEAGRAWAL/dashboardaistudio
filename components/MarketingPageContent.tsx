'use client';

import Link from 'next/link';
import { useState } from 'react';

const WHATSAPP_NUMBER = '917609098787';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%2C%20I%27m%20interested%20in%20Yatrik%20CRM%20for%20my%20travel%20agency.`;

// ── Icons ─────────────────────────────────────────────────────────────────────

const CheckIcon = ({ className = 'w-4 h-4 text-green-500' }) => (
  <svg className={`${className} flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mx-auto" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// ── Data ──────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: '🎯',
    title: 'Lead Management',
    desc: 'Capture leads from Meta Ads, WhatsApp & your website automatically. Track every enquiry with status, notes, and follow-up reminders — zero slips.',
    badge: 'Auto-capture from Meta Ads',
  },
  {
    icon: '📦',
    title: 'Package Management',
    desc: 'Create travel packages with multi-image galleries, pricing, and detailed itineraries. Publish to your website in one click — no developer needed.',
    badge: 'Multi-image galleries',
  },
  {
    icon: '📅',
    title: 'Booking Management',
    desc: 'Track all bookings — payment status, passenger details, travel dates, and advance payments. Everything in one place, nothing on paper.',
    badge: 'Full payment tracking',
  },
  {
    icon: '📣',
    title: 'Campaign Page',
    desc: 'Launch promotional campaign pages for seasonal deals, festival offers, and Honeymoon/Group packages. Drive enquiries directly from your ads.',
    badge: 'Drive more enquiries',
  },
  {
    icon: '🌐',
    title: 'Custom Landing Page',
    desc: 'Get a professional, SEO-ready travel website in minutes — hero, gallery, testimonials, packages, contact form, Google Maps, WhatsApp widget.',
    badge: '13 customizable sections',
  },
  {
    icon: '💬',
    title: 'WhatsApp Integration',
    desc: 'Auto-capture WhatsApp enquiries into your CRM. Send booking confirmations, package details, and follow-ups directly from Yatrik.',
    badge: 'Real-time inbox',
  },
  {
    icon: '👥',
    title: 'Team Management',
    desc: 'Invite agents, assign leads, and track team performance. Role-based access keeps your data secure while your whole team stays in sync.',
    badge: 'Up to 20 agents',
  },
  {
    icon: '📊',
    title: 'Analytics & Reports',
    desc: 'Track conversion rates, top-performing packages, monthly bookings, and revenue — all in a clean real-time dashboard. Know your numbers.',
    badge: 'Live revenue tracking',
  },
  {
    icon: '🔗',
    title: 'Meta Ads Integration',
    desc: 'Connect your Facebook & Instagram lead forms once. Every new ad lead lands directly in your CRM — no manual imports, no missed enquiries.',
    badge: 'Auto-sync lead forms',
  },
];

const plans = [
  {
    name: 'Basic CRM',
    price: '1,499',
    gst: 'incl. GST',
    tagline: 'Everything you need to get started',
    highlight: false,
    badge: null,
    features: [
      'Lead Management & CRM',
      
      'Team Access (up to 5 agents)',
      'Analytics Dashboard',
      'Meta Ads Lead Capture',
      'Email Support',
    ],
    notIncluded: [
      'Booking Management',
      'Campaign Page',
      'Custom Landing Page',
      'WhatsApp Integration',
    ],
    cta: 'Get Started',
    ctaHref: '/login',
  },
  {
    name: 'Growth',
    price: '2,499',
    gst: 'incl. GST',
    tagline: 'For agencies ready to scale bookings',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Everything in Basic CRM',
      'Booking Management',
      'Campaign Page',
      'Team Access (up to 10 agents)',
      'Priority Support',
      'GST Invoice',
    ],
    notIncluded: [
      'Custom Landing Page / Website',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/login',
  },
  {
    name: 'Pro',
    price: '3,999',
    gst: 'incl. GST',
    tagline: 'Full-stack CRM + professional website',
    highlight: false,
    badge: 'Best Value',
    features: [
      'Everything in Growth',
      'Custom Landing Page',
      'Website Builder (13 sections)',
      'SEO-Ready Website',
      'Team Access (up to 20 agents)',
      'Dedicated Onboarding Call',
      'Free Setup (worth ₹5,000)',
      '24/7 Priority Support',
    ],
    notIncluded: [],
    cta: 'Start Free Trial',
    ctaHref: '/login',
  },
];

const testimonials = [
  {
    quote: 'Before Yatrik, we lost at least 30% of Meta Ads leads — no system to follow up. Now every lead is tracked and our conversion rate has doubled in 3 months.',
    name: 'Rajesh Sharma',
    role: 'Owner, Sharma Travels',
    city: 'Delhi',
  },
  {
    quote: 'The booking management is a game-changer. Tracking payments, passengers, and travel dates used to take hours. Now it takes seconds. Totally worth ₹2,499.',
    name: 'Priya Mehta',
    role: 'Founder, Dream Voyages',
    city: 'Mumbai',
  },
  {
    quote: 'Our Pro website went live in under an hour. Clients trust us way more now and we get direct Google enquiries every week. The ROI is insane.',
    name: 'Arjun Nair',
    role: 'Director, Horizon Travel',
    city: 'Bangalore',
  },
];

const faqs = [
  {
    q: 'Is there a free trial?',
    a: 'Yes! Every plan includes a 7-day free trial — all features, no restrictions. No credit card needed to start.',
  },
  {
    q: 'What does "incl. GST" mean on the pricing?',
    a: 'All prices are final — GST is already included. No surprise tax added at checkout. You get a proper GST invoice for your business expense.',
  },
  {
    q: 'What is included in the Custom Landing Page (Pro plan)?',
    a: 'You get a fully-branded, SEO-ready travel website with 13 customizable sections — hero with overlay, packages grid, photo gallery, testimonials, contact form, Google Maps, WhatsApp widget, and more. No coding needed.',
  },
  {
    q: 'What is the Campaign Page in the Growth plan?',
    a: 'A Campaign Page lets you create dedicated landing pages for seasonal deals, festival packages (Diwali, New Year, etc.), or special offers. You can link these directly to your Meta/Google Ads for better conversions.',
  },
  {
    q: 'Can I upgrade my plan later?',
    a: 'Absolutely. Start on Basic CRM and upgrade to Growth or Pro anytime — your data, leads, and packages carry over seamlessly.',
  },
  {
    q: 'Does Yatrik work for solo travel agents?',
    a: 'Perfectly. Whether you\'re a solo consultant or a team of 20, Yatrik fits your workflow. Basic CRM is built exactly for solo agents.',
  },
  {
    q: 'How does Meta Ads integration work?',
    a: 'Connect your Facebook & Instagram lead forms once. Every new ad lead is automatically captured into your Yatrik CRM — no manual imports, no missed hot enquiries.',
  },
  {
    q: 'Is there an annual plan discount?',
    a: 'Yes! Pay annually and get 2 months free. Contact us on WhatsApp for annual pricing.',
  },
];

const painPoints = [
  { emoji: '😤', pain: 'Meta Ads leads vanish with no system to track or follow up' },
  { emoji: '😰', pain: 'Clients ask about packages and you scramble to send PDFs on WhatsApp' },
  { emoji: '😵', pain: 'Team has no idea who\'s following up on which lead' },
  { emoji: '😞', pain: 'Competitors with a professional website win clients you should have had' },
  { emoji: '📒', pain: 'Booking details scattered across emails, chats, and notebooks' },
  { emoji: '🤷', pain: 'No idea which packages or campaigns are actually making you money' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function MarketingPageContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans antialiased">

      {/* ── ANNOUNCEMENT BAR ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-center text-xs sm:text-sm py-2.5 px-4">
        <span className="font-semibold">Limited Offer:</span> 7-day free trial on all plans — no credit card needed.{' '}
        <a href="#pricing" className="underline font-semibold hover:no-underline">See plans →</a>
      </div>

      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">Y</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Yatrik</span>
            <span className="hidden sm:inline-flex ml-1 text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
              Travel CRM
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-7 text-sm text-gray-600 font-medium">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Reviews</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </div>

          {/* Nav CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden sm:inline text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Sign In
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.12 1.523 5.854L0 24l6.336-1.499A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.002-1.369l-.36-.213-3.722.88.937-3.625-.235-.372A9.792 9.792 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
              </svg>
              Chat
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-indigo-200"
            >
              <span className="hidden sm:inline">Start Free Trial</span>
              <span className="sm:hidden">Try Free</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Reviews', href: '#testimonials' },
              { label: 'FAQ', href: '#faq' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2 border-t border-gray-100 mt-2 space-y-2">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-green-700 bg-green-50 rounded-lg"
              >
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.12 1.523 5.854L0 24l6.336-1.499A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.002-1.369l-.36-.213-3.722.88.937-3.625-.235-.372A9.792 9.792 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                </svg>
                Chat on WhatsApp — 7609098787
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-indigo-900 pt-16 pb-24 sm:pt-24 sm:pb-32">
        {/* Background texture */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500 opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500 opacity-10 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
            #1 CRM Built Exclusively for Indian Travel Agencies
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Stop Losing Leads.{' '}
            <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300">
              Start Closing Bookings.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-white/70 leading-relaxed mb-4">
            Yatrik is the all-in-one CRM for Indian travel agencies — manage{' '}
            <span className="text-white font-semibold">leads, packages, bookings, campaigns & your website</span>{' '}
            from one beautiful dashboard.
          </p>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-white/50 mb-10">
            Plans starting at ₹1,499/month incl. GST · Trusted across Delhi, Mumbai, Bangalore, Jaipur &amp; beyond.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-2xl shadow-indigo-900/60 hover:-translate-y-0.5"
            >
              Start Free — No Card Needed
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold text-base px-8 py-4 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.12 1.523 5.854L0 24l6.336-1.499A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.002-1.369l-.36-.213-3.722.88.937-3.625-.235-.372A9.792 9.792 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
              </svg>
              Talk to Us — 7609098787
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-xs sm:text-sm text-white/50">
            {['7-Day Free Trial', 'No Credit Card', 'Free Setup', 'Cancel Anytime', 'GST Invoice', 'Indian Support'].map((b) => (
              <div key={b} className="flex items-center gap-1.5">
                <CheckIcon className="w-3.5 h-3.5 text-green-400" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <div className="bg-gray-50 border-y border-gray-100 py-5">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
          {[
            { stat: '500+', label: 'Agencies Onboarded' },
            { stat: '₹2.4Cr+', label: 'Bookings Tracked' },
            { stat: '50,000+', label: 'Leads Managed' },
            { stat: '4.9/5', label: 'Avg. Rating' },
          ].map((item) => (
            <div key={item.stat} className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-gray-900">{item.stat}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PAIN POINTS ── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex text-xs font-semibold uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1 rounded-full mb-4">
            Sound Familiar?
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
            You&apos;re losing bookings every single day — and you know it.
          </h2>
          <p className="text-gray-500 text-base sm:text-lg mb-12">
            Most Indian travel agencies still run on WhatsApp, Excel, and gut feeling.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-left mb-10">
            {painPoints.map((item) => (
              <div key={item.pain} className="flex items-start gap-3 bg-red-50/70 border border-red-100 rounded-xl p-4">
                <span className="text-xl flex-shrink-0">{item.emoji}</span>
                <p className="text-gray-700 text-sm leading-snug">{item.pain}</p>
              </div>
            ))}
          </div>
          <div className="inline-flex items-start sm:items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-5 text-left">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-indigo-900 font-semibold text-sm sm:text-base">
              Yatrik was built specifically to solve every one of these problems — for Indian travel agencies, by people who understand Indian travel.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-3">
              Features
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything your travel agency needs — in one place
            </h2>
            <p className="max-w-2xl mx-auto text-gray-500 text-base sm:text-lg">
              Unlike generic CRMs, every Yatrik feature is designed around how Indian travel agencies actually work.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:bg-indigo-100 transition-colors">
                  {f.icon}
                </div>
                <span className="inline-flex text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full mb-3">
                  {f.badge}
                </span>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-3">
              How It Works
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
              From signup to first booking in 24 hours
            </h2>
            <p className="max-w-xl mx-auto text-gray-500 text-base sm:text-lg">
              We handle the setup so you can focus on selling.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: '01',
                title: 'Sign Up Free',
                desc: 'Create your account in 60 seconds. No credit card, no commitment. Get 7 days to explore every feature — unlimited leads, packages, bookings.',
              },
              {
                step: '02',
                title: 'We Set You Up',
                desc: 'Our India-based team handles the complete setup for free — we import your data, configure branding, and launch your travel website in 24 hours.',
              },
              {
                step: '03',
                title: 'Close More Bookings',
                desc: 'Track leads, manage packages, collect bookings, and run campaigns. Watch revenue grow. Upgrade only when you\'re ready.',
              },
            ].map((s) => (
              <div key={s.step} className="relative bg-gradient-to-b from-indigo-50 to-white rounded-2xl border border-indigo-100 p-7 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-5 shadow-lg shadow-indigo-200">
                  {s.step}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-3">
              Pricing
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing. No surprises.
            </h2>
            <p className="max-w-xl mx-auto text-gray-500 text-base sm:text-lg">
              All prices include GST. 7-day free trial on every plan. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl overflow-hidden transition-all ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-300/40 scale-[1.02] z-10'
                    : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`text-center py-2 text-xs font-bold uppercase tracking-wider ${
                    plan.highlight ? 'bg-white/15 text-white' : 'bg-indigo-600 text-white'
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1">
                  {/* Plan header */}
                  <div className="mb-6">
                    <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm mb-4 ${plan.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {plan.tagline}
                    </p>
                    <div className="flex items-end gap-1">
                      <span className={`text-lg font-bold ${plan.highlight ? 'text-indigo-200' : 'text-gray-400'}`}>₹</span>
                      <span className={`text-4xl sm:text-5xl font-extrabold leading-none ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                        {plan.price}
                      </span>
                      <div className="ml-1 mb-1">
                        <div className={`text-sm ${plan.highlight ? 'text-indigo-200' : 'text-gray-400'}`}>/month</div>
                        <div className={`text-xs font-semibold ${plan.highlight ? 'text-green-300' : 'text-green-600'}`}>
                          {plan.gst}
                        </div>
                      </div>
                    </div>
                    {/* Free trial */}
                    <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                      plan.highlight ? 'bg-white/15 text-green-200' : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      7-day FREE trial
                    </div>
                    {/* Setup fee */}
                    <div className={`mt-2 text-xs font-medium ${plan.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>
                      Setup fee: <span className={`line-through ${plan.highlight ? 'text-indigo-300' : 'text-gray-400'}`}>₹999</span>{' '}
                      <span className={`font-bold ${plan.highlight ? 'text-green-300' : 'text-green-600'}`}>FREE</span>
                    </div>
                  </div>

                  {/* What's included */}
                  <ul className="space-y-2.5 mb-5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <CheckIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-green-300' : 'text-green-500'}`} />
                        <span className={plan.highlight ? 'text-indigo-100' : 'text-gray-700'}>{f}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <XIcon />
                        <span className={`${plan.highlight ? 'text-indigo-300/60' : 'text-gray-300'} line-through`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.ctaHref}
                    className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all ${
                      plan.highlight
                        ? 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Footnote */}
          <p className="text-center text-sm text-gray-400 mt-8">
            Need a custom plan or annual pricing?{' '}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-green-600 font-semibold hover:underline">
              Chat on WhatsApp →
            </a>
          </p>
        </div>
      </section>

      {/* ── PLAN COMPARISON TABLE ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Compare Plans</h2>
            <p className="text-gray-500 text-sm sm:text-base">Everything you get at each tier — side by side.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="bg-gray-900">
                  <th className="text-left px-5 py-4 text-gray-400 font-semibold text-sm">Feature</th>
                  <th className="text-center px-4 py-4 text-white font-semibold">Basic<div className="text-xs font-normal text-gray-400">₹1,499</div></th>
                  <th className="text-center px-4 py-4 font-bold bg-indigo-900/50">
                    <span className="text-indigo-300">Growth</span>
                    <div className="text-xs font-normal text-indigo-400">₹2,499</div>
                  </th>
                  <th className="text-center px-4 py-4 text-white font-semibold">Pro<div className="text-xs font-normal text-gray-400">₹3,999</div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { feature: 'Lead Management & CRM', basic: true, growth: true, pro: true },
                  { feature: 'Package Management', basic: true, growth: true, pro: true },
                  { feature: 'Meta Ads Lead Capture', basic: true, growth: true, pro: true },
                  { feature: 'Analytics Dashboard', basic: true, growth: true, pro: true },
                  { feature: 'Booking Management', basic: false, growth: true, pro: true },
                  { feature: 'Campaign Page', basic: false, growth: true, pro: true },
                  { feature: 'WhatsApp Integration', basic: false, growth: true, pro: true },
                  { feature: 'Custom Landing Page', basic: false, growth: false, pro: true },
                  { feature: 'Website Builder (13 sections)', basic: false, growth: false, pro: true },
                  { feature: 'SEO-Ready Website', basic: false, growth: false, pro: true },
                  { feature: 'Free Setup (worth ₹5,000)', basic: false, growth: false, pro: true },
                  { feature: 'Team agents', basic: 'Up to 5', growth: 'Up to 10', pro: 'Up to 20' },
                  { feature: 'GST Invoice', basic: true, growth: true, pro: true },
                ].map((row) => (
                  <tr key={row.feature} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">{row.feature}</td>
                    {(['basic', 'growth', 'pro'] as const).map((col) => {
                      const val = row[col];
                      return (
                        <td key={col} className={`px-4 py-3.5 text-center ${col === 'growth' ? 'bg-indigo-50/40' : ''}`}>
                          {val === true ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 rounded-full mx-auto">
                              <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          ) : val === false ? (
                            <XIcon />
                          ) : (
                            <span className={`text-xs font-semibold ${col === 'growth' ? 'text-indigo-600' : 'text-gray-600'}`}>{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-3">
              Customer Stories
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
              Travel agencies across India love Yatrik
            </h2>
            <div className="flex items-center justify-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} />)}
              <span className="ml-2 text-sm font-semibold text-gray-700">4.9/5</span>
              <span className="text-gray-400 text-sm ml-1">· 120+ reviews</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} />)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5 flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-gray-400 text-xs">{t.role} · {t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-3">
              FAQ
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently asked questions</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={faq.q} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT / CTA ── */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500 opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500 opacity-10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Limited free setup slots available
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-tight">
            Ready to grow your travel agency?
          </h2>
          <p className="text-white/60 text-base sm:text-lg mb-10 max-w-2xl mx-auto">
            Join 500+ travel agencies across India. Start free with a 7-day trial. Or chat with Om directly on WhatsApp to find the right plan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-2xl shadow-indigo-900/50 hover:-translate-y-0.5"
            >
              Start Free Trial
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-green-500 hover:bg-green-400 text-white font-bold text-base px-8 py-4 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.12 1.523 5.854L0 24l6.336-1.499A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.002-1.369l-.36-.213-3.722.88.937-3.625-.235-.372A9.792 9.792 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
              </svg>
              WhatsApp Om — 7609098787
            </a>
          </div>
          <p className="text-white/30 text-xs mt-6">
            No credit card · 7-day free trial · Free setup · Cancel anytime · GST invoice
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">Y</span>
                </div>
                <span className="text-xl font-bold text-white">Yatrik</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-4">
                The all-in-one CRM for Indian travel agencies. Leads, packages, bookings, campaigns & website — in one place.
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.12 1.523 5.854L0 24l6.336-1.499A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.002-1.369l-.36-.213-3.722.88.937-3.625-.235-.372A9.792 9.792 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                </svg>
                +91 7609098787
              </a>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                {['Lead Management', 'Booking Management', 'Campaign Page', 'Website Builder', 'WhatsApp Integration', 'Analytics'].map((l) => (
                  <li key={l}><a href="#features" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Plans</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { label: 'Basic CRM — ₹1,499', href: '#pricing' },
                  { label: 'Growth — ₹2,499', href: '#pricing' },
                  { label: 'Pro — ₹3,999', href: '#pricing' },
                  { label: 'Compare Plans', href: '#pricing' },
                  { label: 'FAQ', href: '#faq' },
                ].map((l) => (
                  <li key={l.label}><a href={l.href} className="hover:text-white transition-colors">{l.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Yatrik. All rights reserved. Made with ❤️ in India.</p>
            <p>Travel Agency CRM Software for India · Delhi · Mumbai · Bangalore · Jaipur</p>
          </div>
        </div>
      </footer>

      {/* ── WHATSAPP FLOATING BUTTON ── */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold text-sm px-4 py-3 rounded-full shadow-2xl shadow-green-500/40 transition-all hover:-translate-y-1 hover:shadow-green-500/60"
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.12 1.523 5.854L0 24l6.336-1.499A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.002-1.369l-.36-.213-3.722.88.937-3.625-.235-.372A9.792 9.792 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
        </svg>
        <span className="hidden sm:inline">Chat on WhatsApp</span>
        <span className="sm:hidden">Chat</span>
      </a>
    </div>
  );
}

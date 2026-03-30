'use client';

import Link from 'next/link';

const features = [
  {
    icon: '🎯',
    title: 'Lead Management',
    desc: 'Capture leads from Meta Ads, WhatsApp, and your website automatically. Track every enquiry from first contact to confirmed booking — zero leads slip through the cracks.',
    highlight: 'Auto-capture from Meta Ads',
  },
  {
    icon: '📦',
    title: 'Package Management',
    desc: 'Create stunning travel packages with multi-image galleries, detailed itineraries, and pricing. Publish to your website instantly — no developer needed.',
    highlight: 'Multi-image galleries included',
  },
  {
    icon: '📅',
    title: 'Booking Management',
    desc: 'Manage all your bookings in one place. Track payment status, passenger details, travel dates, and send confirmation emails effortlessly.',
    highlight: 'Full payment tracking',
  },
  {
    icon: '🌐',
    title: 'Website Builder',
    desc: 'Get a professional travel agency website in minutes — no coding needed. Customize hero, gallery, testimonials, contact form, and go live instantly.',
    highlight: '13 customizable sections',
  },
  {
    icon: '👥',
    title: 'Team Management',
    desc: 'Invite agents, assign leads, and track team performance. Role-based access keeps your data secure while your team collaborates seamlessly.',
    highlight: 'Up to 20 agents',
  },
  {
    icon: '📊',
    title: 'Analytics & Reports',
    desc: 'Know your numbers. Track conversion rates, top-performing packages, monthly bookings, and revenue — all in a clean real-time dashboard.',
    highlight: 'Real-time revenue tracking',
  },
];

const steps = [
  {
    step: '01',
    title: 'Sign Up Free',
    desc: 'Create your account in 60 seconds. No credit card required. Get 1 full month to explore every feature — unlimited leads, packages, bookings, everything.',
  },
  {
    step: '02',
    title: 'We Set You Up',
    desc: 'Our India-based team handles the complete initial setup for you — free. We import your existing leads, configure your branding, and launch your travel website in 24 hours.',
  },
  {
    step: '03',
    title: 'Start Closing More Bookings',
    desc: "Manage leads, run your website, track bookings, and watch your revenue grow. Upgrade to ₹1,000/month only when you're ready.",
  },
];

const faqs = [
  {
    q: 'Is there a free trial for Yatrik?',
    a: 'Yes! You get 1 full month free — all features, no restrictions. No credit card needed to start.',
  },
  {
    q: 'How much does Yatrik cost after the trial?',
    a: 'Just ₹1,000 per month. That includes unlimited leads, packages, bookings, your travel website, team access, and priority Indian support.',
  },
  {
    q: 'What does "free initial setup" include?',
    a: 'Our team will import your existing leads/data, set up your branding, configure your travel website, and do a live onboarding call — all at no extra cost. Estimated value: ₹5,000.',
  },
  {
    q: 'Is Yatrik better than Travefy or Sembark for India?',
    a: 'Yatrik is built specifically for Indian travel agencies. Travefy is US-based (~₹4,000/month, no India-specific support, no INR pricing). Sembark has opaque custom pricing. Yatrik gives you more features at ₹1,000/month with an Indian support team that understands your business.',
  },
  {
    q: 'Does Yatrik integrate with Meta (Facebook/Instagram) Ads?',
    a: 'Yes. Leads from your Meta Ads campaigns are automatically captured into Yatrik so you never miss a hot enquiry.',
  },
  {
    q: 'Can I build my travel agency website with Yatrik?',
    a: 'Absolutely. The built-in website builder gives you a fully branded, SEO-ready travel website — with packages, gallery, testimonials, contact form, and Google Maps — live in minutes.',
  },
  {
    q: 'How is Yatrik different from generic CRMs like Zoho or Salesforce?',
    a: "Yatrik is built exclusively for travel agencies. It speaks your language — packages, itineraries, enquiries, bookings, and WhatsApp. Generic CRMs make you adapt to them; Yatrik works out of the box for a travel business.",
  },
  {
    q: 'Is it suitable for small travel agencies or solo agents?',
    a: "Perfectly suited. Whether you're a solo travel agent or a team of 20+, Yatrik scales with you. Start free, upgrade when you're ready.",
  },
];

const targetUsers = [
  {
    icon: '✈️',
    title: 'Travel Agencies',
    desc: 'Small to mid-sized travel agencies tired of managing leads on WhatsApp and Excel. Get a system that actually tracks every enquiry.',
    cities: 'Delhi · Mumbai · Bangalore · Jaipur',
  },
  {
    icon: '🗺️',
    title: 'Tour Operators & DMCs',
    desc: 'Destination Management Companies handling custom packages. Manage supplier coordination, bookings, and client communication in one place.',
    cities: 'Goa · Kerala · Rajasthan · Himachal',
  },
  {
    icon: '🧳',
    title: 'Solo Travel Agents',
    desc: 'Independent travel consultants who need a professional website + CRM without paying enterprise prices. Get both for ₹1,000/month.',
    cities: 'Work from anywhere in India',
  },
];

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const GreenCheck = () => (
  <span className="inline-flex items-center justify-center w-7 h-7 bg-green-100 rounded-full">
    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  </span>
);

const GrayCheck = () => (
  <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 rounded-full">
    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  </span>
);

const RedX = () => (
  <span className="inline-flex items-center justify-center w-7 h-7 bg-red-50 rounded-full">
    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  </span>
);

const compareRows = [
  { feature: 'Built for travel agencies', yatrik: true, travefy: true, sembark: true, zoho: false },
  { feature: 'India-first design & support', yatrik: true, travefy: false, sembark: true, zoho: false },
  { feature: 'Website builder included', yatrik: true, travefy: true, sembark: false, zoho: false },
  { feature: 'Meta Ads lead auto-capture', yatrik: true, travefy: false, sembark: false, zoho: 'Add-on' },
  { feature: 'WhatsApp integration', yatrik: true, travefy: false, sembark: false, zoho: 'Paid extra' },
  { feature: 'Package management', yatrik: true, travefy: true, sembark: true, zoho: false },
  { feature: 'GST invoice', yatrik: true, travefy: false, sembark: true, zoho: true },
  { feature: 'Transparent pricing', yatrik: true, travefy: true, sembark: false, zoho: true },
  { feature: 'Free setup included', yatrik: true, travefy: false, sembark: false, zoho: false },
  { feature: '1 month free trial', yatrik: true, travefy: '10 days only', sembark: false, zoho: '15 days only' },
];

export default function MarketingPageContent() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── ANNOUNCEMENT BAR ── */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-center text-sm py-2.5 px-4">
        <span className="font-semibold">Limited Offer:</span> 1 month free + free setup worth ₹5,000 — no credit card needed.{' '}
        <a href="#pricing" className="underline font-semibold hover:no-underline">Claim now →</a>
      </div>

      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Yatrik</span>
            <span className="hidden sm:inline-flex ml-2 text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
              Travel Agency CRM
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600 font-medium">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#who-its-for" className="hover:text-indigo-600 transition-colors">Who It&apos;s For</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#compare" className="hover:text-indigo-600 transition-colors">Compare</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline-flex text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              Start Free Trial
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-100 opacity-60 blur-3xl" />
          <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-violet-100 opacity-50 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Built for Indian Travel Agencies
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            Stop Losing Leads.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Start Closing Bookings.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 leading-relaxed mb-4">
            Yatrik is the all-in-one travel agency CRM built for India — manage{' '}
            <strong>leads, packages, bookings, team, and your website</strong> from one beautiful dashboard.
          </p>
          <p className="max-w-xl mx-auto text-base text-gray-500 mb-8">
            Trusted by travel agencies across Delhi, Mumbai, Bangalore, Jaipur, Goa &amp; beyond.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5"
            >
              Start Free — No Card Needed
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold text-base px-8 py-4 rounded-xl hover:bg-gray-50 transition-all"
            >
              See All Features
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-500">
            {['1 Month Free Trial', 'Free Initial Setup', 'No Credit Card', 'Cancel Anytime', 'Indian Support Team', 'GST Invoice'].map((b) => (
              <div key={b} className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── PROBLEM SECTION ── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            You&apos;re losing bookings every single day — and you know it.
          </h2>
          <p className="text-gray-500 text-lg mb-12">
            Most travel agents in India still run their business on WhatsApp, Excel, and gut feeling. Here&apos;s the real cost:
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              { pain: 'Leads from Meta Ads vanish with no system to track or follow up', emoji: '😤' },
              { pain: "Clients ask about packages and you scramble to send PDFs on WhatsApp", emoji: '😰' },
              { pain: "Your team has no idea who's following up on which lead", emoji: '😵' },
              { pain: 'Competitors with a professional website win clients you should have had', emoji: '😞' },
              { pain: 'Booking details are scattered across emails, chats, and notebooks', emoji: '📒' },
              { pain: 'No idea which packages or campaigns are actually making you money', emoji: '🤷' },
            ].map((item) => (
              <div key={item.pain} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                <p className="text-gray-700 text-sm font-medium leading-snug">{item.pain}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-lg font-semibold text-indigo-900">
              There&apos;s a better way. Yatrik was built specifically to solve every one of these problems — for Indian travel agencies.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-16 sm:py-24 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3">
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything your travel agency needs — in one place
            </h2>
            <p className="max-w-2xl mx-auto text-gray-500 text-lg">
              Unlike generic CRMs, every Yatrik feature is designed around how Indian travel agencies actually work.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:bg-indigo-100 transition-colors">
                  {f.icon}
                </div>
                <div className="inline-flex text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-3">
                  {f.highlight}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section id="who-its-for" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3">
              Who It&apos;s For
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built for every type of travel business in India
            </h2>
            <p className="max-w-2xl mx-auto text-gray-500 text-lg">
              Whether you run a solo practice or manage a team of 20 agents, Yatrik fits your workflow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {targetUsers.map((u) => (
              <div key={u.title} className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 p-8 text-center hover:shadow-md transition-all">
                <div className="text-5xl mb-4">{u.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{u.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{u.desc}</p>
                <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full inline-block">
                  {u.cities}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3">
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              From signup to your first booking in 24 hours
            </h2>
            <p className="max-w-xl mx-auto text-gray-500 text-lg">
              We handle the setup so you can focus on selling.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-indigo-200 to-indigo-100" />
                )}
                <div className="relative bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-5 shadow-lg shadow-indigo-200">
                    {s.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3">
              Customer Stories
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Travel agencies across India love Yatrik
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'Before Yatrik, we were losing at least 30% of our Meta Ads leads because there was no system. Now every lead is tracked and followed up automatically. Our conversion rate has doubled in 3 months.',
                name: 'Rajesh Sharma',
                role: 'Owner, Sharma Travels',
                city: 'Delhi',
                rating: 5,
              },
              {
                quote: 'The website builder alone is worth 10x the price. We had a professional travel website live in under an hour. Clients trust us more and we now get direct enquiries from Google.',
                name: 'Priya Mehta',
                role: 'Founder, Dream Voyages',
                city: 'Mumbai',
                rating: 5,
              },
              {
                quote: "We have a team of 8 agents. Managing who follows up on what was a nightmare. Yatrik solved that completely — and their setup team handled everything. I didn't have to lift a finger.",
                name: 'Arjun Nair',
                role: 'Director, Horizon Travel',
                city: 'Bangalore',
                rating: 5,
              },
            ].map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-7 border border-gray-100">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
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

      {/* ── PRICING ── */}
      <section id="pricing" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3">
              Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, honest pricing. No surprises.
            </h2>
            <p className="max-w-xl mx-auto text-gray-500 text-lg">
              One plan. All features. Built for Indian travel agencies.
            </p>
          </div>
          <div className="max-w-lg mx-auto">
            <div className="relative bg-gradient-to-b from-indigo-600 to-violet-700 rounded-3xl p-8 sm:p-10 text-white shadow-2xl shadow-indigo-200">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full shadow whitespace-nowrap">
                BEST VALUE — ALL FEATURES INCLUDED
              </div>
              <div className="text-center mb-8">
                <div className="text-lg font-semibold text-indigo-200 mb-2">Travel Agency Pro</div>
                <div className="flex items-end justify-center gap-1 mb-3">
                  <span className="text-3xl font-bold text-indigo-200">₹</span>
                  <span className="text-6xl font-extrabold">1,000</span>
                  <span className="text-indigo-300 mb-2">/month</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  First month FREE + Free Setup (worth ₹5,000)
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited Leads & Enquiries',
                  'Unlimited Packages & Bookings',
                  'Custom Travel Website Builder',
                  'Meta Ads Lead Auto-Capture',
                  'WhatsApp Integration',
                  'Team Management (up to 20 agents)',
                  'Analytics & Revenue Reports',
                  'Free Initial Setup (worth ₹5,000)',
                  'Priority Indian Support',
                  'GST Invoice Provided',
                  'Cancel Anytime',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <CheckIcon />
                    <span className="text-indigo-100">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block w-full bg-white text-indigo-700 font-bold text-base text-center py-4 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
              >
                Start Free — No Credit Card Needed
              </Link>
              <p className="text-center text-indigo-300 text-xs mt-4">
                After 1 month free trial, ₹1,000/month. Cancel anytime.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              {['Secure Payments', 'Indian GST Invoice', 'Annual discount available'].map((b) => (
                <div key={b} className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VS NAMED COMPETITORS ── */}
      <section id="compare" className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3">
              Compare
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Yatrik vs the alternatives
            </h2>
            <p className="text-gray-500 text-lg">Why pay more for software not built for India?</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-5 py-4 font-semibold">Feature</th>
                  <th className="text-center px-5 py-4 font-bold text-indigo-300 bg-indigo-900/30">
                    Yatrik<div className="text-xs font-normal text-indigo-400">₹1,000/mo</div>
                  </th>
                  <th className="text-center px-5 py-4 font-medium text-gray-400">
                    Travefy<div className="text-xs text-gray-500">~₹4,000/mo</div>
                  </th>
                  <th className="text-center px-5 py-4 font-medium text-gray-400">
                    Sembark<div className="text-xs text-gray-500">Custom pricing</div>
                  </th>
                  <th className="text-center px-5 py-4 font-medium text-gray-400">
                    Zoho CRM<div className="text-xs text-gray-500">~₹1,500+/mo</div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {compareRows.map((row) => (
                  <tr key={row.feature} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">{row.feature}</td>
                    {(['yatrik', 'travefy', 'sembark', 'zoho'] as const).map((col) => {
                      const val = row[col];
                      return (
                        <td key={col} className={`px-5 py-3.5 text-center ${col === 'yatrik' ? 'bg-indigo-50/40' : ''}`}>
                          {val === true ? (
                            col === 'yatrik' ? <GreenCheck /> : <GrayCheck />
                          ) : val === false ? (
                            <RedX />
                          ) : (
                            <span className={`text-xs font-medium ${col === 'yatrik' ? 'text-indigo-600' : 'text-gray-500'}`}>{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            Pricing data as of March 2026. Travefy at $49/mo converted at ~₹82. Sembark pricing requires sales contact.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3">
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group border border-gray-200 rounded-xl overflow-hidden bg-white">
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                  <span className="font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Limited slots for free setup — claim yours today
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
            Ready to grow your travel agency?
          </h2>
          <p className="text-indigo-200 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
            Join travel agencies across India already using Yatrik. Start completely free — your first month is on us, and our team sets everything up for you.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold text-lg px-10 py-4 rounded-xl hover:bg-indigo-50 transition-all shadow-2xl hover:-translate-y-0.5"
          >
            Start Free Trial
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="text-indigo-300 text-sm mt-5">
            No credit card required · 1 month free trial · Free setup · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-400 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">T</span>
                </div>
                <span className="text-xl font-bold text-white">Yatrik</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-4">
                The all-in-one CRM software built for Indian travel agencies. Manage leads, packages, bookings, team, and your website — in one place.
              </p>
              <p className="text-xs text-gray-600">
                Serving travel agencies across Delhi, Mumbai, Bangalore, Jaipur, Goa, Kerala, Rajasthan &amp; beyond.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                {['Lead Management', 'Package Management', 'Booking Management', 'Website Builder', 'Team Management', 'Analytics'].map((l) => (
                  <li key={l}><a href="#features" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm">
                {['Pricing', 'Compare', 'FAQ', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map((l) => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Yatrik. All rights reserved. Made with ❤️ in India.</p>
            <p>The #1 Travel Agency CRM Software built for India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

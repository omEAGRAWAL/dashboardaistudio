import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Travel CRM Plans from ₹999/month',
  description:
    'Yatrik travel CRM pricing: Starter ₹999/month, Growth ₹2,499/month, Pro ₹4,999/month. All plans include a 15-day free trial. GST included. No setup fee.',
  alternates: { canonical: 'https://travelycrm.reviu.store/pricing' },
};

const plans = [
  {
    name: 'Starter',
    price: '₹999',
    period: '/month incl. GST',
    description: 'Perfect for solo travel agents and small agencies just getting started.',
    features: [
      'Up to 500 leads/month',
      '1 team member',
      'Meta Ads lead capture',
      'WhatsApp chatbot (500 messages/month)',
      'Agency website builder',
      '5 tour packages',
      'Email support',
    ],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '₹2,499',
    period: '/month incl. GST',
    description: 'For growing agencies managing multiple agents and higher lead volumes.',
    features: [
      'Up to 3,000 leads/month',
      '5 team members',
      'Meta Ads lead capture',
      'WhatsApp chatbot (3,000 messages/month)',
      'Agency website builder',
      'Unlimited tour packages',
      'Campaign manager',
      'Priority support',
    ],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '₹4,999',
    period: '/month incl. GST',
    description: 'For established agencies that need unlimited scale and advanced automation.',
    features: [
      'Unlimited leads',
      'Unlimited team members',
      'Meta Ads lead capture',
      'WhatsApp chatbot (unlimited)',
      'Agency website builder',
      'Unlimited tour packages',
      'Campaign manager',
      'Custom domain support',
      'Dedicated onboarding call',
    ],
    cta: 'Start free trial',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing for Travel Agencies
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          All plans include a 15-day free trial. No credit card required.
        </p>
        <p className="text-sm text-gray-400 mb-16">All prices inclusive of GST.</p>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 text-left border ${
                plan.highlight
                  ? 'border-blue-500 shadow-lg ring-2 ring-blue-500'
                  : 'border-gray-200 shadow-sm'
              }`}
            >
              {plan.highlight && (
                <span className="inline-block bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  Most Popular
                </span>
              )}
              <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
              <p className="text-gray-500 mt-1 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                <span className="text-gray-500 text-sm ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-gray-700 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/login"
                className={`block text-center py-3 px-6 rounded-xl font-semibold transition ${
                  plan.highlight
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

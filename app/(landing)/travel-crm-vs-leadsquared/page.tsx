import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yatrik vs LeadSquared — Travel CRM Comparison 2026',
  description:
    'Comparing Yatrik and LeadSquared for Indian travel agencies. Feature breakdown, pricing, and which CRM wins for travel lead management and WhatsApp automation.',
  alternates: { canonical: 'https://travelycrm.reviu.store/travel-crm-vs-leadsquared' },
};

const rows = [
  { feature: 'Pricing (starts at)', yatrik: '₹999/month', leadsquared: '₹2,500+/month' },
  { feature: 'Built for travel agencies', yatrik: '✓ Yes', leadsquared: '✗ Generic CRM' },
  { feature: 'Tour package management', yatrik: '✓ Built-in', leadsquared: '✗ Custom build' },
  { feature: 'WhatsApp chatbot', yatrik: '✓ Built-in', leadsquared: '✗ Third-party only' },
  { feature: 'Agency website builder', yatrik: '✓ Built-in', leadsquared: '✗ Not included' },
  { feature: 'Meta Ads lead capture', yatrik: '✓ Real-time webhook', leadsquared: '✓ Available' },
  { feature: 'Setup time', yatrik: '< 1 hour', leadsquared: '2–4 weeks + consultant' },
  { feature: 'Free trial', yatrik: '15 days, no card', leadsquared: 'Demo call required' },
  { feature: 'India GST invoice', yatrik: '✓ Yes', leadsquared: '✓ Yes' },
  { feature: 'Customer support', yatrik: 'WhatsApp + email', leadsquared: 'Email + ticketing' },
];

export default function VsLeadSquaredPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Yatrik vs LeadSquared: Which CRM Is Right for Your Travel Agency?
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl">
          LeadSquared is a powerful general-purpose CRM. Yatrik is built from the ground up for
          travel agencies. Here&apos;s an honest comparison for Indian travel businesses in 2026.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm mb-16">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Feature</th>
                <th className="text-left px-6 py-4 font-semibold text-blue-600">Yatrik</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500">LeadSquared</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-gray-700">{row.feature}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{row.yatrik}</td>
                  <td className="px-6 py-4 text-gray-500">{row.leadsquared}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-blue-50 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Choose Yatrik if…</h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ You run a travel agency or are a tour operator</li>
              <li>✓ You want to go live in under an hour</li>
              <li>✓ You need WhatsApp automation without extra tools</li>
              <li>✓ Budget matters — you want the best value for money</li>
              <li>✓ You want a website builder included</li>
            </ul>
          </div>
          <div className="bg-gray-50 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Choose LeadSquared if…</h2>
            <ul className="space-y-2 text-gray-700">
              <li>→ You run a large enterprise with 50+ salespeople</li>
              <li>→ You need deep ERP or custom API integrations</li>
              <li>→ You have a dedicated CRM admin and IT team</li>
              <li>→ Your business spans multiple verticals beyond travel</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Most Indian travel agencies switch to Yatrik within the 15-day trial.
          </p>
          <a
            href="/login"
            className="inline-block bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl hover:bg-blue-600 transition"
          >
            Try Yatrik free for 15 days →
          </a>
        </div>
      </section>
    </main>
  );
}

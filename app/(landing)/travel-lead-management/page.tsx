import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Travel Lead Management Software for Indian Agencies',
  description:
    'Capture, track, and convert every travel lead with Yatrik. Real-time Meta Ads integration, WhatsApp inbox, pipeline stages, and agent assignment — all in one CRM.',
  alternates: { canonical: 'https://travelycrm.reviu.store/travel-lead-management' },
};

const stages = [
  { name: 'New Enquiry', color: 'bg-gray-200', description: 'Auto-captured from Meta Ads, WhatsApp, or manual entry.' },
  { name: 'Contacted', color: 'bg-blue-200', description: 'Agent has reached out. First touchpoint logged.' },
  { name: 'Qualified', color: 'bg-yellow-200', description: 'Destination, dates, and budget confirmed.' },
  { name: 'Proposal Sent', color: 'bg-orange-200', description: 'Package itinerary and price shared with customer.' },
  { name: 'Negotiation', color: 'bg-purple-200', description: 'Customer is considering. Follow-up scheduled.' },
  { name: 'Booked', color: 'bg-green-200', description: 'Payment received. Booking created in CRM.' },
  { name: 'Lost', color: 'bg-red-200', description: 'Lead went cold or chose a competitor. Reason logged.' },
];

const sources = [
  { source: 'Facebook / Instagram Lead Ads', method: 'Real-time webhook — zero manual work' },
  { source: 'WhatsApp inbound', method: 'Chatbot auto-creates lead after flow completion' },
  { source: 'Agency website contact form', method: 'Form submission → CRM in seconds' },
  { source: 'Walk-in / phone call', method: 'Manual entry with full profile' },
  { source: 'Google Ads call extension', method: 'Manual entry or third-party webhook' },
  { source: 'Referral', method: 'Manual entry with referrer tag' },
];

export default function TravelLeadManagementPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Travel Lead Management — From First Enquiry to Confirmed Booking
        </h1>
        <p className="text-xl text-gray-600 mb-16 max-w-2xl">
          Yatrik captures leads from every channel your Indian travel agency uses — Meta Ads,
          WhatsApp, website forms, walk-ins — and gives you a single pipeline to convert them.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Pipeline stages</h2>
        <p className="text-gray-600 mb-8">
          Every lead in Yatrik moves through a customizable pipeline. You see exactly where every
          deal stands at a glance.
        </p>
        <div className="flex flex-wrap gap-3 mb-16">
          {stages.map((s) => (
            <div key={s.name} className="flex-1 min-w-48 rounded-xl p-5 border border-gray-100">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-gray-700 mb-3 ${s.color}`}>
                {s.name}
              </span>
              <p className="text-gray-600 text-sm">{s.description}</p>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Lead sources we capture</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm mb-16">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Source</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">How it gets into Yatrik</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((row, i) => (
                <tr key={row.source} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 font-medium text-gray-900">{row.source}</td>
                  <td className="px-6 py-4 text-gray-600">{row.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16 text-center">
          {[
            { stat: '< 5 sec', label: 'Lead capture from Meta Ads to CRM' },
            { stat: '34%', label: 'Average conversion lift in 90 days' },
            { stat: '0', label: 'Leads lost to manual copy-paste errors' },
          ].map((item) => (
            <div key={item.label} className="bg-blue-50 rounded-2xl p-8">
              <p className="text-4xl font-extrabold text-blue-600 mb-2">{item.stat}</p>
              <p className="text-gray-600 text-sm">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="/login"
            className="inline-block bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl hover:bg-blue-600 transition"
          >
            Start managing leads better — free for 15 days →
          </a>
        </div>
      </section>
    </main>
  );
}

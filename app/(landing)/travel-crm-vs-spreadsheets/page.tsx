import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Travel CRM vs Spreadsheets — Why Excel Is Costing You Bookings',
  description:
    'Still managing travel leads in Excel or Google Sheets? See exactly how spreadsheets lose you leads and how Yatrik travel CRM fixes it — with real numbers.',
  alternates: { canonical: 'https://travelycrm.reviu.store/travel-crm-vs-spreadsheets' },
};

const problems = [
  {
    problem: 'Leads fall through the cracks',
    spreadsheet: 'A lead enters the sheet but nobody notices. No alert, no follow-up reminder.',
    crm: 'Every new lead triggers an instant notification. Assign it to an agent in one click.',
  },
  {
    problem: 'No pipeline visibility',
    spreadsheet: 'You scroll through hundreds of rows trying to figure out who is hot right now.',
    crm: 'Kanban view shows every deal by stage. Filter by agent, date, or status instantly.',
  },
  {
    problem: 'Multiple agents = chaos',
    spreadsheet: 'Two agents edit the same row. Version conflicts, overwritten data, finger-pointing.',
    crm: 'Role-based access. Each agent sees their own leads. One source of truth.',
  },
  {
    problem: 'WhatsApp is disconnected',
    spreadsheet: 'You switch between the sheet and WhatsApp constantly. No log of what was said.',
    crm: 'WhatsApp inbox is inside the CRM. Full conversation history attached to each lead.',
  },
  {
    problem: 'Meta Ads leads need manual copy-paste',
    spreadsheet: 'Download CSV from Meta, paste into sheet, fix formatting. Every. Single. Day.',
    crm: 'Webhook captures leads in real time the moment someone fills your ad form.',
  },
  {
    problem: 'Zero revenue reporting',
    spreadsheet: 'You calculate revenue by SUM-ing a column and hoping nobody deleted a row.',
    crm: 'Live dashboard: total pipeline value, conversion rate, revenue this month.',
  },
];

export default function VsSpreadsheetPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Why Your Travel Agency Spreadsheet Is Losing You Bookings
        </h1>
        <p className="text-xl text-gray-600 mb-4 max-w-2xl">
          Excel and Google Sheets were built for data, not for sales. Every travel agency that
          switches from spreadsheets to Yatrik reports the same thing: they stop losing leads.
        </p>
        <p className="text-sm text-gray-400 mb-16">
          On average, agencies that switch to Yatrik see a 34% increase in lead-to-booking
          conversion in the first 90 days.
        </p>

        <div className="space-y-8 mb-16">
          {problems.map((item) => (
            <div key={item.problem} className="border border-gray-100 rounded-2xl p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{item.problem}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-red-50 rounded-xl p-5">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">
                    Spreadsheet
                  </p>
                  <p className="text-gray-700 text-sm">{item.spreadsheet}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-5">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">
                    Yatrik CRM
                  </p>
                  <p className="text-gray-700 text-sm">{item.crm}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-500 rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to ditch the spreadsheet?</h2>
          <p className="mb-6 opacity-90">
            Set up Yatrik in under an hour. Your leads, bookings, and WhatsApp — all in one place.
          </p>
          <a
            href="/login"
            className="inline-block bg-white text-blue-600 font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition"
          >
            Start your 15-day free trial →
          </a>
        </div>
      </section>
    </main>
  );
}

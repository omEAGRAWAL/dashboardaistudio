import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WhatsApp Chatbot for Travel Agencies — Automate Lead Qualification',
  description:
    'Set up a WhatsApp chatbot for your travel agency with Yatrik. Auto-qualify leads, answer FAQs, and create CRM entries — 24/7, without lifting a finger.',
  alternates: { canonical: 'https://travelycrm.reviu.store/whatsapp-bot-travel-agency' },
};

const steps = [
  {
    step: '1',
    title: 'Customer messages your WhatsApp number',
    body: 'Your agency gets a dedicated WhatsApp business number. When anyone messages it, the Yatrik bot wakes up instantly.',
  },
  {
    step: '2',
    title: 'Bot sends your greeting + qualification questions',
    body: 'You configure the greeting and a set of Q&A questions in the Yatrik chatbot builder — no code. Typical questions: destination, travel dates, number of travellers, budget.',
  },
  {
    step: '3',
    title: 'Answers are collected automatically',
    body: 'The bot supports free-text and multiple-choice answers. It guides the customer through the flow at their own pace — even if they reply hours later.',
  },
  {
    step: '4',
    title: 'A qualified lead is created in your CRM',
    body: 'Once the customer completes the flow, Yatrik auto-creates a lead with all their answers attached. Your agent picks it up as a warm, qualified lead — not a cold enquiry.',
  },
  {
    step: '5',
    title: 'Switch to manual chat any time',
    body: 'Open the WhatsApp inbox in Yatrik, see the full conversation history, and take over the chat to close the booking.',
  },
];

const useCases = [
  'Qualify inbound leads from Instagram bio links at 2 AM',
  'Handle the "how much does Goa trip cost?" flood during sale season',
  'Capture destination, dates, and budget before your first call',
  'Send package brochures automatically based on destination choice',
  'Follow up with leads who ghosted after the first message',
];

export default function WhatsAppBotPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          WhatsApp Chatbot for Travel Agencies — Qualify Leads While You Sleep
        </h1>
        <p className="text-xl text-gray-600 mb-16 max-w-2xl">
          Yatrik gives every travel agency a dedicated WhatsApp business number with a built-in
          chatbot. Set up your qualification flow once. Let it run 24/7.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-8">How it works</h2>
        <div className="space-y-6 mb-20">
          {steps.map((s) => (
            <div key={s.step} className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                {s.step}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-gray-600">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          What travel agencies use it for
        </h2>
        <ul className="space-y-3 mb-16">
          {useCases.map((uc) => (
            <li key={uc} className="flex items-start gap-3 text-gray-700">
              <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
              {uc}
            </li>
          ))}
        </ul>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Get your travel agency WhatsApp bot live today
          </h2>
          <p className="text-gray-600 mb-6">
            Included in every Yatrik plan. Set up in under 30 minutes.
          </p>
          <a
            href="/login"
            className="inline-block bg-green-500 text-white font-semibold px-8 py-4 rounded-xl hover:bg-green-600 transition"
          >
            Start free trial →
          </a>
        </div>
      </section>
    </main>
  );
}

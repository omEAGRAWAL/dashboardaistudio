export interface PlatformBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  content: string[];
}

export const platformBlogPosts: PlatformBlogPost[] = [
  {
    slug: 'travel-crm-vs-spreadsheets',
    title: 'Why Spreadsheets Are Killing Your Travel Agency (And What to Use Instead)',
    excerpt:
      "If you're managing travel leads in Excel or Google Sheets, you're losing bookings every day. Here's why, and how to fix it.",
    date: '2026-04-10',
    readTime: '5 min read',
    category: 'Lead Management',
    content: [
      'Spreadsheets feel simple until your lead volume grows. One missed follow-up, one duplicate row, or one unassigned enquiry can turn into a lost booking.',
      'Travel sales depends on speed and context. A CRM keeps source, destination, budget, travel dates, status, follow-ups, and customer conversations in one place.',
      'Start by moving new enquiries into a shared pipeline, assigning every lead to an owner, and creating reminders for the next action. Your team should be able to answer: who owns this lead, what did the customer ask for, and what happens next?',
      'Once your pipeline is structured, you can see which sources convert, which packages are popular, and which agents need help. That visibility is what spreadsheets usually hide.',
    ],
  },
  {
    slug: 'whatsapp-bot-travel-agency',
    title: 'How to Set Up a WhatsApp Chatbot for Your Travel Agency in 2026',
    excerpt:
      "A step-by-step guide to automating WhatsApp enquiries so your agency captures and qualifies leads 24/7, even when you're offline.",
    date: '2026-04-03',
    readTime: '7 min read',
    category: 'WhatsApp Automation',
    content: [
      'Most travel enquiries now start with a quick WhatsApp message. A chatbot helps you reply instantly, ask qualifying questions, and capture the details your sales team needs.',
      'Keep the first flow short: destination, travel month, number of travelers, budget range, departure city, and phone/email confirmation. Avoid long menus before you know intent.',
      'Route hot leads to a human quickly. If someone shares dates and budget, the bot should create a lead, tag the destination, and notify the right agent.',
      'Measure response rate, completion rate, and booking conversion. The goal is not to replace your team; it is to give them better conversations to continue.',
    ],
  },
  {
    slug: 'travel-lead-management',
    title: 'The Ultimate Guide to Travel Lead Management for Indian Agencies',
    excerpt:
      'From Meta Ads to WhatsApp to referrals, how to capture, track, and convert every travel enquiry into a confirmed booking.',
    date: '2026-03-27',
    readTime: '9 min read',
    category: 'Travel CRM',
    content: [
      'A good travel lead management process starts before the lead enters your CRM. Use clear campaign names, destination tags, and source tracking so every enquiry arrives with context.',
      'Create a small number of pipeline stages: New, Contacted, Proposal Sent, Follow-up, Won, and Lost. Too many stages slow the team down; too few hide what is really happening.',
      'Follow-up discipline matters. For high-intent leads, schedule the next touch before ending the current conversation. Use WhatsApp templates, call reminders, and notes to keep momentum.',
      'Review your data weekly: top lead sources, average response time, conversion by package, and reasons for lost deals. These numbers tell you where revenue is leaking.',
    ],
  },
  {
    slug: 'travel-crm-vs-leadsquared',
    title: 'Yatrik vs LeadSquared: Which CRM Is Right for Your Travel Agency?',
    excerpt:
      'An honest, feature-by-feature comparison of two CRM options for Indian travel agencies in 2026.',
    date: '2026-03-20',
    readTime: '6 min read',
    category: 'CRM Comparison',
    content: [
      'LeadSquared is a powerful general CRM, but many smaller and mid-size travel agencies need a system that already understands packages, bookings, WhatsApp conversations, and travel follow-ups.',
      'Yatrik focuses on travel-specific workflows: package pages, booking forms, agency websites, WhatsApp lead capture, campaign pages, and pipeline tracking.',
      'If your team needs enterprise customization across many departments, a broad CRM may make sense. If your priority is selling tours faster with less setup, a travel-focused CRM is usually easier to adopt.',
      'The best CRM is the one your agents actually use every day. Look for quick lead entry, clear reminders, simple package sharing, and reporting your owner can understand at a glance.',
    ],
  },
];

export function getPlatformBlogPost(slug: string) {
  return platformBlogPosts.find(post => post.slug === slug) || null;
}

import { Metadata } from 'next';

const PROJECT_ID = 'gen-lang-client-0949561148';
const DATABASE_ID = 'ai-studio-c83d2f1c-17a1-4b32-bdd1-af35d695e578';
const API_KEY = 'AIzaSyDV5CvifeD3tV4tkfKidYJHlVAYiS39GxM';

async function getWebsiteSettings(orgId: string) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/website_settings/${orgId}?key=${API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    const f = data.fields || {};
    const str = (key: string) => f[key]?.stringValue || '';
    return {
      agencyName: str('agencyName'),
      metaTitle: str('metaTitle'),
      metaDescription: str('metaDescription'),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ orgId: string }> }
): Promise<Metadata> {
  const { orgId } = await params;
  const s = await getWebsiteSettings(orgId);

  const title = s?.metaTitle || s?.agencyName || 'Travel Agency';
  const description = s?.metaDescription || 'Explore our travel packages and destinations.';

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

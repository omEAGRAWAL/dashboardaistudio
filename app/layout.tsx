import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/components/AuthProvider';
import { OrgProvider } from '@/components/OrgProvider';
import { SidebarProvider } from '@/components/SidebarContext';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'Travel Agency CRM',
  description: 'A CRM dashboard for travel agencies to manage leads from Meta Ads via Google Sheets.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Agent CRM',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <OrgProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </OrgProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

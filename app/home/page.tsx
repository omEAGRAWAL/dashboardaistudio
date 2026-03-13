'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { LeadTable } from '@/components/LeadTable';
import { ImportLeads } from '@/components/ImportLeads';
import { CreateLeadModal } from '@/components/CreateLeadModal';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, orgId, role, loading, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && !orgId && role !== 'superadmin') {
      router.push('/onboarding');
    }
  }, [user, orgId, role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user || (!orgId && role !== 'superadmin')) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Channel Leads</h1>
              <div className="flex items-center gap-3">
                <ImportLeads />
                <CreateLeadModal />
              </div>
            </div>
            <LeadTable />
          </div>
        </main>
      </div>
    </div>
  );
}

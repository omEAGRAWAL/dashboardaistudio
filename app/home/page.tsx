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
  const { user, orgId, role, status, loading, logOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && !orgId && role !== 'superadmin' && status !== 'suspended') {
      router.push('/onboarding');
    }
  }, [user, orgId, role, status, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a1 1 0 100-2 1 1 0 000 2zm6-6V9a6 6 0 10-12 0v2a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2zm-8-2V9a2 2 0 114 0v2H10z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Revoked</h2>
          <p className="text-gray-500 text-sm mb-6">Your access to this CRM has been revoked. Please contact your administrator if you believe this is a mistake.</p>
          <button
            onClick={logOut}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 md:mb-8">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Channel Leads</h1>
              <div className="flex items-center gap-2 md:gap-3">
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

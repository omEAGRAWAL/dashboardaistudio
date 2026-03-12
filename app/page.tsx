'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { LeadTable } from '@/components/LeadTable';
import { ImportLeads } from '@/components/ImportLeads';
import { CreateLeadModal } from '@/components/CreateLeadModal';
import { LogIn } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, orgId, role, loading, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !orgId && role !== 'superadmin') {
      router.push('/onboarding');
    }
  }, [user, orgId, role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-indigo-600 font-bold text-3xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Travlyy</h1>
          <p className="text-gray-500 mb-8">Sign in to manage your travel agency leads and boost your conversions.</p>
          <button 
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-sm"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (!orgId && role !== 'superadmin') {
    return null; // Will redirect in useEffect
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

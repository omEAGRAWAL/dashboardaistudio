'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, Loader2, FileText } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';

export default function TermsConditionsPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    getDoc(doc(db, 'website_settings', orgId))
      .then(snap => { if (snap.exists()) setSettings(snap.data()); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orgId]);

  const tc = settings?.themeColor || '#4f46e5';
  const agencyName = settings?.agencyName || 'Travel Agency';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: tc }} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100/80 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all group">
            <div className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center group-hover:border-gray-300 group-hover:shadow-sm transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium hidden sm:block">Back</span>
          </button>
          <div className="flex items-center gap-2.5 ml-1">
            {settings?.agencyLogo
              ? <img src={settings.agencyLogo} alt={agencyName} className="h-8 w-auto rounded-lg" />
              : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: tc }}>{agencyName.charAt(0)}</div>
            }
            <span className="font-bold text-gray-900 text-sm">{agencyName}</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${tc}ee 0%, ${tc} 60%, ${tc}bb 100%)` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-5 shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <p className="text-white/60 text-xs font-bold tracking-[0.35em] uppercase mb-2">Please Read Carefully</p>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Terms &amp; Conditions</h1>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 40" className="w-full fill-gray-50" preserveAspectRatio="none">
            <path d="M0,30 C360,0 1080,60 1440,20 L1440,40 L0,40 Z" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10">
          {settings?.pageTermsConditions ? (
            <div className="legal-content" dangerouslySetInnerHTML={{ __html: settings.pageTermsConditions }} />
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-semibold text-lg">Content coming soon</p>
              <p className="text-gray-300 text-sm mt-2">The agency will update this page shortly.</p>
            </div>
          )}
        </div>
      </main>

      <SiteFooter orgId={orgId} settings={settings} />

      <style jsx global>{`
        .legal-content { font-size: 1rem; line-height: 1.8; color: #374151; }
        .legal-content h1 { font-size: 1.875rem; font-weight: 800; color: #111827; margin: 2rem 0 1rem; }
        .legal-content h2 { font-size: 1.375rem; font-weight: 700; color: #1f2937; margin: 2rem 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #f3f4f6; }
        .legal-content h3 { font-size: 1.125rem; font-weight: 600; color: #374151; margin: 1.5rem 0 0.5rem; }
        .legal-content p { margin-bottom: 1.1rem; }
        .legal-content ul { list-style: none; padding-left: 0; margin-bottom: 1.1rem; }
        .legal-content ul li { position: relative; padding-left: 1.5rem; margin-bottom: 0.5rem; }
        .legal-content ul li::before { content: ''; position: absolute; left: 0; top: 0.65em; width: 6px; height: 6px; border-radius: 50%; background: ${tc}; }
        .legal-content strong { color: #111827; font-weight: 600; }
      `}</style>
    </div>
  );
}

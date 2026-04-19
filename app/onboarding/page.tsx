'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, setDoc, serverTimestamp, collection, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Building2, ArrowRight, Phone } from 'lucide-react';
import { Suspense } from 'react';

function OnboardingForm() {
  const { user, orgId, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orgName, setOrgName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pick up referral code from URL or sessionStorage
  const refCode = searchParams.get('ref') || '';
  useEffect(() => {
    if (refCode) sessionStorage.setItem('pendingReferralCode', refCode);
  }, [refCode]);

  useEffect(() => {
    if (!loading && !user) router.push('/');
    if (!loading && user && orgId) router.push('/');
  }, [user, orgId, loading, router]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !user) return;

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Create org
      const orgRef = doc(collection(db, 'organizations'));
      const orgData: any = {
        name: orgName.trim(),
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      };
      if (ownerPhone.trim()) orgData.ownerPhone = ownerPhone.trim();

      // Default free trial subscription (30 days from now)
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30);
      orgData.subscription = {
        planId: 'free_trial',
        status: 'trialing',
        trialStartedAt: serverTimestamp(),
        trialEndsAt: trialEnd,
      };

      await setDoc(orgRef, orgData);

      // 2. Update user
      await updateDoc(doc(db, 'users', user.uid), {
        orgId: orgRef.id,
        role: 'org_admin',
      });

      // 3. Track referral silently (don't block signup if it fails)
      const pendingCode = sessionStorage.getItem('pendingReferralCode');
      if (pendingCode) {
        try {
          await fetch('/api/referrals/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: pendingCode, newOrgId: orgRef.id }),
          });
          sessionStorage.removeItem('pendingReferralCode');
        } catch {
          // silent
        }
      }

      window.location.href = '/';
    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.message || 'Failed to create organization. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading || !user || orgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
          <Building2 className="w-8 h-8 text-indigo-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your Agency</h1>
        <p className="text-gray-500 mb-2 text-sm">
          Set up your organization to start managing leads and inviting your team.
        </p>
        <div className="mb-6 inline-flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1 text-xs text-green-700 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          30-day free trial · No credit card needed
        </div>

        {refCode && (
          <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 text-xs text-indigo-700">
            Referred by code <span className="font-mono font-bold">{refCode}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">{error}</div>
        )}

        <form onSubmit={handleCreateOrg} className="space-y-4">
          <div>
            <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1.5">
              Agency Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text" id="orgName" value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Travel"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
              required disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Mobile Number <span className="text-gray-400 text-xs font-normal">(for account support)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Phone className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="tel" id="ownerPhone" value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !orgName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><span>Create Agency</span><ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Have an invite? Ask your manager to invite your email address directly.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Onboarding() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    }>
      <OnboardingForm />
    </Suspense>
  );
}

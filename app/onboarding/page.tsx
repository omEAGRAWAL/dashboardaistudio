'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp, collection, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Building2, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const { user, orgId, role, loading } = useAuth();
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
    if (!loading && user && orgId) {
      router.push('/');
    }
  }, [user, orgId, loading, router]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !user) return;

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Create the organization
      const orgRef = doc(collection(db, 'organizations'));
      await setDoc(orgRef, {
        name: orgName.trim(),
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      // 2. Update the user's profile with the new orgId and role
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        orgId: orgRef.id,
        role: 'org_admin',
      });

      // 3. Force a reload to refresh the auth context
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
        <p className="text-gray-500 mb-8">
          Set up your organization to start managing leads and inviting your team members.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateOrg}>
          <div className="mb-6">
            <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
              Agency Name
            </label>
            <input
              type="text"
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Travel"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !orgName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Create Agency
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Have an invite code? Ask your manager to invite your email address directly.
          </p>
        </div>
      </div>
    </div>
  );
}

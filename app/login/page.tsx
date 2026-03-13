'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/home');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-200">
          <span className="text-white font-bold text-2xl">T</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Travlyy</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Sign in to manage your travel agency — leads, packages, bookings, and website in one place.
        </p>
        <button
          onClick={signIn}
          className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-4 rounded-xl font-semibold transition-colors shadow-sm text-sm"
        >
          <LogIn className="w-4 h-4" />
          Continue with Google
        </button>
        <p className="text-xs text-gray-400 mt-5">
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
        <div className="mt-6 pt-5 border-t border-gray-100">
          <a href="/" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
}

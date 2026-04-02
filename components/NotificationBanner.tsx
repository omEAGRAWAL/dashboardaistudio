'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { requestNotificationPermission, setupForegroundHandler } from '@/lib/firebase-messaging';

const DISMISS_KEY = 'notif-banner-dismissed';

export function NotificationBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    // Don't show if already granted or denied permanently
    if (Notification.permission === 'granted') {
      // Set up foreground handler for in-tab notifications
      setupForegroundHandler((payload) => {
        setToast({ title: payload.title, body: payload.body });
        setTimeout(() => setToast(null), 6000);
      });
      return;
    }

    // Don't show if user dismissed it recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    if (Notification.permission === 'default') {
      setVisible(true);
    }
  }, []);

  const handleEnable = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await requestNotificationPermission(user.uid);
      if (token) {
        setVisible(false);
        // Set up foreground handler after permission granted
        setupForegroundHandler((payload) => {
          setToast({ title: payload.title, body: payload.body });
          setTimeout(() => setToast(null), 6000);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  return (
    <>
      {/* Permission Banner */}
      {visible && (
        <div className="mx-4 mt-3 mb-1 flex items-center gap-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
            <Bell className="h-4.5 w-4.5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Enable Notifications</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Get instant alerts when new leads are assigned to you — even when this tab is in the background.
            </p>
          </div>
          <button
            onClick={handleEnable}
            disabled={loading}
            className="flex-shrink-0 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Enabling…' : 'Enable'}
          </button>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Foreground Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[99999] w-80 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 mt-0.5">
                <Bell className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{toast.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{toast.body}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

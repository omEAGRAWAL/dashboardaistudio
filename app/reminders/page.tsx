'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, X, Clock, Users, Mail, Smartphone, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { NotificationBanner } from '@/components/NotificationBanner';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format, isToday, isTomorrow, isThisYear } from 'date-fns';

interface Reminder {
  id: string;
  orgId: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  title: string;
  note: string;
  scheduledAt: string;
  recipientIds: string[];
  channels: string[];
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: string;
  sentAt?: string;
}

function formatScheduledTime(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`;
  if (isTomorrow(d)) return `Tomorrow at ${format(d, 'h:mm a')}`;
  if (isThisYear(d)) return format(d, "MMM d 'at' h:mm a");
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

function timeFromNow(iso: string): string {
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  if (diff < 0) return formatDistanceToNow(d, { addSuffix: true });
  return `in ${formatDistanceToNow(d)}`;
}

export default function RemindersPage() {
  const { user, orgId, role, loading } = useAuth();
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'sent'>('pending');
  const [fetching, setFetching] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/reminders/list?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setReminders(data.reminders ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }, [user, activeTab]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const handleCancel = async (reminderId: string) => {
    if (!user) return;
    setCancelling(reminderId);
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/reminders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ reminderId }),
      });
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user || (!orgId && role !== 'superadmin')) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <NotificationBanner />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Page header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Reminders</h1>
                <p className="text-sm text-gray-500">Scheduled follow-ups for your leads</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b border-gray-200">
              {(['pending', 'sent'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors -mb-px ${
                    activeTab === tab
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'pending' ? 'Upcoming' : 'Sent'}
                </button>
              ))}
            </div>

            {/* List */}
            {fetching ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">
                  {activeTab === 'pending' ? 'No upcoming reminders' : 'No sent reminders yet'}
                </p>
                {activeTab === 'pending' && (
                  <p className="text-xs text-gray-400 mt-1">Click the bell icon on any lead to schedule one</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.map(reminder => (
                  <div
                    key={reminder.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          reminder.status === 'pending' ? 'bg-indigo-100' : 'bg-gray-100'
                        }`}>
                          <Bell className={`w-4 h-4 ${reminder.status === 'pending' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{reminder.title}</p>

                          <div className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium mt-0.5">
                            {reminder.leadName}
                            <span className="text-gray-400">·</span>
                            <span className="text-gray-500 font-normal">{reminder.leadPhone}</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>

                          {reminder.note && (
                            <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">{reminder.note}</p>
                          )}

                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] text-gray-500">
                              <Clock className="w-3 h-3" />
                              {reminder.status === 'pending'
                                ? formatScheduledTime(reminder.scheduledAt)
                                : `Sent ${formatDistanceToNow(new Date(reminder.sentAt ?? reminder.scheduledAt), { addSuffix: true })}`
                              }
                            </span>

                            {reminder.status === 'pending' && (
                              <span className="text-[11px] text-gray-400">
                                ({timeFromNow(reminder.scheduledAt)})
                              </span>
                            )}

                            <div className="flex items-center gap-1">
                              {reminder.channels.includes('email') && (
                                <Mail className="w-3 h-3 text-gray-400" title="Email" />
                              )}
                              {reminder.channels.includes('push') && (
                                <Smartphone className="w-3 h-3 text-gray-400" title="Push notification" />
                              )}
                            </div>

                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Users className="w-3 h-3" />
                              {reminder.recipientIds.length === 0
                                ? 'All team'
                                : `${reminder.recipientIds.length} member${reminder.recipientIds.length > 1 ? 's' : ''}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {reminder.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(reminder.id)}
                          disabled={cancelling === reminder.id}
                          title="Cancel reminder"
                          className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

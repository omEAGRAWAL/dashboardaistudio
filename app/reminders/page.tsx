'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, X, Clock, Users, Mail, Smartphone, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
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
  if (isThisYear(d)) return format(d, 'MMM d \'at\' h:mm a');
  return format(d, 'MMM d, yyyy \'at\' h:mm a');
}

function timeFromNow(iso: string): string {
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  if (diff < 0) return formatDistanceToNow(d, { addSuffix: true });
  return `in ${formatDistanceToNow(d)}`;
}

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'sent'>('pending');
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
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
      setLoading(false);
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

  const pendingCount = reminders.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
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
      {loading ? (
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
          <p className="text-xs text-gray-400 mt-1">
            {activeTab === 'pending' && 'Click the bell icon on any lead to schedule one'}
          </p>
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
                  {/* Bell icon with status color */}
                  <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    reminder.status === 'pending' ? 'bg-indigo-100' : 'bg-gray-100'
                  }`}>
                    <Bell className={`w-4 h-4 ${reminder.status === 'pending' ? 'text-indigo-600' : 'text-gray-400'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{reminder.title}</p>

                    {/* Lead link */}
                    <a
                      href={`/home`}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-0.5 font-medium"
                    >
                      {reminder.leadName}
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500 font-normal">{reminder.leadPhone}</span>
                      <ChevronRight className="w-3 h-3" />
                    </a>

                    {reminder.note && (
                      <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">{reminder.note}</p>
                    )}

                    {/* Meta row */}
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

                      {/* Channels */}
                      <div className="flex items-center gap-1">
                        {reminder.channels.includes('email') && (
                          <span title="Email" className="flex items-center gap-0.5 text-[11px] text-gray-400">
                            <Mail className="w-3 h-3" />
                          </span>
                        )}
                        {reminder.channels.includes('push') && (
                          <span title="Push" className="flex items-center gap-0.5 text-[11px] text-gray-400">
                            <Smartphone className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      {/* Recipients count */}
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Users className="w-3 h-3" />
                        {reminder.recipientIds.length === 0 ? 'All team' : `${reminder.recipientIds.length} member${reminder.recipientIds.length > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cancel button for pending */}
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
  );
}

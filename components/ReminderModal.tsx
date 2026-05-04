'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Clock, Users, Mail, Smartphone } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Lead {
  id: string;
  name: string;
  phone: string;
}

interface TeamMember {
  id: string;
  uid: string;
  displayName?: string;
  email: string;
  role: string;
}

interface Props {
  lead: Lead;
  onClose: () => void;
  onCreated?: () => void;
}

export function ReminderModal({ lead, onClose, onCreated }: Props) {
  const { user, orgId } = useAuth();
  const [title, setTitle] = useState(`Follow up – ${lead.name}`);
  const [note, setNote] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allMembers, setAllMembers] = useState(true);
  const [channels, setChannels] = useState<string[]>(['email', 'push']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Default scheduledAt to tomorrow at 10am
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const pad = (n: number) => String(n).padStart(2, '0');
    setScheduledAt(
      `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`
    );
  }, []);

  useEffect(() => {
    if (!orgId) return;
    getDocs(query(collection(db, 'users'), where('orgId', '==', orgId)))
      .then(snap => {
        const members = snap.docs
          .map(d => ({ id: d.id, uid: d.id, ...d.data() } as TeamMember))
          .filter(m => m.role !== 'superadmin');
        setTeamMembers(members);
      })
      .catch(console.error);
  }, [orgId]);

  const toggleChannel = (ch: string) => {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const toggleMember = (uid: string) => {
    setSelectedIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !scheduledAt) return;
    if (channels.length === 0) { setError('Select at least one notification channel.'); return; }

    setLoading(true);
    setError('');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/reminders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          leadId: lead.id,
          leadName: lead.name,
          leadPhone: lead.phone,
          title,
          note,
          scheduledAt: new Date(scheduledAt).toISOString(),
          recipientIds: allMembers ? [] : selectedIds,
          channels,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create reminder');
      }
      onCreated?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Set Reminder</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Lead badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-xs font-medium text-gray-700">{lead.name}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{lead.phone}</span>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              placeholder="e.g. Follow up about Goa package"
            />
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
              placeholder="Add context for the reminder…"
            />
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Notify
            </label>
            <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors mb-2">
              <input
                type="checkbox"
                checked={allMembers}
                onChange={e => { setAllMembers(e.target.checked); if (e.target.checked) setSelectedIds([]); }}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">Everyone in team</span>
            </label>
            {!allMembers && (
              <div className="space-y-1 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {teamMembers.length === 0 ? (
                  <p className="text-xs text-gray-400 p-2">No team members found</p>
                ) : teamMembers.map(m => (
                  <label key={m.uid} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(m.uid)}
                      onChange={() => toggleMember(m.uid)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{m.displayName || m.email}</span>
                    <span className="ml-auto text-[10px] text-gray-400 capitalize">{m.role}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Channels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send via</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleChannel('email')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  channels.includes('email')
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
              <button
                type="button"
                onClick={() => toggleChannel('push')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  channels.includes('push')
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Push
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Saving…' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

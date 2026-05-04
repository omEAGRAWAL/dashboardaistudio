'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import {
  Megaphone, Send, Users, CheckCircle2, AlertCircle, Loader2,
  ChevronDown, Radio, Clock, X,
} from 'lucide-react';

const LEAD_STATUSES = [
  'New Enquiry',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Converted',
  'Closed',
];

const SEGMENT_OPTIONS = [
  { value: 'all',          label: 'All leads',               description: 'Every lead with a phone number' },
  { value: 'New Enquiry',  label: 'New Enquiry',             description: 'Leads in New Enquiry stage' },
  { value: 'Contacted',    label: 'Contacted',               description: 'Leads marked as Contacted' },
  { value: 'Qualified',    label: 'Qualified',               description: 'Qualified leads ready to convert' },
  { value: 'Proposal Sent',label: 'Proposal Sent',           description: 'Leads who received a proposal' },
  { value: 'Converted',    label: 'Converted',               description: 'Converted (paying) customers' },
  { value: 'custom',       label: 'Custom phone list',       description: 'Enter specific phone numbers' },
];

interface Broadcast {
  id: string;
  orgId: string;
  message: string;
  segment: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: 'sending' | 'completed' | 'failed';
  createdAt: Timestamp | null;
  completedAt?: Timestamp | null;
}

function formatTime(ts: Timestamp | null | undefined): string {
  if (!ts) return '—';
  return ts.toDate().toLocaleString([], {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function segmentLabel(segment: string): string {
  return SEGMENT_OPTIONS.find((s) => s.value === segment)?.label ?? segment;
}

export default function BroadcastsPage() {
  const { user, orgId, role, loading } = useAuth();

  const [message, setMessage] = useState('');
  const [segment, setSegment] = useState('all');
  const [customPhones, setCustomPhones] = useState('');
  const [segmentOpen, setSegmentOpen] = useState(false);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

  useEffect(() => {
    if (!orgId) return;
    const q = query(
      collection(db, 'broadcasts'),
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      setBroadcasts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Broadcast)));
    });
  }, [orgId]);

  const selectedSegmentOption = SEGMENT_OPTIONS.find((s) => s.value === segment)!;

  const handleSend = async () => {
    if (!message.trim() || !orgId) return;
    setSending(true);
    setSendError('');
    setSendResult(null);

    const phones =
      segment === 'custom'
        ? customPhones.split(/[\n,]+/).map((p) => p.trim()).filter(Boolean)
        : undefined;

    try {
      const res = await fetch('/api/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, message: message.trim(), segment, customPhones: phones }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSendResult({ sent: data.sentCount, failed: data.failedCount });
      setMessage('');
      setCustomPhones('');
      setSegment('all');
    } catch (e: any) {
      setSendError(e.message ?? 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Page title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-green-600" />
                WhatsApp Broadcasts
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Send a message to a segment of your leads in one shot. Each message is delivered individually via WhatsApp.
              </p>
            </div>

            {/* Compose card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-green-600" />
                  New Broadcast
                </p>
              </div>

              <div className="p-6 space-y-5">

                {/* Segment picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Send to</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSegmentOpen((v) => !v)}
                      className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="text-left">
                          <span className="font-medium text-gray-900">{selectedSegmentOption.label}</span>
                          <span className="ml-2 text-xs text-gray-400">{selectedSegmentOption.description}</span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${segmentOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {segmentOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {SEGMENT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setSegment(opt.value); setSegmentOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors text-left ${
                              segment === opt.value ? 'bg-green-50' : ''
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full shrink-0 ${segment === opt.value ? 'bg-green-500' : 'bg-gray-200'}`} />
                            <div>
                              <span className="font-medium text-gray-900">{opt.label}</span>
                              <span className="ml-2 text-xs text-gray-400">{opt.description}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom phones */}
                {segment === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone numbers <span className="font-normal text-gray-400">(one per line, or comma-separated)</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder={`+919876543210\n+918765432109\n+917654321098`}
                      value={customPhones}
                      onChange={(e) => setCustomPhones(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      {customPhones.split(/[\n,]+/).filter((p) => p.trim()).length} numbers entered
                    </p>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                  <textarea
                    rows={5}
                    placeholder="Hi {name}, we have an exciting new package for you…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">{message.length} characters</p>
                </div>

                {/* Important note */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  <strong>Note:</strong> WhatsApp only allows free-form messages to customers who have messaged you in the last 24 hours.
                  For outbound campaigns to cold contacts, use pre-approved Meta message templates (not supported yet).
                </div>

                {/* Feedback */}
                {sendError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {sendError}
                  </div>
                )}
                {sendResult && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Broadcast sent — <strong>{sendResult.sent}</strong> delivered
                    {sendResult.failed > 0 && <>, <strong>{sendResult.failed}</strong> failed</>}.
                  </div>
                )}

                <button
                  onClick={handleSend}
                  disabled={sending || !message.trim()}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending…' : 'Send Broadcast'}
                </button>
              </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-800">Broadcast History</p>
              </div>

              {broadcasts.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  No broadcasts sent yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {broadcasts.map((bc) => (
                    <div key={bc.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 line-clamp-2">{bc.message}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {segmentLabel(bc.segment)}
                            </span>
                            <span>{formatTime(bc.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {bc.status === 'sending' ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                              <Loader2 className="w-3 h-3 animate-spin" /> Sending
                            </span>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                <CheckCircle2 className="w-3 h-3" /> {bc.sentCount} sent
                              </span>
                              {bc.failedCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                                  <X className="w-3 h-3" /> {bc.failedCount} failed
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

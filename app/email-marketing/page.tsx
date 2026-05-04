'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { db } from '@/lib/firebase';
import {
  doc, getDoc, setDoc, collection, query, where, getDocs,
  orderBy, serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import {
  Mail, Settings, FileText, Send, Plus, Trash2, Edit2,
  Eye, ChevronRight, CheckCircle, XCircle, Loader2, X,
  Users, Filter, ClipboardList, TestTube, Save, AlertCircle, RefreshCw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SmtpSettings {
  host: string; port: number; secure: boolean;
  user: string; pass: string; fromName: string;
}

interface EmailTemplate {
  id: string; name: string; subject: string; body: string;
}

interface Campaign {
  id: string; name: string; subject: string;
  recipientCount: number; sentCount: number; failedCount: number;
  createdAt: Date;
}

interface Lead {
  id: string; name: string; email: string; phone?: string; status: string;
}

const LEAD_STATUSES = [
  'New Enquiry', 'Contacted', 'Qualified', 'Proposal Sent',
  'Negotiation', 'Booked', 'Lost',
];

const VAR_CHIPS = [
  { label: '{{name}}',   hint: 'Recipient name' },
  { label: '{{email}}',  hint: 'Recipient email' },
  { label: '{{phone}}',  hint: 'Recipient phone' },
  { label: '{{agency}}', hint: 'Your agency name' },
];

const DEFAULT_TEMPLATE_BODY = `<p>Hi {{name}},</p>

<p>We have an exciting travel offer exclusively for you!</p>

<p>Best regards,<br/>{{agency}} Team</p>

<p style="font-size:11px;color:#999;">
  To unsubscribe, reply to this email with "Unsubscribe" in the subject.
</p>`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmailMarketingPage() {
  const { user, orgId } = useAuth();

  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'settings'>('campaigns');

  // SMTP
  const [smtp, setSmtp] = useState<SmtpSettings>({ host: '', port: 587, secure: false, user: '', pass: '', fromName: '' });
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplSubject, setTplSubject] = useState('');
  const [tplBody, setTplBody] = useState(DEFAULT_TEMPLATE_BODY);
  const [tplPreview, setTplPreview] = useState(false);
  const [tplSaving, setTplSaving] = useState(false);

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  // New campaign form
  const [campName, setCampName] = useState('');
  const [campSubject, setCampSubject] = useState('');
  const [campBody, setCampBody] = useState(DEFAULT_TEMPLATE_BODY);
  const [campTemplateId, setCampTemplateId] = useState('');
  const [recipientMode, setRecipientMode] = useState<'all' | 'status' | 'custom'>('all');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(LEAD_STATUSES);
  const [customEmails, setCustomEmails] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [campPreview, setCampPreview] = useState(false);
  const [campSending, setCampSending] = useState(false);
  const [campResult, setCampResult] = useState<{ sentCount: number; failedCount: number } | null>(null);
  const [campError, setCampError] = useState('');

  // ── Load settings + templates from Firestore ────────────────────────────────
  useEffect(() => {
    if (!orgId) return;
    getDoc(doc(db, 'email_settings', orgId)).then((snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.smtp) setSmtp(d.smtp);
      if (d.templates) setTemplates(d.templates);
    });
  }, [orgId]);

  // ── Load campaign history ────────────────────────────────────────────────────
  useEffect(() => {
    if (!orgId) return;
    const q = query(
      collection(db, `email_campaigns/${orgId}/items`),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setCampaigns(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          subject: data.subject,
          recipientCount: data.recipientCount,
          sentCount: data.sentCount,
          failedCount: data.failedCount,
          createdAt: data.createdAt?.toDate() ?? new Date(),
        };
      }));
      setCampaignsLoading(false);
    });
    return unsub;
  }, [orgId]);

  // ── Load leads ───────────────────────────────────────────────────────────────
  const loadLeads = useCallback(async () => {
    if (!orgId) return;
    setLeadsLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'leads'), where('orgId', '==', orgId)),
      );
      const all: Lead[] = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Lead))
        .filter((l) => !!l.email);
      setLeads(all);
    } finally {
      setLeadsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (showNewCampaign) loadLeads();
  }, [showNewCampaign, loadLeads]);

  // ── Derived recipients ───────────────────────────────────────────────────────
  const derivedRecipients: { email: string; name: string; phone?: string }[] = (() => {
    if (recipientMode === 'custom') {
      return customEmails
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter((s) => s.includes('@'))
        .map((email) => ({ email, name: email.split('@')[0] }));
    }
    const filtered = recipientMode === 'status'
      ? leads.filter((l) => selectedStatuses.includes(l.status))
      : leads;
    return filtered.map((l) => ({ email: l.email, name: l.name, phone: l.phone }));
  })();

  // ── SMTP save ────────────────────────────────────────────────────────────────
  const saveSmtp = async () => {
    if (!orgId) return;
    setSmtpSaving(true); setSmtpMsg(null);
    try {
      await setDoc(doc(db, 'email_settings', orgId), { smtp, templates }, { merge: true });
      setSmtpMsg({ ok: true, text: 'Settings saved.' });
    } catch {
      setSmtpMsg({ ok: false, text: 'Save failed.' });
    } finally {
      setSmtpSaving(false);
    }
  };

  // ── SMTP test ────────────────────────────────────────────────────────────────
  const testSmtp = async () => {
    if (!testEmail) return;
    setTesting(true); setSmtpMsg(null);
    try {
      const res = await fetch('/api/email-marketing/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtp, testEmail }),
      });
      const data = await res.json();
      setSmtpMsg(res.ok
        ? { ok: true,  text: `Test email sent to ${testEmail}` }
        : { ok: false, text: data.error || 'Test failed' });
    } catch {
      setSmtpMsg({ ok: false, text: 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  // ── Template save ────────────────────────────────────────────────────────────
  const saveTemplate = async () => {
    if (!orgId || !tplName || !tplSubject || !tplBody) return;
    setTplSaving(true);
    try {
      const updated = editTemplate
        ? templates.map((t) => t.id === editTemplate.id ? { ...t, name: tplName, subject: tplSubject, body: tplBody } : t)
        : [...templates, { id: Date.now().toString(), name: tplName, subject: tplSubject, body: tplBody }];
      await setDoc(doc(db, 'email_settings', orgId), { templates: updated }, { merge: true });
      setTemplates(updated);
      closeTemplateModal();
    } finally {
      setTplSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!orgId || !confirm('Delete this template?')) return;
    const updated = templates.filter((t) => t.id !== id);
    await setDoc(doc(db, 'email_settings', orgId), { templates: updated }, { merge: true });
    setTemplates(updated);
  };

  const openNewTemplate = () => {
    setEditTemplate(null); setTplName(''); setTplSubject(''); setTplBody(DEFAULT_TEMPLATE_BODY);
    setTplPreview(false); setShowTemplateModal(true);
  };

  const openEditTemplate = (t: EmailTemplate) => {
    setEditTemplate(t); setTplName(t.name); setTplSubject(t.subject); setTplBody(t.body);
    setTplPreview(false); setShowTemplateModal(true);
  };

  const closeTemplateModal = () => {
    setShowTemplateModal(false); setEditTemplate(null); setTplPreview(false);
  };

  // ── Campaign send ────────────────────────────────────────────────────────────
  const sendCampaign = async () => {
    if (!orgId || !campSubject || !campBody || !derivedRecipients.length) return;
    setCampSending(true); setCampError(''); setCampResult(null);
    try {
      const res = await fetch('/api/email-marketing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          campaignName: campName || campSubject,
          subject: campSubject,
          htmlBody: campBody,
          recipients: derivedRecipients,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setCampResult({ sentCount: data.sentCount, failedCount: data.failedCount });
    } catch (e: unknown) {
      setCampError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setCampSending(false);
    }
  };

  const closeNewCampaign = () => {
    setShowNewCampaign(false);
    setCampName(''); setCampSubject(''); setCampBody(DEFAULT_TEMPLATE_BODY);
    setCampTemplateId(''); setRecipientMode('all');
    setSelectedStatuses(LEAD_STATUSES); setCustomEmails('');
    setCampPreview(false); setCampResult(null); setCampError('');
  };

  const applyTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (t) { setCampSubject(t.subject); setCampBody(t.body); }
    setCampTemplateId(id);
  };

  const insertVar = (v: string, setter: (fn: (s: string) => string) => void) => {
    setter((prev) => prev + v);
  };

  if (!user || !orgId) return null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">

          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
              <p className="text-sm text-gray-500 mt-0.5">Send campaigns to your leads and customers</p>
            </div>
            {activeTab === 'campaigns' && (
              <button onClick={() => setShowNewCampaign(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4" /> New Campaign
              </button>
            )}
            {activeTab === 'templates' && (
              <button onClick={openNewTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4" /> New Template
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
            {([
              { key: 'campaigns', icon: Send,     label: 'Campaigns' },
              { key: 'templates', icon: FileText,  label: 'Templates' },
              { key: 'settings',  icon: Settings,  label: 'Settings'  },
            ] as const).map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* ── CAMPAIGNS TAB ── */}
          {activeTab === 'campaigns' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {campaignsLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
                </div>
              ) : campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Mail className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="font-medium">No campaigns yet</p>
                  <p className="text-sm mt-1">Click &ldquo;New Campaign&rdquo; to send your first email</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Campaign', 'Subject', 'Recipients', 'Sent', 'Failed', 'Date'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.subject}</td>
                        <td className="px-4 py-3 text-gray-600">{c.recipientCount}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> {c.sentCount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {c.failedCount > 0 ? (
                            <span className="flex items-center gap-1 text-red-500 font-medium">
                              <XCircle className="w-3.5 h-3.5" /> {c.failedCount}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {c.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── TEMPLATES TAB ── */}
          {activeTab === 'templates' && (
            <div>
              {templates.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 text-gray-400">
                  <FileText className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="font-medium">No templates yet</p>
                  <p className="text-sm mt-1">Create reusable email templates for your campaigns</p>
                  <button onClick={openNewTemplate}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                    Create your first template
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.map((t) => (
                    <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{t.subject}</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => openEditTemplate(t)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteTemplate(t.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 line-clamp-3 bg-gray-50 rounded-lg p-2 font-mono">
                        {t.body.replace(/<[^>]+>/g, ' ').substring(0, 120)}…
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-500" /> SMTP Configuration
                </h2>
                <p className="text-xs text-gray-500 mb-5">
                  Configure your outgoing mail server. Leave blank to use the platform default.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">SMTP Host</label>
                    <input value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Port</label>
                    <input value={smtp.port} type="number" onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })}
                      placeholder="587"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email / Username</label>
                    <input value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                      placeholder="you@gmail.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password / App Password</label>
                    <input value={smtp.pass} type="password" onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">From Name</label>
                    <input value={smtp.fromName} onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })}
                      placeholder="Your Agency Name"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <button onClick={() => setSmtp({ ...smtp, secure: !smtp.secure })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${smtp.secure ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${smtp.secure ? 'translate-x-5' : ''}`} />
                    </button>
                    <span className="text-sm text-gray-600">SSL/TLS (port 465)</span>
                  </div>
                </div>

                {smtpMsg && (
                  <div className={`mt-4 flex items-center gap-2 text-sm p-3 rounded-lg ${smtpMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {smtpMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {smtpMsg.text}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-5 flex-wrap">
                  <button onClick={saveSmtp} disabled={smtpSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                    {smtpSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Settings
                  </button>
                  <div className="flex items-center gap-2 ml-auto">
                    <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44" />
                    <button onClick={testSmtp} disabled={testing || !testEmail}
                      className="flex items-center gap-2 px-3 py-2 border border-indigo-200 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 disabled:opacity-60">
                      {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                      Test
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">Using Gmail?</p>
                <p>Enable 2FA and create an <strong>App Password</strong> at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline">myaccount.google.com/apppasswords</a>. Use that as your password here.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── TEMPLATE MODAL ─────────────────────────────────────────────────────── */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{editTemplate ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={closeTemplateModal} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Template Name</label>
                <input value={tplName} onChange={(e) => setTplName(e.target.value)}
                  placeholder="e.g. Goa Promo, Follow-up Email…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject Line</label>
                <input value={tplSubject} onChange={(e) => setTplSubject(e.target.value)}
                  placeholder="e.g. Exciting Goa Package for {{name}}!"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              {/* Variable chips */}
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Insert variable</p>
                <div className="flex flex-wrap gap-2">
                  {VAR_CHIPS.map(({ label, hint }) => (
                    <button key={label} title={hint}
                      onClick={() => insertVar(label, (fn) => { setTplBody((p) => p + label); })}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-mono hover:bg-indigo-100 transition-colors">
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body / Preview toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">Email Body (HTML)</label>
                  <button onClick={() => setTplPreview(!tplPreview)}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800">
                    <Eye className="w-3.5 h-3.5" />
                    {tplPreview ? 'Edit' : 'Preview'}
                  </button>
                </div>
                {tplPreview ? (
                  <div className="border border-gray-200 rounded-lg p-4 min-h-[200px] text-sm bg-gray-50 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: substitute(tplBody, { name: 'Amit', email: 'amit@example.com', phone: '9999999999', agency: 'Yatrik Travels' }) }} />
                ) : (
                  <textarea value={tplBody} onChange={(e) => setTplBody(e.target.value)} rows={10}
                    placeholder="Write your email HTML here…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                )}
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={closeTemplateModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={saveTemplate} disabled={tplSaving || !tplName || !tplSubject || !tplBody}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                {tplSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW CAMPAIGN MODAL ──────────────────────────────────────────────────── */}
      {showNewCampaign && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">New Email Campaign</h2>
              <button onClick={closeNewCampaign} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {campResult ? (
              // ── Success state ──
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Campaign Sent!</h3>
                <p className="text-gray-500 mb-1">
                  <span className="font-semibold text-green-600">{campResult.sentCount}</span> emails delivered successfully.
                </p>
                {campResult.failedCount > 0 && (
                  <p className="text-sm text-red-500">{campResult.failedCount} failed to deliver.</p>
                )}
                <button onClick={closeNewCampaign}
                  className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                  Done
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">

                {/* Campaign name + Template picker */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Campaign Name</label>
                    <input value={campName} onChange={(e) => setCampName(e.target.value)}
                      placeholder="e.g. Monsoon Goa Promo"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Use Template</label>
                    <select value={campTemplateId} onChange={(e) => applyTemplate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option value="">— Custom / No template —</option>
                      {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Subject Line</label>
                  <input value={campSubject} onChange={(e) => setCampSubject(e.target.value)}
                    placeholder="e.g. Exciting Goa Package for {{name}}!"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                {/* Variables + Body */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-700">Email Body (HTML)</label>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        {VAR_CHIPS.map(({ label }) => (
                          <button key={label} onClick={() => setCampBody((p) => p + label)}
                            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-mono hover:bg-indigo-100">
                            {label}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setCampPreview(!campPreview)}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 ml-1">
                        <Eye className="w-3.5 h-3.5" /> {campPreview ? 'Edit' : 'Preview'}
                      </button>
                    </div>
                  </div>
                  {campPreview ? (
                    <div className="border border-gray-200 rounded-lg p-4 min-h-[180px] text-sm bg-gray-50 prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: substitute(campBody, {
                        name: leads[0]?.name ?? 'Amit', email: leads[0]?.email ?? 'amit@example.com',
                        phone: leads[0]?.phone ?? '9999999999', agency: smtp.fromName || 'Your Agency',
                      }) }} />
                  ) : (
                    <textarea value={campBody} onChange={(e) => setCampBody(e.target.value)} rows={8}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  )}
                </div>

                {/* Recipients */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Recipients
                  </p>
                  <div className="flex gap-3 mb-4">
                    {([
                      { val: 'all',    icon: Users,         label: 'All leads with email' },
                      { val: 'status', icon: Filter,        label: 'Filter by status' },
                      { val: 'custom', icon: ClipboardList, label: 'Custom list' },
                    ] as const).map(({ val, icon: Icon, label }) => (
                      <button key={val} onClick={() => setRecipientMode(val)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          recipientMode === val
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </button>
                    ))}
                  </div>

                  {recipientMode === 'all' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {leadsLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading leads…</>
                        : <><CheckCircle className="w-4 h-4 text-green-500" /> <strong>{leads.length}</strong> leads with email address found</>}
                    </div>
                  )}

                  {recipientMode === 'status' && (
                    <div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {LEAD_STATUSES.map((s) => (
                          <button key={s}
                            onClick={() => setSelectedStatuses((prev) =>
                              prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                            )}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              selectedStatuses.includes(s)
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'border-gray-300 text-gray-600 hover:border-indigo-300'
                            }`}>
                            {s}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>{leads.filter((l) => selectedStatuses.includes(l.status)).length}</strong> matching leads with email
                      </p>
                    </div>
                  )}

                  {recipientMode === 'custom' && (
                    <div>
                      <textarea value={customEmails} onChange={(e) => setCustomEmails(e.target.value)}
                        rows={4} placeholder="Enter email addresses, one per line or comma-separated"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                      <p className="text-xs text-gray-400 mt-1">{derivedRecipients.length} valid email{derivedRecipients.length !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                </div>

                {campError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {campError}
                  </div>
                )}
              </div>
            )}

            {!campResult && (
              <div className="p-5 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  <strong className="text-gray-900">{derivedRecipients.length}</strong> recipient{derivedRecipients.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-3">
                  <button onClick={closeNewCampaign} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button
                    onClick={sendCampaign}
                    disabled={campSending || !campSubject || !campBody || derivedRecipients.length === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                    {campSending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                      : <><Send className="w-4 h-4" /> Send to {derivedRecipients.length}</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

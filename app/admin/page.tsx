'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Shield, Phone, MessageSquare, Users, Plus, Trash2,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, ExternalLink,
  Building2, Loader2,
} from 'lucide-react';

interface OrgData {
  id: string;
  name: string;
  ownerId: string;
  createdAt: any;
  whatsapp: {
    phoneNumber: string;
    source: 'om' | 'agency' | 'sandbox';
    assignedAt: any;
  } | null;
  conversationCount: number;
  leadCount: number;
}

type AssignMode = 'om' | 'agency';

export default function AdminPage() {
  const { user, role, loading } = useAuth();
  const [orgs, setOrgs] = useState<OrgData[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Assign number modal state
  const [assignOrg, setAssignOrg] = useState<OrgData | null>(null);
  const [assignMode, setAssignMode] = useState<AssignMode>('om');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ownAccountSid, setOwnAccountSid] = useState('');
  const [ownAuthToken, setOwnAuthToken] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  const fetchOrgs = async () => {
    setFetching(true);
    setFetchError('');
    try {
      const res = await fetch('/api/admin/list-orgs');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrgs(data.orgs);
    } catch (e: any) {
      setFetchError(e.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  const handleAssign = async () => {
    if (!assignOrg || !phoneNumber) return;
    setAssigning(true);
    setAssignError('');
    setAssignSuccess('');
    try {
      const body: any = { orgId: assignOrg.id, phoneNumber };
      if (assignMode === 'agency') {
        body.ownAccountSid = ownAccountSid;
        body.ownAuthToken = ownAuthToken;
      }
      const res = await fetch('/api/admin/assign-whatsapp-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAssignSuccess(`Number ${data.phoneNumber} assigned successfully.`);
      setPhoneNumber(''); setOwnAccountSid(''); setOwnAuthToken('');
      setTimeout(() => { setAssignOrg(null); setAssignSuccess(''); fetchOrgs(); }, 1500);
    } catch (e: any) {
      setAssignError(e.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveNumber = async (orgId: string) => {
    if (!confirm('Remove WhatsApp number from this agency?')) return;
    try {
      await fetch('/api/admin/assign-whatsapp-number', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      fetchOrgs();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );

  if (!user || role !== 'superadmin') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Superadmin access only</p>
      </div>
    </div>
  );

  const connected = orgs.filter((o) => o.whatsapp).length;
  const totalConvs = orgs.reduce((s, o) => s + o.conversationCount, 0);
  const totalLeads = orgs.reduce((s, o) => s + o.leadCount, 0);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">

            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-indigo-600" />
                  Superadmin Dashboard
                </h1>
                <p className="text-gray-500 mt-1">Manage all agencies and their WhatsApp numbers.</p>
              </div>
              <button onClick={fetchOrgs} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg">
                <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Agencies', value: orgs.length, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'WhatsApp Connected', value: connected, icon: Phone, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Total Conversations', value: totalConvs, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Leads Generated', value: totalLeads, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Agencies Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">All Agencies ({orgs.length})</h2>
                <a
                  href="https://console.twilio.com/us1/develop/phone-numbers/manage/search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 rounded-lg px-3 py-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buy Twilio Number
                </a>
              </div>

              {fetchError && (
                <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {fetchError}
                </div>
              )}

              {fetching ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : orgs.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No agencies found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="px-6 py-3 text-left">Agency</th>
                        <th className="px-6 py-3 text-left">WhatsApp</th>
                        <th className="px-6 py-3 text-center">Source</th>
                        <th className="px-6 py-3 text-center">Convs</th>
                        <th className="px-6 py-3 text-center">Leads</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orgs.map((org) => (
                        <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900 text-sm">{org.name || 'Unnamed'}</div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5">{org.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            {org.whatsapp ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                <span className="text-sm font-mono text-gray-700">{org.whatsapp.phoneNumber}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-gray-300 shrink-0" />
                                <span className="text-sm text-gray-400">Not assigned</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {org.whatsapp ? (
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                org.whatsapp.source === 'agency'
                                  ? 'bg-purple-100 text-purple-700'
                                  : org.whatsapp.source === 'sandbox'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {org.whatsapp.source === 'agency' ? 'Agency own' : org.whatsapp.source === 'sandbox' ? 'Sandbox' : "Om's"}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">{org.conversationCount}</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">{org.leadCount}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setAssignOrg(org); setAssignMode('om'); setAssignError(''); setAssignSuccess(''); }}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5 flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {org.whatsapp ? 'Change' : 'Assign'} Number
                              </button>
                              {org.whatsapp && (
                                <button
                                  onClick={() => handleRemoveNumber(org.id)}
                                  className="text-xs text-red-500 hover:text-red-600 border border-red-200 rounded-lg px-2 py-1.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Indian Number Guide */}
            <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-base font-semibold text-gray-900">How to Get an Indian WhatsApp Number</h2>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                    Via Twilio (Om's account)
                  </h3>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li>• Go to <strong>Twilio Console → Phone Numbers → Buy a Number</strong></li>
                    <li>• Country: <strong>India (+91)</strong>, Capability: <strong>SMS</strong></li>
                    <li>• Buy the number (~$1-2/month)</li>
                    <li>• Then register for WhatsApp: <strong>Messaging → Senders → WhatsApp Senders</strong></li>
                    <li>• Connect Facebook Business account → submit for Meta approval (2-14 days)</li>
                    <li>• Once approved, use <strong>"Assign Number"</strong> button above</li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
                    Agency brings their own number
                  </h3>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li>• Agency creates their own Twilio account (free)</li>
                    <li>• They buy an Indian number and register it for WhatsApp with Meta</li>
                    <li>• Agency gives you their: Account SID, Auth Token, Phone Number</li>
                    <li>• Use <strong>"Assign Number → Agency's own"</strong> tab above</li>
                    <li>• System automatically sets the webhook URL on their number</li>
                    <li>• Credentials stored securely — never exposed to clients</li>
                  </ol>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Assign Number Modal */}
      {assignOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
              <h3 className="text-white font-semibold">Assign WhatsApp Number</h3>
              <p className="text-indigo-200 text-sm mt-0.5">{assignOrg.name}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Mode tabs */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                <button
                  onClick={() => setAssignMode('om')}
                  className={`flex-1 py-2 font-medium transition-colors ${assignMode === 'om' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Om's Twilio Account
                </button>
                <button
                  onClick={() => setAssignMode('agency')}
                  className={`flex-1 py-2 font-medium transition-colors border-l border-gray-200 ${assignMode === 'agency' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Agency's Own Account
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-gray-400 text-xs">(with country code, e.g. +919xxxxxxxxx)</span>
                </label>
                <input
                  type="text"
                  placeholder="+14155238886 or +919xxxxxxxxx"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {assignMode === 'agency' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agency Twilio Account SID</label>
                    <input
                      type="text"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={ownAccountSid}
                      onChange={(e) => setOwnAccountSid(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agency Twilio Auth Token</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••••••••••••••••••"
                      value={ownAuthToken}
                      onChange={(e) => setOwnAuthToken(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Stored securely server-side. Never exposed to clients.</p>
                  </div>
                </>
              )}

              {assignError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {assignError}
                </div>
              )}
              {assignSuccess && (
                <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {assignSuccess}
                </div>
              )}

              {assignMode === 'om' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                  The number must already exist in Om's Twilio account. Use sandbox number <strong>+14155238886</strong> for testing.
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setAssignOrg(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning || !phoneNumber || (assignMode === 'agency' && (!ownAccountSid || !ownAuthToken))}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${
                  assignMode === 'agency' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                {assigning ? 'Assigning…' : 'Assign Number'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

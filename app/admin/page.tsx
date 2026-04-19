'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Shield, Phone, MessageSquare, Users, Plus, Trash2,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, ExternalLink,
  Building2, Loader2, MoreVertical, Settings, Clock, Zap, Gift,
  ChevronDown, X, Copy, Check, UserCheck, UserX, Crown,
} from 'lucide-react';
import { FEATURES, FEATURE_LABELS, PLAN_LABELS, PLAN_FEATURES, FeatureKey } from '@/lib/features';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgData {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  ownerPhone: string;
  createdAt: any;
  subscription: {
    planId: string;
    status: string;
    trialEndsAt?: any;
    trialStartedAt?: any;
  } | null;
  features: Record<string, boolean> | null;
  referral: { referralCode?: string; referredBy?: string; referredByCode?: string } | null;
  metadata: { notes?: string; suspendedAt?: any } | null;
  whatsapp: { phoneNumber: string; source: 'om' | 'agency' | 'sandbox'; assignedAt: any } | null;
  conversationCount: number;
  leadCount: number;
}

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  orgId: string | null;
  orgName: string | null;
  status: string;
  createdAt: any;
}

interface ReferralData {
  id: string;
  code: string;
  referrerOrgId: string;
  referredOrgId: string;
  referredEmail: string;
  status: string;
  createdAt: any;
  convertedAt: any;
}

type Tab = 'agencies' | 'users' | 'plans' | 'referrals';
type AssignMode = 'om' | 'agency';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string') return new Date(ts);
  if (typeof ts === 'number') return new Date(ts);
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return null;
}

function trialDaysLeft(trialEndsAt: any): number | null {
  const end = toDate(trialEndsAt);
  if (!end) return null;
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function formatDate(ts: any): string {
  const d = toDate(ts);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function PlanBadge({ planId }: { planId?: string }) {
  const map: Record<string, string> = {
    free_trial: 'bg-gray-100 text-gray-600',
    starter:    'bg-blue-100 text-blue-700',
    pro:        'bg-indigo-100 text-indigo-700',
    enterprise: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${map[planId || ''] || 'bg-gray-100 text-gray-500'}`}>
      {PLAN_LABELS[planId || ''] || 'No plan'}
    </span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    trialing:   'bg-yellow-100 text-yellow-700',
    active:     'bg-green-100 text-green-700',
    past_due:   'bg-orange-100 text-orange-700',
    suspended:  'bg-red-100 text-red-700',
    cancelled:  'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${map[status || ''] || 'bg-gray-100 text-gray-500'}`}>
      {status || 'none'}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, role, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('agencies');

  // Agencies
  const [orgs, setOrgs] = useState<OrgData[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [orgSearch, setOrgSearch] = useState('');
  const [orgPlanFilter, setOrgPlanFilter] = useState('');
  const [orgStatusFilter, setOrgStatusFilter] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // WhatsApp assign modal
  const [assignOrg, setAssignOrg] = useState<OrgData | null>(null);
  const [assignMode, setAssignMode] = useState<AssignMode>('om');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ownAccountSid, setOwnAccountSid] = useState('');
  const [ownAuthToken, setOwnAuthToken] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  // Manage Features slide-over
  const [featuresOrg, setFeaturesOrg] = useState<OrgData | null>(null);
  const [editFeatures, setEditFeatures] = useState<Record<string, boolean>>({});
  const [savingFeatures, setSavingFeatures] = useState(false);

  // Set Plan & Trial modal
  const [planOrg, setPlanOrg] = useState<OrgData | null>(null);
  const [planId, setPlanId] = useState('');
  const [planStatus, setPlanStatus] = useState('');
  const [trialEnd, setTrialEnd] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [planError, setPlanError] = useState('');

  // Users tab
  const [users, setUsers] = useState<UserData[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Referrals tab
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [fetchingReferrals, setFetchingReferrals] = useState(false);

  const authHeaders = useCallback(() => {
    return { 'Content-Type': 'application/json', 'x-uid': user?.uid ?? '' };
  }, [user]);

  // ── Fetch orgs ──────────────────────────────────────────────────────────────
  const fetchOrgs = useCallback(async () => {
    setFetching(true); setFetchError('');
    try {
      const res = await fetch('/api/admin/list-orgs');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrgs(data.orgs);
    } catch (e: any) { setFetchError(e.message); }
    finally { setFetching(false); }
  }, []);

  // ── Fetch users ─────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setFetchingUsers(true);
    try {
      const headers = authHeaders();
      const res = await fetch('/api/admin/list-users', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (e: any) { console.error(e.message); }
    finally { setFetchingUsers(false); }
  }, [authHeaders]);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);
  useEffect(() => { if (tab === 'users' && users.length === 0) fetchUsers(); }, [tab, users.length, fetchUsers]);

  // ── WhatsApp assign ─────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!assignOrg || !phoneNumber) return;
    setAssigning(true); setAssignError(''); setAssignSuccess('');
    try {
      const body: any = { orgId: assignOrg.id, phoneNumber };
      if (assignMode === 'agency') { body.ownAccountSid = ownAccountSid; body.ownAuthToken = ownAuthToken; }
      const res = await fetch('/api/admin/assign-whatsapp-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAssignSuccess(`Number ${data.phoneNumber} assigned.`);
      setPhoneNumber(''); setOwnAccountSid(''); setOwnAuthToken('');
      setTimeout(() => { setAssignOrg(null); setAssignSuccess(''); fetchOrgs(); }, 1500);
    } catch (e: any) { setAssignError(e.message); }
    finally { setAssigning(false); }
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
    } catch (e: any) { alert(e.message); }
  };

  // ── Manage Features ─────────────────────────────────────────────────────────
  const openManageFeatures = (org: OrgData) => {
    setFeaturesOrg(org);
    const defaults = Object.values(FEATURES).reduce((acc, k) => ({ ...acc, [k]: true }), {} as Record<string, boolean>);
    setEditFeatures({ ...defaults, ...(org.features || {}) });
    setOpenMenu(null);
  };

  const resetFeaturesToPlan = () => {
    if (!featuresOrg) return;
    const planFeatures = PLAN_FEATURES[featuresOrg.subscription?.planId || 'free_trial'] || Object.values(FEATURES);
    const reset = Object.values(FEATURES).reduce((acc, k) => ({ ...acc, [k]: planFeatures.includes(k as FeatureKey) }), {} as Record<string, boolean>);
    setEditFeatures(reset);
  };

  const saveFeatures = async () => {
    if (!featuresOrg) return;
    setSavingFeatures(true);
    try {
      const headers = authHeaders();
      const res = await fetch('/api/admin/update-org-subscription', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orgId: featuresOrg.id, features: editFeatures }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchOrgs();
      setFeaturesOrg(null);
    } catch (e: any) { alert(e.message); }
    finally { setSavingFeatures(false); }
  };

  // ── Set Plan & Trial ────────────────────────────────────────────────────────
  const openSetPlan = (org: OrgData) => {
    setPlanOrg(org);
    setPlanId(org.subscription?.planId || 'free_trial');
    setPlanStatus(org.subscription?.status || 'trialing');
    const trialEndsAt = org.subscription?.trialEndsAt;
    const trialDate = toDate(trialEndsAt);
    setTrialEnd(trialDate ? trialDate.toISOString().split('T')[0] : '');
    setPlanNotes(org.metadata?.notes || '');
    setPlanError('');
    setOpenMenu(null);
  };

  const extendTrial = (days: number) => {
    const base = trialEnd ? new Date(trialEnd) : new Date();
    base.setDate(base.getDate() + days);
    setTrialEnd(base.toISOString().split('T')[0]);
  };

  const savePlan = async () => {
    if (!planOrg) return;
    setSavingPlan(true); setPlanError('');
    try {
      const headers = authHeaders();
      const body: any = { orgId: planOrg.id, planId, status: planStatus, notes: planNotes };
      if (trialEnd) body.trialEndsAt = trialEnd;
      const res = await fetch('/api/admin/update-org-subscription', { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchOrgs();
      setPlanOrg(null);
    } catch (e: any) { setPlanError(e.message); }
    finally { setSavingPlan(false); }
  };

  // ── Suspend / Reactivate ────────────────────────────────────────────────────
  const handleSuspend = async (org: OrgData) => {
    if (!confirm(`Suspend ${org.name}? They will lose access immediately.`)) return;
    setOpenMenu(null);
    const headers = await authHeaders();
    await fetch('/api/admin/update-org-subscription', {
      method: 'POST', headers,
      body: JSON.stringify({ orgId: org.id, status: 'suspended' }),
    });
    fetchOrgs();
  };

  const handleReactivate = async (org: OrgData) => {
    setOpenMenu(null);
    const headers = await authHeaders();
    await fetch('/api/admin/update-org-subscription', {
      method: 'POST', headers,
      body: JSON.stringify({ orgId: org.id, status: 'active' }),
    });
    fetchOrgs();
  };

  // ── Generate Referral Code ──────────────────────────────────────────────────
  const handleGenerateCode = async (org: OrgData) => {
    setOpenMenu(null);
    const headers = await authHeaders();
    const res = await fetch('/api/admin/manage-referral-code', {
      method: 'POST', headers,
      body: JSON.stringify({ orgId: org.id, action: 'generate' }),
    });
    const data = await res.json();
    if (data.code) { alert(`Referral code generated: ${data.code}`); fetchOrgs(); }
    else alert(data.error || 'Failed');
  };

  // ── Filtered org list ───────────────────────────────────────────────────────
  const filteredOrgs = orgs.filter((o) => {
    const matchSearch = !orgSearch ||
      o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
      o.ownerEmail.toLowerCase().includes(orgSearch.toLowerCase());
    const matchPlan = !orgPlanFilter || o.subscription?.planId === orgPlanFilter;
    const matchStatus = !orgStatusFilter || o.subscription?.status === orgStatusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
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

  const trialing = orgs.filter((o) => o.subscription?.status === 'trialing').length;
  const active    = orgs.filter((o) => o.subscription?.status === 'active').length;
  const suspended = orgs.filter((o) => o.subscription?.status === 'suspended').length;
  const connected = orgs.filter((o) => o.whatsapp).length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">

            {/* Page header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-indigo-600" />
                  Superadmin Dashboard
                </h1>
                <p className="text-gray-500 mt-1 text-sm">Manage agencies, subscriptions, and platform settings.</p>
              </div>
              <button onClick={fetchOrgs} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg bg-white">
                <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
              {([
                { id: 'agencies', label: 'Agencies', icon: Building2 },
                { id: 'users',    label: 'Users',    icon: Users },
                { id: 'plans',    label: 'Plans',    icon: Crown },
                { id: 'referrals',label: 'Referrals',icon: Gift },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── TAB: AGENCIES ────────────────────────────────────────────── */}
            {tab === 'agencies' && (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Agencies', value: orgs.length,  color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Building2 },
                    { label: 'Active',         value: active,       color: 'text-green-600',  bg: 'bg-green-50',  icon: CheckCircle2 },
                    { label: 'On Trial',       value: trialing,     color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
                    { label: 'Suspended',      value: suspended,    color: 'text-red-600',    bg: 'bg-red-50',    icon: XCircle },
                  ].map(({ label, value, color, bg, icon: Icon }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{value}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <input
                    type="text" placeholder="Search agency or owner email…"
                    value={orgSearch} onChange={(e) => setOrgSearch(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-64"
                  />
                  <select value={orgPlanFilter} onChange={(e) => setOrgPlanFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                    <option value="">All Plans</option>
                    {Object.entries(PLAN_LABELS).map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                  <select value={orgStatusFilter} onChange={(e) => setOrgStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                    <option value="">All Statuses</option>
                    {['trialing', 'active', 'past_due', 'suspended', 'cancelled'].map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>

                {/* Agencies table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-700">
                      {filteredOrgs.length} {filteredOrgs.length === 1 ? 'agency' : 'agencies'}
                    </h2>
                    <a href="https://console.twilio.com/us1/develop/phone-numbers/manage/search" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 font-medium">
                      <ExternalLink className="w-3 h-3" /> Buy Twilio Number
                    </a>
                  </div>
                  {fetchError && (
                    <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />{fetchError}
                    </div>
                  )}
                  {fetching ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                    </div>
                  ) : filteredOrgs.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">No agencies found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                            <th className="px-6 py-3 text-left">Agency</th>
                            <th className="px-6 py-3 text-left">Owner</th>
                            <th className="px-6 py-3 text-left">Plan</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Trial / Billing</th>
                            <th className="px-6 py-3 text-center">Stats</th>
                            <th className="px-6 py-3 text-center">WhatsApp</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredOrgs.map((org) => {
                            const days = trialDaysLeft(org.subscription?.trialEndsAt);
                            const isExpired = days !== null && days <= 0;
                            return (
                              <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-gray-900">{org.name || 'Unnamed'}</div>
                                  <div className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-[140px]">{org.id}</div>
                                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(org.createdAt)}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-gray-700 truncate max-w-[160px]">{org.ownerEmail}</div>
                                  {org.ownerPhone && <div className="text-xs text-gray-400 mt-0.5">{org.ownerPhone}</div>}
                                </td>
                                <td className="px-6 py-4"><PlanBadge planId={org.subscription?.planId} /></td>
                                <td className="px-6 py-4"><StatusBadge status={org.subscription?.status} /></td>
                                <td className="px-6 py-4">
                                  {org.subscription?.status === 'trialing' && days !== null ? (
                                    <span className={`text-xs font-medium ${isExpired ? 'text-red-600' : days <= 3 ? 'text-orange-600' : 'text-yellow-700'}`}>
                                      {isExpired ? 'Expired' : `${days}d left`}
                                    </span>
                                  ) : org.subscription?.status === 'active' ? (
                                    <span className="text-xs text-gray-500">Active</span>
                                  ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center text-gray-500">
                                  <div className="text-xs">{org.leadCount} leads</div>
                                  <div className="text-xs">{org.conversationCount} convs</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {org.whatsapp
                                    ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                    : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="relative inline-block">
                                    <button
                                      onClick={() => setOpenMenu(openMenu === org.id ? null : org.id)}
                                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                    {openMenu === org.id && (
                                      <div className="absolute right-0 top-8 z-30 bg-white border border-gray-200 rounded-xl shadow-lg w-48 py-1 text-sm">
                                        <button onClick={() => { setAssignOrg(org); setAssignMode('om'); setAssignError(''); setAssignSuccess(''); setOpenMenu(null); }}
                                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                                          {org.whatsapp ? 'Change Number' : 'Assign Number'}
                                        </button>
                                        <button onClick={() => openManageFeatures(org)}
                                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                                          <Zap className="w-3.5 h-3.5 text-gray-400" />
                                          Manage Features
                                        </button>
                                        <button onClick={() => openSetPlan(org)}
                                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                                          <Settings className="w-3.5 h-3.5 text-gray-400" />
                                          Set Plan & Trial
                                        </button>
                                        {!org.referral?.referralCode ? (
                                          <button onClick={() => handleGenerateCode(org)}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                                            <Gift className="w-3.5 h-3.5 text-gray-400" />
                                            Generate Ref Code
                                          </button>
                                        ) : (
                                          <div className="px-4 py-2 flex items-center gap-2 text-gray-500">
                                            <Gift className="w-3.5 h-3.5" />
                                            Code: <span className="font-mono font-semibold text-indigo-600">{org.referral.referralCode}</span>
                                          </div>
                                        )}
                                        <div className="border-t border-gray-100 my-1" />
                                        {org.subscription?.status === 'suspended' ? (
                                          <button onClick={() => handleReactivate(org)}
                                            className="w-full text-left px-4 py-2 hover:bg-green-50 flex items-center gap-2 text-green-700">
                                            <UserCheck className="w-3.5 h-3.5" />
                                            Reactivate
                                          </button>
                                        ) : (
                                          <button onClick={() => handleSuspend(org)}
                                            className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600">
                                            <UserX className="w-3.5 h-3.5" />
                                            Suspend Agency
                                          </button>
                                        )}
                                        {org.whatsapp && (
                                          <button onClick={() => { handleRemoveNumber(org.id); setOpenMenu(null); }}
                                            className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-500">
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Remove WhatsApp
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── TAB: USERS ───────────────────────────────────────────────── */}
            {tab === 'users' && (
              <>
                <div className="flex gap-3 mb-4">
                  <input
                    type="text" placeholder="Search by name, email or org…"
                    value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-72"
                  />
                  <button onClick={fetchUsers} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-700 bg-white flex items-center gap-1.5">
                    <RefreshCw className={`w-4 h-4 ${fetchingUsers ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {fetchingUsers ? (
                    <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-gray-300" /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                            <th className="px-6 py-3 text-left">User</th>
                            <th className="px-6 py-3 text-left">Organization</th>
                            <th className="px-6 py-3 text-left">Role</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Joined</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {users
                            .filter((u) => !userSearch ||
                              u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                              u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
                              (u.orgName || '').toLowerCase().includes(userSearch.toLowerCase()))
                            .map((u) => (
                              <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    {u.photoURL
                                      ? <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                                      : <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                          {(u.displayName || u.email)[0]?.toUpperCase()}
                                        </div>}
                                    <div>
                                      <div className="font-medium text-gray-900">{u.displayName || '—'}</div>
                                      <div className="text-xs text-gray-400">{u.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-gray-700">{u.orgName || <span className="text-gray-400">—</span>}</div>
                                  {u.orgId && <div className="text-xs text-gray-400 font-mono truncate max-w-[120px]">{u.orgId}</div>}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                    u.role === 'superadmin' ? 'bg-red-100 text-red-700' :
                                    u.role === 'org_admin'  ? 'bg-indigo-100 text-indigo-700' :
                                                              'bg-gray-100 text-gray-600'
                                  }`}>{u.role}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                    u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                  }`}>{u.status}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {users.length === 0 && (
                        <div className="text-center py-12 text-gray-400 text-sm">No users found.</div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── TAB: PLANS ───────────────────────────────────────────────── */}
            {tab === 'plans' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {([
                  { id: 'free_trial', color: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', priceLabel: 'Free', desc: '30-day full access trial' },
                  { id: 'starter',    color: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700',    priceLabel: '₹999/mo', desc: 'For small agencies getting started' },
                  { id: 'pro',        color: 'border-indigo-200',badge: 'bg-indigo-100 text-indigo-700', priceLabel: '₹1,999/mo', desc: 'Full suite for growing agencies' },
                  { id: 'enterprise', color: 'border-purple-200',badge: 'bg-purple-100 text-purple-700', priceLabel: '₹3,999/mo', desc: 'Everything + API & white-label' },
                ]).map(({ id, color, badge, priceLabel, desc }) => {
                  const planCount = orgs.filter((o) => o.subscription?.planId === id).length;
                  const includedFeatures = PLAN_FEATURES[id] || [];
                  return (
                    <div key={id} className={`bg-white rounded-xl border-2 ${color} shadow-sm overflow-hidden`}>
                      <div className="p-5 border-b border-gray-100">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge}`}>{PLAN_LABELS[id]}</span>
                          <span className="text-xs text-gray-400">{planCount} agencies</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900 mt-2">{priceLabel}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                      </div>
                      <div className="p-4 space-y-2">
                        {Object.values(FEATURES).map((key) => {
                          const included = includedFeatures.includes(key as FeatureKey);
                          return (
                            <div key={key} className={`flex items-center gap-2 text-xs ${included ? 'text-gray-700' : 'text-gray-300'}`}>
                              {included
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                : <XCircle className="w-3.5 h-3.5 text-gray-200 shrink-0" />}
                              {FEATURE_LABELS[key as FeatureKey]}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── TAB: REFERRALS ───────────────────────────────────────────── */}
            {tab === 'referrals' && (
              <ReferralsTab orgs={orgs} uid={user?.uid ?? ''} />
            )}

          </div>
        </main>
      </div>

      {/* ── WhatsApp Assign Modal ─────────────────────────────────────────── */}
      {assignOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setAssignOrg(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">Assign WhatsApp Number</h3>
                <p className="text-indigo-200 text-sm">{assignOrg.name}</p>
              </div>
              <button onClick={() => setAssignOrg(null)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                <button onClick={() => setAssignMode('om')} className={`flex-1 py-2 font-medium transition-colors ${assignMode === 'om' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Om's Account</button>
                <button onClick={() => setAssignMode('agency')} className={`flex-1 py-2 font-medium transition-colors border-l border-gray-200 ${assignMode === 'agency' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Agency's Own</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-gray-400 text-xs">(with country code)</span></label>
                <input type="text" placeholder="+14155238886 or +919xxxxxxxxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {assignMode === 'agency' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agency Twilio Account SID</label>
                    <input type="text" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={ownAccountSid} onChange={(e) => setOwnAccountSid(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agency Twilio Auth Token</label>
                    <input type="password" placeholder="••••••••••••••••••••••••••••••••" value={ownAuthToken} onChange={(e) => setOwnAuthToken(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <p className="text-xs text-gray-400 mt-1">Stored securely server-side.</p>
                  </div>
                </>
              )}
              {assignError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{assignError}</div>}
              {assignSuccess && <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{assignSuccess}</div>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setAssignOrg(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAssign} disabled={assigning || !phoneNumber || (assignMode === 'agency' && (!ownAccountSid || !ownAuthToken))}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 ${assignMode === 'agency' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                {assigning ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Set Plan & Trial Modal ────────────────────────────────────────── */}
      {planOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setPlanOrg(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Set Plan & Trial</h3>
                <p className="text-sm text-gray-500">{planOrg.name}</p>
              </div>
              <button onClick={() => setPlanOrg(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select value={planId} onChange={(e) => setPlanId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {Object.entries(PLAN_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={planStatus} onChange={(e) => setPlanStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {['trialing', 'active', 'past_due', 'suspended', 'cancelled'].map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trial Ends</label>
                <input type="date" value={trialEnd} onChange={(e) => setTrialEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="flex gap-2 mt-2">
                  {[7, 14, 30].map((d) => (
                    <button key={d} onClick={() => extendTrial(d)}
                      className="text-xs border border-indigo-200 text-indigo-600 rounded-lg px-2 py-1 hover:bg-indigo-50">
                      +{d} days
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                <textarea value={planNotes} onChange={(e) => setPlanNotes(e.target.value)} rows={2}
                  placeholder="e.g. Onboarded via partner deal, 60-day trial extended…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              {planError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{planError}</div>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setPlanOrg(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={savePlan} disabled={savingPlan}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50">
                {savingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Features Slide-over ────────────────────────────────────── */}
      {featuresOrg && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setFeaturesOrg(null)}>
          <div className="flex-1" />
          <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Manage Features</h3>
                <p className="text-sm text-gray-500">{featuresOrg.name}</p>
              </div>
              <button onClick={() => setFeaturesOrg(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400">Plan: <PlanBadge planId={featuresOrg.subscription?.planId} /></span>
                <button onClick={resetFeaturesToPlan} className="text-xs text-indigo-600 hover:underline">Reset to plan defaults</button>
              </div>
              <div className="space-y-3">
                {Object.values(FEATURES).map((key) => {
                  const planDefaults = PLAN_FEATURES[featuresOrg.subscription?.planId || 'free_trial'] || Object.values(FEATURES);
                  const isDefault = planDefaults.includes(key as FeatureKey);
                  const isOn = editFeatures[key] ?? true;
                  return (
                    <label key={key} className="flex items-center justify-between cursor-pointer gap-3 py-2 border-b border-gray-50">
                      <div>
                        <span className="text-sm text-gray-700">{FEATURE_LABELS[key as FeatureKey]}</span>
                        {isOn !== isDefault && <span className="ml-1.5 text-xs text-orange-500">*</span>}
                      </div>
                      <div
                        onClick={() => setEditFeatures((prev) => ({ ...prev, [key]: !prev[key] }))}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${isOn ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setFeaturesOrg(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={saveFeatures} disabled={savingFeatures}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50">
                {savingFeatures ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {openMenu && <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />}
    </div>
  );
}

// ─── Referrals Tab Sub-component ─────────────────────────────────────────────

function ReferralsTab({ orgs, uid }: { orgs: OrgData[]; uid: string }) {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  // Build referrals from orgs that have a referredBy set — we'll just show org referral info
  // Since we don't have a separate fetch for the referrals collection yet, show org referral data
  const orgsWithCode = orgs.filter((o) => o.referral?.referralCode);
  const orgsReferred  = orgs.filter((o) => o.referral?.referredBy);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Agencies with Code',  value: orgsWithCode.length,  color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Referred Sign-ups',    value: orgsReferred.length,  color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Conversion Rate',      value: orgsWithCode.length ? `${Math.round(orgsReferred.length / orgsWithCode.length * 100)}%` : '—', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Agencies with referral codes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Agencies with Referral Codes</h3>
        </div>
        {orgsWithCode.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No referral codes generated yet. Use the agency menu to generate codes.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left">Agency</th>
                <th className="px-6 py-3 text-left">Owner</th>
                <th className="px-6 py-3 text-left">Referral Code</th>
                <th className="px-6 py-3 text-left">Share Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orgsWithCode.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{org.name}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{org.ownerEmail}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg text-sm">
                      {org.referral!.referralCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => copyCode(`${window.location.origin}/?ref=${org.referral!.referralCode}`)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 rounded-lg px-2.5 py-1.5"
                    >
                      {copied === `${window.location.origin}/?ref=${org.referral!.referralCode}`
                        ? <><Check className="w-3 h-3 text-green-500" /> Copied!</>
                        : <><Copy className="w-3 h-3" /> Copy Link</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Referred sign-ups */}
      {orgsReferred.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Referred Sign-ups</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left">New Agency</th>
                <th className="px-6 py-3 text-left">Referred By Code</th>
                <th className="px-6 py-3 text-left">Referrer Org</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orgsReferred.map((org) => {
                const referrer = orgs.find((o) => o.id === org.referral?.referredBy);
                return (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{org.name}</div>
                      <div className="text-xs text-gray-400">{org.ownerEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-indigo-600 text-xs bg-indigo-50 px-2 py-1 rounded">{org.referral?.referredByCode}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{referrer?.name || org.referral?.referredBy || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc,
  serverTimestamp, getDocs, where, deleteDoc, writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import { format, isToday, formatDistanceToNow } from 'date-fns';
import {
  Phone, MessageCircle, Plus, MoreHorizontal, Check, Users,
  BarChart3, Trash2, ChevronDown, UserCheck, X, UserPlus
} from 'lucide-react';
import { Stats } from './Stats';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { WhatsAppModal } from './WhatsAppModal';

const STATUSES = [
  "New Enquiry", "Call Not Picked", "Call me later", "Contacted",
  "Qualified", "Negotiating", "Awaiting Payment", "Booked",
  "Lost & Closed", "Future Prospect", "Just Checking"
];
const CATEGORIES = ["Hot", "Warm", "Cold", "Repeating Customer", "Group", "None"];
const COLORS = ['#4f46e5','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316','#14b8a6','#6366f1','#84cc16'];

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string; activeBg: string; hoverBg: string; badgeBg: string }> = {
  "New Enquiry":      { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300',    dot: 'bg-blue-500',    activeBg: 'bg-blue-600',    hoverBg: 'hover:bg-blue-100',    badgeBg: 'bg-blue-100 text-blue-700' },
  "Call Not Picked":  { bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-300',   dot: 'bg-slate-500',   activeBg: 'bg-slate-600',   hoverBg: 'hover:bg-slate-100',   badgeBg: 'bg-slate-100 text-slate-600' },
  "Call me later":    { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300',   dot: 'bg-amber-500',   activeBg: 'bg-amber-500',   hoverBg: 'hover:bg-amber-100',   badgeBg: 'bg-amber-100 text-amber-700' },
  "Contacted":        { bg: 'bg-sky-100',     text: 'text-sky-800',     border: 'border-sky-300',     dot: 'bg-sky-500',     activeBg: 'bg-sky-600',     hoverBg: 'hover:bg-sky-100',     badgeBg: 'bg-sky-100 text-sky-700' },
  "Qualified":        { bg: 'bg-green-100',   text: 'text-green-800',   border: 'border-green-400',   dot: 'bg-green-500',   activeBg: 'bg-green-600',   hoverBg: 'hover:bg-green-100',   badgeBg: 'bg-green-100 text-green-700' },
  "Negotiating":      { bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-300',  dot: 'bg-orange-500',  activeBg: 'bg-orange-500',  hoverBg: 'hover:bg-orange-100',  badgeBg: 'bg-orange-100 text-orange-700' },
  "Awaiting Payment": { bg: 'bg-violet-100',  text: 'text-violet-800',  border: 'border-violet-300',  dot: 'bg-violet-500',  activeBg: 'bg-violet-600',  hoverBg: 'hover:bg-violet-100',  badgeBg: 'bg-violet-100 text-violet-700' },
  "Booked":           { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-400', dot: 'bg-emerald-600', activeBg: 'bg-emerald-600', hoverBg: 'hover:bg-emerald-100', badgeBg: 'bg-emerald-100 text-emerald-700' },
  "Lost & Closed":    { bg: 'bg-red-100',     text: 'text-red-800',     border: 'border-red-400',     dot: 'bg-red-500',     activeBg: 'bg-red-600',     hoverBg: 'hover:bg-red-100',     badgeBg: 'bg-red-100 text-red-700' },
  "Future Prospect":  { bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-300',  dot: 'bg-indigo-500',  activeBg: 'bg-indigo-600',  hoverBg: 'hover:bg-indigo-100',  badgeBg: 'bg-indigo-100 text-indigo-700' },
  "Just Checking":    { bg: 'bg-pink-100',    text: 'text-pink-800',    border: 'border-pink-300',    dot: 'bg-pink-400',    activeBg: 'bg-pink-500',    hoverBg: 'hover:bg-pink-100',    badgeBg: 'bg-pink-100 text-pink-700' },
};

const STATUS_HEX: Record<string, string> = {
  "New Enquiry": '#3b82f6', "Call Not Picked": '#94a3b8', "Call me later": '#f59e0b',
  "Contacted": '#0ea5e9', "Qualified": '#22c55e', "Negotiating": '#f97316',
  "Awaiting Payment": '#8b5cf6', "Booked": '#10b981', "Lost & Closed": '#ef4444',
  "Future Prospect": '#6366f1', "Just Checking": '#f472b6',
};

const CATEGORY_STYLES: Record<string, string> = {
  "Hot": "bg-red-100 text-red-700", "Warm": "bg-orange-100 text-orange-700",
  "Cold": "bg-sky-100 text-sky-700", "Repeating Customer": "bg-purple-100 text-purple-700",
  "Group": "bg-teal-100 text-teal-700", "None": "bg-gray-100 text-gray-500",
};

const AVATAR_COLORS = ['#4f46e5','#0891b2','#0d9488','#7c3aed','#db2777','#d97706','#16a34a'];

function getInitials(name?: string, email?: string): string {
  const src = name || email || '?';
  if (name) return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function avatarColor(uid: string): string {
  const code = uid.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function relativeDate(ts: any): string {
  if (!ts?.toDate) return 'Just now';
  const d = ts.toDate();
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 7 * 24 * 60 * 60 * 1000) return formatDistanceToNow(d, { addSuffix: true });
  return format(d, 'MMM d, yyyy');
}

export function LeadTable() {
  const { user, role, orgId } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orgName, setOrgName] = useState('Travlyy CRM');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeAssignee, setActiveAssignee] = useState('All');
  const [activeSource, setActiveSource] = useState('All');
  const [remarkText, setRemarkText] = useState('');
  const [activeRemarkLeadId, setActiveRemarkLeadId] = useState<string | null>(null);
  const [activeActionLeadId, setActiveActionLeadId] = useState<string | null>(null);
  const [activeStatusDropdownId, setActiveStatusDropdownId] = useState<string | null>(null);
  const [activeAssigneeDropdownId, setActiveAssigneeDropdownId] = useState<string | null>(null);
  const [whatsappLead, setWhatsappLead] = useState<any | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchAssignOpen, setBatchAssignOpen] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Clear selections on filter change
  useEffect(() => { setSelectedIds(new Set()); }, [activeTab, activeCategory, activeAssignee, activeSource]);

  useEffect(() => {
    if (!user || (!orgId && role !== 'superadmin')) return;
    const fetchUsers = async () => {
      let usersQuery = query(collection(db, 'users'));
      if (orgId) usersQuery = query(collection(db, 'users'), where('orgId', '==', orgId));
      const snap = await getDocs(usersQuery);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchUsers();
    // Fetch org name for email notifications
    if (orgId) {
      getDocs(query(collection(db, 'organizations'), where('__name__', '==', orgId)))
        .then(snap => { if (!snap.empty) setOrgName(snap.docs[0].data().name || 'Travlyy CRM'); })
        .catch(() => {});
    }

    let q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    if (orgId) q = query(collection(db, 'leads'), where('orgId', '==', orgId), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, snap => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    return () => unsub();
  }, [orgId, role, user]);

  // Keep indeterminate state on select-all checkbox
  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    el.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredLeads.length;
  });

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try { await updateDoc(doc(db, 'leads', leadId), { status: newStatus, updatedAt: serverTimestamp() }); }
    catch (e) { console.error(e); }
  };

  const sendAssignmentEmail = async (assigneeId: string, leadsToNotify: any[]) => {
    if (!assigneeId || !leadsToNotify.length) return;
    const assignee = users.find(u => u.uid === assigneeId);
    if (!assignee?.email) return;
    try {
      await fetch('/api/send-assignment-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeEmail: assignee.email,
          assigneeName: assignee.displayName || assignee.email,
          assignedByName: user?.displayName || user?.email || 'Your manager',
          orgName,
          leads: leadsToNotify.map(l => ({
            name: l.name, phone: l.phone, status: l.status,
            travelDate: l.travelDate, pax: l.pax, category: l.category,
          })),
        }),
      });
    } catch (e) {
      console.error('Email notification failed (non-blocking):', e);
    }
  };

  const handleAssigneeChange = async (leadId: string, assigneeId: string) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), { assigneeId, updatedAt: serverTimestamp() });
      // Find the lead and send email notification (fire-and-forget)
      const lead = leads.find(l => l.id === leadId);
      if (lead && assigneeId) sendAssignmentEmail(assigneeId, [lead]);
    }
    catch (e) { console.error(e); }
  };

  const handleAddRemark = async (leadId: string) => {
    if (!remarkText.trim() || !user) return;
    try {
      const data: any = { leadId, text: remarkText, authorId: user.uid, authorName: user.displayName || user.email, createdAt: serverTimestamp() };
      if (orgId) data.orgId = orgId;
      await addDoc(collection(db, 'remarks'), data);
      await updateDoc(doc(db, 'leads', leadId), { latestRemark: remarkText, updatedAt: serverTimestamp() });
      setRemarkText(''); setActiveRemarkLeadId(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    try { await deleteDoc(doc(db, 'leads', leadId)); } catch (e) { console.error(e); }
    setActiveActionLeadId(null);
  };

  const handleBatchAssign = async (assigneeId: string) => {
    const batch = writeBatch(db);
    selectedIds.forEach(id => batch.update(doc(db, 'leads', id), { assigneeId, updatedAt: serverTimestamp() }));
    await batch.commit();
    // Send ONE consolidated email with all assigned leads
    if (assigneeId) {
      const assignedLeads = leads.filter(l => selectedIds.has(l.id));
      sendAssignmentEmail(assigneeId, assignedLeads);
    }
    setSelectedIds(new Set()); setBatchAssignOpen(false);
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} leads? This cannot be undone.`)) return;
    const batch = writeBatch(db);
    selectedIds.forEach(id => batch.delete(doc(db, 'leads', id)));
    await batch.commit();
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const uniqueSources = Array.from(new Set(leads.map(l => l.source || 'Manual'))).filter(Boolean);

  const filteredLeads = leads.filter(lead => {
    if (activeTab !== 'All' && lead.status !== activeTab) return false;
    if (activeCategory !== 'All' && lead.category !== activeCategory) return false;
    if (activeAssignee !== 'All') {
      if (activeAssignee === 'Unassigned' && lead.assigneeId) return false;
      if (activeAssignee === 'Me' && lead.assigneeId !== user?.uid) return false;
      if (activeAssignee !== 'Unassigned' && activeAssignee !== 'Me' && lead.assigneeId !== activeAssignee) return false;
    }
    if (activeSource !== 'All' && (lead.source || 'Manual') !== activeSource) return false;
    return true;
  });

  const todaysLeadsCount = filteredLeads.filter(l => l.createdAt && isToday(l.createdAt.toDate())).length;
  const statusData = STATUSES.map(s => ({ name: s, value: filteredLeads.filter(l => l.status === s).length })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  const categoryData = CATEGORIES.map(c => ({ name: c, value: filteredLeads.filter(l => l.category === c).length })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading leads...</div>;

  const allSelected = filteredLeads.length > 0 && selectedIds.size === filteredLeads.length;

  return (
    <>
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── Status Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar px-3 py-3 border-b border-gray-200 bg-gray-50/60">
        <button
          onClick={() => setActiveTab('All')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-full transition-all border ${activeTab === 'All' ? 'bg-gray-900 text-white border-transparent shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}
        >
          All Leads
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'All' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{leads.length}</span>
        </button>
        {STATUSES.map(status => {
          const s = STATUS_STYLES[status];
          const count = leads.filter(l => l.status === status).length;
          const isActive = activeTab === status;
          return (
            <button key={status} onClick={() => setActiveTab(status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-full transition-all border ${isActive ? `${s.activeBg} text-white border-transparent shadow-sm` : `bg-white ${s.text} ${s.border} ${s.hoverBg}`}`}
            >
              {!isActive && <span className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />}
              {status}
              {count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/25 text-white' : s.badgeBg}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Filters Bar ── */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100">
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
          {['All', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >{cat}</button>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <select value={activeSource} onChange={e => setActiveSource(e.target.value)}
            className="text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="All">All Sources</option>
            {uniqueSources.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
          </select>
          <select value={activeAssignee} onChange={e => setActiveAssignee(e.target.value)}
            className="text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="All">All Assignees</option>
            <option value="Me">Assigned to Me</option>
            <option value="Unassigned">Unassigned</option>
            {users.map(u => <option key={u.id} value={u.uid}>{u.displayName || u.email}</option>)}
          </select>
          <button onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${showAnalytics ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </button>
        </div>
      </div>

      {/* ── Analytics ── */}
      {showAnalytics && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <Stats totalLeads={filteredLeads.length} todaysLeads={todaysLeadsCount} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads by Status</h3>
              <div className="h-60">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} width={110} />
                      <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-sm text-gray-400">No data</div>}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads by Category</h3>
              <div className="h-60">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                      <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-sm text-gray-400">No data</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Batch Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 border-b border-indigo-100">
          <button onClick={() => setSelectedIds(new Set())} className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors rounded">
            <X className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-indigo-700">{selectedIds.size} lead{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div className="w-px h-4 bg-indigo-200" />

          {/* Batch Assign */}
          <div className="relative">
            <button onClick={() => setBatchAssignOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <UserCheck className="w-3.5 h-3.5" />
              Assign to
              <ChevronDown className={`w-3 h-3 transition-transform ${batchAssignOpen ? 'rotate-180' : ''}`} />
            </button>
            {batchAssignOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setBatchAssignOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 overflow-hidden">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">Assign to</div>
                  <button onClick={() => handleBatchAssign('')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Users className="w-3 h-3 text-gray-400" />
                    </div>
                    Unassigned
                  </button>
                  {users.map(u => (
                    <button key={u.id} onClick={() => handleBatchAssign(u.uid)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 transition-colors">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
                        style={{ backgroundColor: avatarColor(u.uid) }}>
                        {getInitials(u.displayName, u.email)}
                      </div>
                      <span className="truncate">{u.displayName || u.email}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Batch Delete */}
          <button onClick={handleBatchDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>

          <span className="ml-auto text-[10px] text-indigo-400">Select all to apply to all {filteredLeads.length} leads</span>
        </div>
      )}

      {/* ── Mobile Card List ── */}
      <div className="block md:hidden divide-y divide-gray-100">
        {filteredLeads.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No leads found</p>
          </div>
        ) : filteredLeads.map(lead => {
          const s = STATUS_STYLES[lead.status];
          const isSelected = selectedIds.has(lead.id);
          const assignee = users.find(u => u.uid === lead.assigneeId);
          const isStatusOpen = activeStatusDropdownId === lead.id;
          const isAssigneeOpen = activeAssigneeDropdownId === lead.id;
          const isRemarkOpen = activeRemarkLeadId === lead.id;

          return (
            <div key={lead.id}
              style={{ borderLeft: `3px solid ${STATUS_HEX[lead.status] ?? '#e5e7eb'}` }}
              className={`px-4 py-3 ${isSelected ? 'bg-indigo-50/60' : 'bg-white'}`}
            >
              {/* Row 1: checkbox + name + action */}
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(lead.id)}
                  className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-900 text-sm truncate">{lead.name}</span>
                    <button onClick={() => setActiveActionLeadId(activeActionLeadId === lead.id ? null : lead.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md flex-shrink-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center flex-wrap gap-1 mt-1">
                    <span className="bg-gray-800 text-white px-1.5 py-0.5 rounded text-[10px] font-medium uppercase">{lead.source || 'Manual'}</span>
                    {lead.category && lead.category !== 'None' && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${CATEGORY_STYLES[lead.category] ?? 'bg-gray-100 text-gray-500'}`}>{lead.category}</span>
                    )}
                    <span className="text-[11px] text-gray-400 ml-1">{relativeDate(lead.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action menu */}
              {activeActionLeadId === lead.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setActiveActionLeadId(null)} />
                  <div className="absolute right-4 z-20 w-36 bg-white border border-gray-200 rounded-xl shadow-lg py-1">
                    <button onClick={() => handleDeleteLead(lead.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />Delete Lead
                    </button>
                  </div>
                </>
              )}

              {/* Row 2: phone + pax + date */}
              <div className="flex items-center gap-3 mt-2.5 pl-7">
                <span className="font-medium text-gray-700 text-xs">{lead.phone}</span>
                <a href={`tel:${lead.phone}`} className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><Phone className="w-3.5 h-3.5" /></a>
                <button onClick={() => setWhatsappLead(lead)} className="p-1.5 bg-green-50 text-green-500 rounded-lg"><MessageCircle className="w-3.5 h-3.5" /></button>
                <span className="text-[11px] text-gray-400 flex items-center gap-0.5"><Users className="w-3 h-3" />{lead.pax || 1} pax</span>
                {lead.travelDate && <span className="text-[11px] text-gray-400">· {lead.travelDate}</span>}
              </div>

              {/* Row 3: status + assignee */}
              <div className="flex items-center gap-2 mt-2.5 pl-7 relative">
                {s && (
                  <div className="relative flex-1">
                    <button onClick={() => setActiveStatusDropdownId(isStatusOpen ? null : lead.id)}
                      className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border-2 font-bold text-xs w-full ${s.bg} ${s.text} ${s.border}`}>
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                        <span className="truncate">{lead.status}</span>
                      </span>
                      <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isStatusOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveStatusDropdownId(null)} />
                        <div className="absolute left-0 top-full mt-1 z-20 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1 overflow-hidden">
                          {STATUSES.map(status => {
                            const opt = STATUS_STYLES[status];
                            const isCurrent = lead.status === status;
                            return (
                              <button key={status}
                                onClick={() => { handleStatusChange(lead.id, status); setActiveStatusDropdownId(null); }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors ${isCurrent ? `${opt.bg} ${opt.text}` : `text-gray-600 hover:${opt.bg} hover:${opt.text}`}`}>
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />{status}
                                {isCurrent && <Check className="w-3 h-3 ml-auto" />}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="relative">
                  <button onClick={() => setActiveAssigneeDropdownId(isAssigneeOpen ? null : lead.id)}
                    className="flex items-center gap-1.5 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors">
                    {assignee ? (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: avatarColor(assignee.uid) }}>
                        {getInitials(assignee.displayName, assignee.email)}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <UserPlus className="w-3 h-3 text-gray-400" />
                      </div>
                    )}
                  </button>
                  {isAssigneeOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveAssigneeDropdownId(null)} />
                      <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 overflow-hidden">
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">Assign to</div>
                        <button onClick={() => { handleAssigneeChange(lead.id, ''); setActiveAssigneeDropdownId(null); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                          <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                            <Users className="w-3 h-3 text-gray-400" />
                          </div>
                          Unassigned{!lead.assigneeId && <Check className="w-3 h-3 ml-auto text-indigo-500" />}
                        </button>
                        {users.map(u => (
                          <button key={u.id} onClick={() => { handleAssigneeChange(lead.id, u.uid); setActiveAssigneeDropdownId(null); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 transition-colors">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                              style={{ backgroundColor: avatarColor(u.uid) }}>
                              {getInitials(u.displayName, u.email)}
                            </div>
                            <span className="truncate">{u.displayName || u.email}</span>
                            {lead.assigneeId === u.uid && <Check className="w-3 h-3 ml-auto text-indigo-500" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Row 4: remark */}
              <div className="mt-2 pl-7">
                {isRemarkOpen ? (
                  <div className="flex flex-col gap-1.5">
                    <textarea value={remarkText} onChange={e => setRemarkText(e.target.value)}
                      className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 resize-none"
                      placeholder="Add remark…" rows={2} autoFocus />
                    <div className="flex gap-1.5">
                      <button onClick={() => handleAddRemark(lead.id)}
                        className="text-[11px] bg-indigo-600 text-white px-2 py-1 rounded-md hover:bg-indigo-700 font-medium">Save</button>
                      <button onClick={() => setActiveRemarkLeadId(null)}
                        className="text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md hover:bg-gray-200">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setActiveRemarkLeadId(lead.id)}
                    className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-indigo-600 transition-colors">
                    <Plus className="w-3 h-3" />
                    {lead.latestRemark
                      ? <span className="italic text-gray-500 line-clamp-1">{lead.latestRemark}</span>
                      : <span>Add remark</span>
                    }
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Table (desktop) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-[11px] uppercase font-semibold text-gray-400 border-b border-gray-200 tracking-wide">
            <tr>
              <th className="pl-4 pr-2 py-2.5 w-10">
                <input ref={selectAllRef} type="checkbox"
                  checked={allSelected}
                  onChange={() => setSelectedIds(allSelected ? new Set() : new Set(filteredLeads.map(l => l.id)))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
              </th>
              <th className="px-3 py-2.5">Lead</th>
              <th className="px-3 py-2.5">Contact</th>
              <th className="px-3 py-2.5 w-52">Latest Remark</th>
              <th className="px-3 py-2.5 w-44">Status</th>
              <th className="px-3 py-2.5 w-36">Assignee</th>
              <th className="px-3 py-2.5 w-10 text-center">·</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No leads found</p>
                </td>
              </tr>
            ) : filteredLeads.map(lead => {
              const s = STATUS_STYLES[lead.status];
              const isSelected = selectedIds.has(lead.id);
              const assignee = users.find(u => u.uid === lead.assigneeId);
              const isStatusOpen = activeStatusDropdownId === lead.id;
              const isAssigneeOpen = activeAssigneeDropdownId === lead.id;
              const isActionOpen = activeActionLeadId === lead.id;

              return (
                <tr key={lead.id}
                  style={{ borderLeft: `3px solid ${STATUS_HEX[lead.status] ?? '#e5e7eb'}` }}
                  className={`transition-colors group ${isSelected ? 'bg-indigo-50/60' : 'hover:bg-gray-50/60'}`}
                >
                  {/* Checkbox */}
                  <td className="pl-3 pr-2 py-3 w-10">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(lead.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                  </td>

                  {/* Lead Details */}
                  <td className="px-3 py-3 min-w-[180px]">
                    <div className="font-semibold text-gray-900 text-sm leading-tight mb-1">{lead.name}</div>
                    <div className="flex items-center flex-wrap gap-1 mb-1">
                      <span className="bg-gray-800 text-white px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase">
                        {lead.source || 'Manual'}
                      </span>
                      {lead.category && lead.category !== 'None' && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${CATEGORY_STYLES[lead.category] ?? 'bg-gray-100 text-gray-500'}`}>
                          {lead.category}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400">{relativeDate(lead.createdAt)}</div>
                  </td>

                  {/* Contact */}
                  <td className="px-3 py-3 min-w-[160px]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="font-medium text-gray-700 text-xs">{lead.phone}</span>
                      <button onClick={() => setWhatsappLead(lead)} title="WhatsApp"
                        className="text-green-500 hover:text-green-600 transition-colors flex-shrink-0">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <a href={`tel:${lead.phone}`} title="Call"
                        className="text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{lead.pax || 1} pax</span>
                      {lead.travelDate && <span>· {lead.travelDate}</span>}
                    </div>
                  </td>

                  {/* Latest Remark */}
                  <td className="px-3 py-3 w-52">
                    {activeRemarkLeadId === lead.id ? (
                      <div className="flex flex-col gap-1.5">
                        <textarea value={remarkText} onChange={e => setRemarkText(e.target.value)}
                          className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 resize-none"
                          placeholder="Add remark…" rows={2} autoFocus />
                        <div className="flex gap-1.5">
                          <button onClick={() => handleAddRemark(lead.id)}
                            className="text-[11px] bg-indigo-600 text-white px-2 py-1 rounded-md hover:bg-indigo-700 font-medium">Save</button>
                          <button onClick={() => setActiveRemarkLeadId(null)}
                            className="text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md hover:bg-gray-200">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5 group/remark">
                        <button onClick={() => setActiveRemarkLeadId(lead.id)} title="Add remark"
                          className="flex-shrink-0 mt-0.5 p-1 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                        {lead.latestRemark
                          ? <p className="text-[11px] text-gray-500 italic leading-relaxed line-clamp-2" title={lead.latestRemark}>{lead.latestRemark}</p>
                          : <p className="text-[11px] text-gray-300">No remarks yet</p>
                        }
                      </div>
                    )}
                  </td>

                  {/* Status dropdown */}
                  <td className="px-3 py-3 w-44 relative">
                    {s ? (
                      <>
                        <button onClick={() => setActiveStatusDropdownId(isStatusOpen ? null : lead.id)}
                          className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border-2 font-bold text-xs transition-all ${s.bg} ${s.text} ${s.border}`}>
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                            <span className="truncate">{lead.status}</span>
                          </span>
                          <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isStatusOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveStatusDropdownId(null)} />
                            <div className="absolute left-0 top-full mt-1 z-20 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1 overflow-hidden">
                              {STATUSES.map(status => {
                                const opt = STATUS_STYLES[status];
                                const isCurrent = lead.status === status;
                                return (
                                  <button key={status}
                                    onClick={() => { handleStatusChange(lead.id, status); setActiveStatusDropdownId(null); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors ${isCurrent ? `${opt.bg} ${opt.text}` : `text-gray-600 hover:${opt.bg} hover:${opt.text}`}`}>
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />
                                    {status}
                                    {isCurrent && <Check className="w-3 h-3 ml-auto" />}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </>
                    ) : null}
                  </td>

                  {/* Assignee avatar */}
                  <td className="px-3 py-3 w-36 relative">
                    <button onClick={() => setActiveAssigneeDropdownId(isAssigneeOpen ? null : lead.id)}
                      className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-1.5 py-1 transition-colors w-full">
                      {assignee ? (
                        <>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ backgroundColor: avatarColor(assignee.uid) }}>
                            {getInitials(assignee.displayName, assignee.email)}
                          </div>
                          <span className="text-xs text-gray-700 truncate font-medium">{assignee.displayName?.split(' ')[0] || assignee.email?.split('@')[0]}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                            <UserPlus className="w-3 h-3 text-gray-400" />
                          </div>
                          <span className="text-xs text-gray-400">Unassigned</span>
                        </>
                      )}
                    </button>
                    {isAssigneeOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveAssigneeDropdownId(null)} />
                        <div className="absolute left-0 top-full mt-1 z-20 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 overflow-hidden">
                          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">Assign to</div>
                          <button onClick={() => { handleAssigneeChange(lead.id, ''); setActiveAssigneeDropdownId(null); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                              <Users className="w-3 h-3 text-gray-400" />
                            </div>
                            Unassigned
                            {!lead.assigneeId && <Check className="w-3 h-3 ml-auto text-indigo-500" />}
                          </button>
                          {users.map(u => (
                            <button key={u.id} onClick={() => { handleAssigneeChange(lead.id, u.uid); setActiveAssigneeDropdownId(null); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 transition-colors">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                                style={{ backgroundColor: avatarColor(u.uid) }}>
                                {getInitials(u.displayName, u.email)}
                              </div>
                              <span className="truncate">{u.displayName || u.email}</span>
                              {lead.assigneeId === u.uid && <Check className="w-3 h-3 ml-auto text-indigo-500" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </td>

                  {/* Actions ⋯ */}
                  <td className="px-2 py-3 w-10 relative">
                    <button onClick={() => setActiveActionLeadId(isActionOpen ? null : lead.id)}
                      className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {isActionOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveActionLeadId(null)} />
                        <div className="absolute right-2 top-8 z-20 w-36 bg-white border border-gray-200 rounded-xl shadow-lg py-1">
                          <button onClick={() => handleDeleteLead(lead.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Lead
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Table footer ── */}
      {filteredLeads.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <span className="text-xs text-gray-400">Showing {filteredLeads.length} of {leads.length} leads</span>
          {selectedIds.size > 0 && (
            <span className="text-xs font-semibold text-indigo-600">{selectedIds.size} selected</span>
          )}
        </div>
      )}
    </div>

    {whatsappLead && <WhatsAppModal lead={whatsappLead} onClose={() => setWhatsappLead(null)} />}
    </>
  );
}

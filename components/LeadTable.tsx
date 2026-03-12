'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import { format, isToday } from 'date-fns';
import { Phone, MessageCircle, Plus, MoreHorizontal, Check, Users, BarChart3 } from 'lucide-react';
import { Stats } from './Stats';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const STATUSES = [
  "New Enquiry", "Call Not Picked", "Call me later", "Contacted", 
  "Qualified", "Negotiating", "Awaiting Payment", "Booked", 
  "Lost & Closed", "Future Prospect", "Just Checking"
];

const CATEGORIES = ["Hot", "Warm", "Cold", "Repeating Customer", "Group", "None"];
const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#84cc16'];

export function LeadTable() {
  const { user, role, orgId } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeAssignee, setActiveAssignee] = useState('All');
  const [activeSource, setActiveSource] = useState('All');
  const [remarkText, setRemarkText] = useState('');
  const [activeRemarkLeadId, setActiveRemarkLeadId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (!user || (!orgId && role !== 'superadmin')) return;

    // Fetch users for assignee dropdown
    const fetchUsers = async () => {
      let usersQuery = query(collection(db, 'users'));
      if (orgId) {
        usersQuery = query(collection(db, 'users'), where('orgId', '==', orgId));
      }
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    };
    fetchUsers();

    // Listen to leads
    let q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    if (orgId) {
      q = query(collection(db, 'leads'), where('orgId', '==', orgId), orderBy('createdAt', 'desc'));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(leadsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leads:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orgId, role, user]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleAssigneeChange = async (leadId: string, newAssigneeId: string) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), {
        assigneeId: newAssigneeId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating assignee:", error);
    }
  };

  const handleAddRemark = async (leadId: string) => {
    if (!remarkText.trim() || !user) return;

    try {
      // Add remark to subcollection or separate collection
      const remarkData: any = {
        leadId,
        text: remarkText,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        createdAt: serverTimestamp()
      };
      if (orgId) remarkData.orgId = orgId;

      await addDoc(collection(db, 'remarks'), remarkData);

      // Update lead's latest remark
      await updateDoc(doc(db, 'leads', leadId), {
        latestRemark: remarkText,
        updatedAt: serverTimestamp()
      });

      setRemarkText('');
      setActiveRemarkLeadId(null);
    } catch (error) {
      console.error("Error adding remark:", error);
    }
  };

  // Extract unique sources for the filter dropdown
  const uniqueSources = Array.from(new Set(leads.map(lead => lead.source || 'Manual'))).filter(Boolean);

  const filteredLeads = leads.filter(lead => {
    if (activeTab !== 'All' && lead.status !== activeTab) return false;
    if (activeCategory !== 'All' && lead.category !== activeCategory) return false;
    
    if (activeAssignee !== 'All') {
      if (activeAssignee === 'Unassigned' && lead.assigneeId) return false;
      if (activeAssignee === 'Me' && lead.assigneeId !== user?.uid) return false;
      if (activeAssignee !== 'Unassigned' && activeAssignee !== 'Me' && lead.assigneeId !== activeAssignee) return false;
    }

    if (activeSource !== 'All') {
      const leadSource = lead.source || 'Manual';
      if (leadSource !== activeSource) return false;
    }

    return true;
  });

  const todaysLeadsCount = filteredLeads.filter(lead => lead.createdAt && isToday(lead.createdAt.toDate())).length;

  const statusData = STATUSES.map(status => ({
    name: status,
    value: filteredLeads.filter(l => l.status === status).length
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  const categoryData = CATEGORIES.map(cat => ({
    name: cat,
    value: filteredLeads.filter(l => l.category === cat).length
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading leads...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 hide-scrollbar">
        <button 
          onClick={() => setActiveTab('All')}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'All' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          All Leads
        </button>
        {STATUSES.map(status => (
          <button 
            key={status}
            onClick={() => setActiveTab(status)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === status ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Categories & Filters */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveCategory('All')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${activeCategory === 'All' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${activeCategory === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Source:</span>
            <select
              value={activeSource}
              onChange={(e) => setActiveSource(e.target.value)}
              className="text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Sources</option>
              {uniqueSources.map(source => (
                <option key={source as string} value={source as string}>{source as string}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Assignee:</span>
            <select
              value={activeAssignee}
              onChange={(e) => setActiveAssignee(e.target.value)}
              className="text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Assignees</option>
              <option value="Me">Assigned to Me</option>
              <option value="Unassigned">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.uid}>{u.displayName || u.email}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${showAnalytics ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            <BarChart3 className="w-4 h-4" />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
        </div>
      </div>

      {showAnalytics && (
        <div className="p-6 bg-gray-50 border-b border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <Stats totalLeads={filteredLeads.length} todaysLeads={todaysLeadsCount} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-6">Leads by Status</h3>
              <div className="h-64">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={100} />
                      <Tooltip 
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">No data available</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-6">Leads by Category</h3>
              <div className="h-64">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">No data available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-12 text-center">
                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              </th>
              <th className="px-4 py-3">Lead Details</th>
              <th className="px-4 py-3">Enquiry Details</th>
              <th className="px-4 py-3 w-64">Remarks & Reminders</th>
              <th className="px-4 py-3 w-48">Status</th>
              <th className="px-4 py-3 w-40">Assignee</th>
              <th className="px-4 py-3 w-24 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No leads found.</td>
              </tr>
            ) : (
              filteredLeads.map((lead, index) => (
                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-4 py-4 text-center">
                    <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900 text-base mb-1">{lead.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span className="bg-gray-900 text-white px-1.5 py-0.5 rounded font-medium tracking-wide text-[10px] uppercase">
                        {lead.source || 'Manual'}
                      </span>
                      {lead.sourceId && <span>| ID: {lead.sourceId}</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      {lead.createdAt?.toDate ? format(lead.createdAt.toDate(), 'MMM d, yyyy h:mm a') : 'Just now'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-700">{lead.phone}</span>
                      <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-green-500 hover:text-green-600 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <a href={`tel:${lead.phone}`} className="text-blue-500 hover:text-blue-600 transition-colors">
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-col gap-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {lead.pax || 1} Pax
                      </span>
                      <span className="flex items-center gap-1">
                        Travel: {lead.travelDate || 'Not specified'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    {activeRemarkLeadId === lead.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea 
                          value={remarkText}
                          onChange={(e) => setRemarkText(e.target.value)}
                          className="w-full text-xs p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Type remark..."
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAddRemark(lead.id)}
                            className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setActiveRemarkLeadId(null)}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => setActiveRemarkLeadId(lead.id)}
                          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors w-fit"
                        >
                          <Plus className="w-3 h-3" /> Add Remark
                        </button>
                        {lead.latestRemark && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 line-clamp-2">
                            {lead.latestRemark}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <select 
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className="w-full text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {STATUSES.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <select 
                      value={lead.assigneeId || ''}
                      onChange={(e) => handleAssigneeChange(lead.id, e.target.value)}
                      className="w-full text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u.id} value={u.uid}>{u.displayName || u.email}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

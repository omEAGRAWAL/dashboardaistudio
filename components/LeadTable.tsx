'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import { format } from 'date-fns';
import { Phone, MessageCircle, Plus, MoreHorizontal, Check, Users } from 'lucide-react';

const STATUSES = [
  "New Enquiry", "Call Not Picked", "Call me later", "Contacted", 
  "Qualified", "Negotiating", "Awaiting Payment", "Booked", 
  "Lost & Closed", "Future Prospect", "Just Checking"
];

const CATEGORIES = ["Hot", "Warm", "Cold", "Repeating Customer", "Group", "None"];

export function LeadTable() {
  const { user, role } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeAssignee, setActiveAssignee] = useState('All');
  const [remarkText, setRemarkText] = useState('');
  const [activeRemarkLeadId, setActiveRemarkLeadId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch users for assignee dropdown
    const fetchUsers = async () => {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    };
    fetchUsers();

    // Listen to leads
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(leadsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leads:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      await addDoc(collection(db, 'remarks'), {
        leadId,
        text: remarkText,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        createdAt: serverTimestamp()
      });

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

  const filteredLeads = leads.filter(lead => {
    if (activeTab !== 'All' && lead.status !== activeTab) return false;
    if (activeCategory !== 'All' && lead.category !== activeCategory) return false;
    if (activeAssignee !== 'All') {
      if (activeAssignee === 'Unassigned' && lead.assigneeId) return false;
      if (activeAssignee !== 'Unassigned' && lead.assigneeId !== activeAssignee) return false;
    }
    return true;
  });

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

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Assignee:</span>
          <select
            value={activeAssignee}
            onChange={(e) => setActiveAssignee(e.target.value)}
            className="text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Assignees</option>
            <option value="Unassigned">Unassigned</option>
            {users.map(u => (
              <option key={u.id} value={u.uid}>{u.displayName || u.email}</option>
            ))}
          </select>
        </div>
      </div>

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

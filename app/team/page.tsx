'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserPlus, Trash2, Mail, Shield, User } from 'lucide-react';

export default function TeamPage() {
  const { user, orgId, role, loading } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!orgId) return;

    // Listen to team members
    const usersQuery = query(collection(db, 'users'), where('orgId', '==', orgId));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeamMembers(usersData);
    });

    // Listen to pending invites
    const invitesQuery = query(collection(db, 'invites'), where('orgId', '==', orgId));
    const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
      const invitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvites(invitesData);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeInvites();
    };
  }, [orgId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !orgId) return;

    setIsInviting(true);
    setError('');
    setSuccess('');

    try {
      // Check if user is already in the team
      if (teamMembers.some(m => m.email === inviteEmail.trim())) {
        throw new Error('User is already in the team.');
      }

      // Check if invite already exists
      if (invites.some(i => i.email === inviteEmail.trim())) {
        throw new Error('An invite has already been sent to this email.');
      }

      await addDoc(collection(db, 'invites'), {
        email: inviteEmail.trim(),
        orgId: orgId,
        role: inviteRole,
        createdAt: serverTimestamp(),
      });

      setSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('agent');
    } catch (err: any) {
      console.error('Error inviting user:', err);
      setError(err.message || 'Failed to send invite.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await deleteDoc(doc(db, 'invites', inviteId));
    } catch (err) {
      console.error('Error revoking invite:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || (role !== 'org_admin' && role !== 'superadmin')) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 flex items-center justify-center">
            <div className="text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
              <p className="text-gray-500 mt-2">You need organization admin privileges to view this page.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Management</h1>
              <p className="text-gray-500 mt-1">Manage your agency members and send invites.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Invite Form */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                    Invite Member
                  </h2>
                  
                  {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">{error}</div>}
                  {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100">{success}</div>}

                  <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="agent@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      >
                        <option value="agent">Agent (Can manage leads)</option>
                        <option value="org_admin">Admin (Can manage team)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isInviting || !inviteEmail.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isInviting ? 'Sending...' : 'Send Invite'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Team Members List */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Active Members */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-500" />
                      Active Members
                    </h2>
                    <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2.5 rounded-full text-xs font-medium">
                      {teamMembers.length}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {teamMembers.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-sm">No team members found.</div>
                    ) : (
                      teamMembers.map((member) => (
                        <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            {member.photoURL ? (
                              <img src={member.photoURL} alt={member.displayName} className="w-10 h-10 rounded-full bg-gray-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                {member.displayName?.charAt(0) || member.email?.charAt(0) || '?'}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{member.displayName || 'No name'}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              member.role === 'org_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {member.role === 'org_admin' ? 'Admin' : 'Agent'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pending Invites */}
                {invites.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-gray-500" />
                        Pending Invites
                      </h2>
                      <span className="bg-amber-100 text-amber-700 py-0.5 px-2.5 rounded-full text-xs font-medium">
                        {invites.length}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {invites.map((invite) => (
                        <div key={invite.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                            <p className="text-xs text-gray-500">
                              Invited as {invite.role === 'org_admin' ? 'Admin' : 'Agent'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRevokeInvite(invite.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Revoke Invite"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

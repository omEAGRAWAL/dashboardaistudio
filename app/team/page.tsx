'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, getDoc, serverTimestamp, deleteField,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  UserPlus, Trash2, Mail, Shield, User, ToggleLeft, ToggleRight,
  Eye, EyeOff, KeyRound, Lock, CheckCircle, AlertCircle, RefreshCw,
} from 'lucide-react';

// ── Password Manager Modal ────────────────────────────────────────────────────
function PasswordModal({
  member,
  currentUserId,
  onClose,
}: {
  member: any;
  currentUserId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [passwordPlain, setPasswordPlain] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [changing, setChanging] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch password from the admin API
    fetch('/api/org-members', {
      headers: { 'x-uid': currentUserId },
    })
      .then((r) => r.json())
      .then((data) => {
        const found = data.members?.find((m: any) => m.uid === member.id);
        setPasswordPlain(found?.passwordPlain ?? null);
      })
      .catch(() => setPasswordPlain(null))
      .finally(() => setLoading(false));
  }, [member.id, currentUserId]);

  const handleChangePassword = async () => {
    if (!newPass.trim() || newPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setChanging(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/org-members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-uid': currentUserId },
        body: JSON.stringify({ targetUid: member.id, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPasswordPlain(newPass);
      setNewPass('');
      setMessage('Password changed successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
            {member.displayName?.charAt(0) || member.email?.charAt(0) || '?'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base">{member.displayName || 'No name'}</h3>
            <p className="text-xs text-gray-500">{member.email}</p>
          </div>
        </div>

        {/* Current Password */}
        <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Current Password</p>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Loading…
            </div>
          ) : member.authMethod === 'google' || !passwordPlain ? (
            <p className="text-sm text-gray-500 italic">
              {member.authMethod === 'google'
                ? 'This member signed up via Google — no password stored.'
                : 'No password on record (invited via email link).'}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-gray-800">
                {showPass ? passwordPlain : '•'.repeat(passwordPlain.length)}
              </code>
              <button
                onClick={() => setShowPass((v) => !v)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                title={showPass ? 'Hide' : 'Show'}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Set New Password</p>

          {message && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-lg">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {message}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={changing || !newPass.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {changing ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            {changing ? 'Saving…' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const { user, orgId, role, loading } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [orgName, setOrgName] = useState('');

  // Invite flow
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [isInviting, setIsInviting] = useState(false);

  // Create with password flow
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createName, setCreateName] = useState('');
  const [createRole, setCreateRole] = useState('agent');
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Invite / Create tabs
  const [formTab, setFormTab] = useState<'invite' | 'create'>('invite');

  // Password modal
  const [passModal, setPassModal] = useState<any | null>(null);

  useEffect(() => {
    if (!orgId) return;

    getDoc(doc(db, 'organizations', orgId)).then(snap => {
      if (snap.exists()) setOrgName(snap.data().name || '');
    });

    const usersQuery = query(collection(db, 'users'), where('orgId', '==', orgId));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setTeamMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const invitesQuery = query(collection(db, 'invites'), where('orgId', '==', orgId));
    const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
      setInvites(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubscribeUsers(); unsubscribeInvites(); };
  }, [orgId]);

  const sendRoleNotification = async (payload: Record<string, any>) => {
    try {
      await fetch('/api/send-role-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, changedByName: user?.displayName || user?.email || 'Admin', ...payload }),
      });
    } catch (e) {
      console.error('Role notification email failed (non-blocking):', e);
    }
  };

  // ── Invite via email link ──────────────────────────────────────────────────
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !orgId) return;
    setIsInviting(true);
    setError('');
    setSuccess('');
    try {
      if (teamMembers.some(m => m.email === inviteEmail.trim())) throw new Error('User is already in the team.');
      if (invites.some(i => i.email === inviteEmail.trim())) throw new Error('An invite has already been sent to this email.');

      await addDoc(collection(db, 'invites'), {
        email: inviteEmail.trim(),
        orgId,
        role: inviteRole,
        createdAt: serverTimestamp(),
      });

      sendRoleNotification({ targetEmail: inviteEmail.trim(), targetName: inviteEmail.split('@')[0], type: 'invited', inviteRole });
      setSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('agent');
    } catch (err: any) {
      setError(err.message || 'Failed to send invite.');
    } finally {
      setIsInviting(false);
    }
  };

  // ── Create with email + password ───────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim() || !createPassword.trim() || !orgId || !user) return;
    setIsCreating(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/org-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-uid': user.uid },
        body: JSON.stringify({
          email: createEmail.trim(),
          password: createPassword,
          role: createRole,
          displayName: createName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create member.');
      setSuccess(`${createRole === 'org_admin' ? 'Admin' : 'Agent'} account created for ${createEmail}.`);
      setCreateEmail('');
      setCreatePassword('');
      setCreateName('');
      setCreateRole('agent');
    } catch (err: any) {
      setError(err.message || 'Failed to create member.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try { await deleteDoc(doc(db, 'invites', inviteId)); } catch (err) { console.error(err); }
  };

  const handleRoleChange = async (member: any, newRole: string) => {
    if (member.role === newRole) return;
    try {
      await updateDoc(doc(db, 'users', member.id), { role: newRole });
      sendRoleNotification({ targetEmail: member.email, targetName: member.displayName || member.email, type: 'role_changed', newRole });
    } catch (err) { console.error(err); }
  };

  const handleToggleAssignment = async (member: any) => {
    const newValue = member.assignmentActive === false ? true : false;
    try {
      await updateDoc(doc(db, 'users', member.id), { assignmentActive: newValue });
    } catch (err: any) {
      console.error('[handleToggleAssignment]', err);
      setError(err?.message || 'Failed to update assignment status. Check Firestore rules.');
    }
  };

  const handleRemoveMember = async (member: any) => {
    const name = member.displayName || member.email;
    if (!window.confirm(`Remove ${name} from the team? They will immediately lose all access.`)) return;
    try {
      await updateDoc(doc(db, 'users', member.id), { orgId: deleteField(), status: 'suspended' });
      sendRoleNotification({ targetEmail: member.email, targetName: member.displayName || member.email, type: 'removed' });
    } catch (err) { console.error(err); }
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
              <p className="text-gray-500 mt-1">Add agents &amp; admins to your organization.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left: Add Member Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                  {/* Tab bar */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => { setFormTab('invite'); setError(''); setSuccess(''); }}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${
                        formTab === 'invite'
                          ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Mail className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                      Invite Link
                    </button>
                    <button
                      onClick={() => { setFormTab('create'); setError(''); setSuccess(''); }}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${
                        formTab === 'create'
                          ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <UserPlus className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                      With Password
                    </button>
                  </div>

                  <div className="p-5">
                    {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}</div>}
                    {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100 flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{success}</div>}

                    {/* ── Invite via link ── */}
                    {formTab === 'invite' && (
                      <form onSubmit={handleInvite} className="space-y-4">
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Send an invite email. The member must sign in with Google to accept it.
                        </p>
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
                          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 text-sm"
                        >
                          {isInviting ? 'Sending…' : 'Send Invite'}
                        </button>
                      </form>
                    )}

                    {/* ── Create with password ── */}
                    {formTab === 'create' && (
                      <form onSubmit={handleCreate} className="space-y-4">
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Create an account with email &amp; password. The member can log in immediately using the Email &amp; Password tab on the login page.
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-gray-400 font-normal">(optional)</span></label>
                          <input
                            type="text"
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            placeholder="e.g. Priya Sharma"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                          <input
                            type="email"
                            required
                            value={createEmail}
                            onChange={(e) => setCreateEmail(e.target.value)}
                            placeholder="agent@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                          <div className="relative">
                            <input
                              type={showCreatePass ? 'text' : 'password'}
                              required
                              minLength={6}
                              value={createPassword}
                              onChange={(e) => setCreatePassword(e.target.value)}
                              placeholder="Min 6 characters"
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCreatePass(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              tabIndex={-1}
                            >
                              {showCreatePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            value={createRole}
                            onChange={(e) => setCreateRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          >
                            <option value="agent">Agent (Can manage leads)</option>
                            <option value="org_admin">Admin (Can manage team)</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={isCreating || !createEmail.trim() || !createPassword.trim()}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 text-sm"
                        >
                          {isCreating ? (
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                          {isCreating ? 'Creating…' : 'Create Account'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Members List */}
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
                      teamMembers.map((member) => {
                        const isSelf = member.id === user.uid;
                        const hasPassword = member.authMethod === 'email_password';
                        return (
                          <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              {member.photoURL ? (
                                <img src={member.photoURL} alt={member.displayName} className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                                  {member.displayName?.charAt(0) || member.email?.charAt(0) || '?'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {member.displayName || 'No name'}
                                  {isSelf && <span className="ml-1.5 text-xs text-gray-400">(you)</span>}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                {hasPassword && (
                                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                                    <Lock className="w-3 h-3" />
                                    Password login
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                              {/* Assignment toggle */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleToggleAssignment(member)}
                                  title={member.assignmentActive === false ? 'Inactive — click to activate' : 'Active — click to deactivate'}
                                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border transition-colors ${
                                    member.assignmentActive === false
                                      ? 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-gray-100 hover:text-gray-500 hover:border-gray-200'
                                  }`}
                                >
                                  {member.assignmentActive === false
                                    ? <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>
                                    : <><ToggleRight className="w-3.5 h-3.5" /> Active</>
                                  }
                                </button>
                              )}

                              {/* Role select */}
                              <select
                                value={member.role}
                                disabled={isSelf}
                                onChange={(e) => handleRoleChange(member, e.target.value)}
                                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                                  member.role === 'org_admin'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                } ${isSelf ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                              >
                                <option value="agent">Agent</option>
                                <option value="org_admin">Admin</option>
                              </select>

                              {/* Password manager button (only for password-login members, non-self) */}
                              {!isSelf && (
                                <button
                                  onClick={() => setPassModal(member)}
                                  title="Manage password"
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    hasPassword
                                      ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                                      : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>
                              )}

                              {/* Remove */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleRemoveMember(member)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove from team"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
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

      {/* Password Modal */}
      {passModal && (
        <PasswordModal
          member={passModal}
          currentUserId={user.uid}
          onClose={() => setPassModal(null)}
        />
      )}
    </div>
  );
}

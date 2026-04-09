'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Building2, Save, Loader2, CheckCircle2, Upload, X, Info } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli', 'Daman & Diu',
  'Lakshadweep', 'Puducherry',
];

const STATE_CODES: Record<string, string> = {
  'Andhra Pradesh': '37', 'Arunachal Pradesh': '12', 'Assam': '18', 'Bihar': '10',
  'Chhattisgarh': '22', 'Goa': '30', 'Gujarat': '24', 'Haryana': '06',
  'Himachal Pradesh': '02', 'Jharkhand': '20', 'Karnataka': '29', 'Kerala': '32',
  'Madhya Pradesh': '23', 'Maharashtra': '27', 'Manipur': '14', 'Meghalaya': '17',
  'Mizoram': '15', 'Nagaland': '13', 'Odisha': '21', 'Punjab': '03', 'Rajasthan': '08',
  'Sikkim': '11', 'Tamil Nadu': '33', 'Telangana': '36', 'Tripura': '16',
  'Uttar Pradesh': '09', 'Uttarakhand': '05', 'West Bengal': '19', 'Delhi': '07',
  'Jammu & Kashmir': '01', 'Ladakh': '38',
};

const GST_RATES = [0, 5, 12, 18, 28];

const EMPTY_PROFILE = {
  agencyName: '',
  registeredName: '',
  address: '',
  state: '',
  stateCode: '',
  contactPhone: '',
  contactEmail: '',
  logoUrl: '',
  gstNumber: '',
  gstRate: 5,
  gstType: 'sgst_cgst' as 'igst' | 'sgst_cgst',
  bankName: '',
  bankAccount: '',
  bankIfsc: '',
};

export default function BusinessProfilePage() {
  const { user, orgId, role } = useAuth();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'business_profiles', orgId));
        if (snap.exists()) {
          setProfile({ ...EMPTY_PROFILE, ...snap.data() } as typeof EMPTY_PROFILE);
        }
      } catch (err) {
        console.error('Error loading business profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [orgId]);

  const handleStateChange = (state: string) => {
    setProfile(prev => ({
      ...prev,
      state,
      stateCode: STATE_CODES[state] || prev.stateCode,
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!data.secure_url) {
        throw new Error(data.error || 'Upload failed — no URL returned');
      }
      setProfile(prev => ({ ...prev, logoUrl: data.secure_url }));
    } catch (err) {
      console.error('Logo upload error:', err);
      alert(`Failed to upload logo: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      // Strip undefined values — Firestore rejects them
      const clean = Object.fromEntries(
        Object.entries({ ...profile, orgId }).filter(([, v]) => v !== undefined)
      );
      await setDoc(doc(db, 'business_profiles', orgId), clean, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save business profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user || !orgId) return null;

  const inp = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50 focus:bg-white transition-colors';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                  Business Profile
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Your agency details for invoices, emails, and branding.
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-400">Loading profile...</div>
            ) : (
              <div className="space-y-6">
                {/* Agency Identity */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80">
                    <h2 className="text-base font-semibold text-gray-900">Agency Identity</h2>
                    <p className="text-xs text-gray-400 mt-0.5">This appears on your invoice header</p>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Logo Upload */}
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <label className="text-sm font-semibold text-gray-700 block mb-2">Agency Logo</label>
                        <div className="relative group w-28 h-28">
                          {profile.logoUrl ? (
                            <>
                              <div className="w-28 h-28 rounded-xl border-2 border-gray-200 overflow-hidden bg-white shadow-sm">
                                <img src={profile.logoUrl} alt="Agency logo preview" className="w-full h-full object-contain p-1" />
                              </div>
                              {/* Hover overlay: Change / Remove */}
                              <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 pointer-events-none group-hover:pointer-events-auto">
                                <label className="cursor-pointer flex items-center gap-1 text-white text-xs font-medium bg-white/20 hover:bg-white/30 px-2.5 py-1.5 rounded-lg transition-colors">
                                  <Upload className="w-3 h-3" /> Change
                                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setProfile(prev => ({ ...prev, logoUrl: '' }))}
                                  className="flex items-center gap-1 text-white text-xs font-medium bg-red-500/70 hover:bg-red-600 px-2.5 py-1.5 rounded-lg transition-colors"
                                >
                                  <X className="w-3 h-3" /> Remove
                                </button>
                              </div>
                              {/* Uploading overlay (replacing) */}
                              {uploading && (
                                <div className="absolute inset-0 rounded-xl bg-white/80 flex items-center justify-center">
                                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                </div>
                              )}
                            </>
                          ) : (
                            <label className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                              {uploading ? (
                                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                                  <span className="text-[10px] text-gray-400 font-medium text-center leading-tight px-1">Click to upload</span>
                                </>
                              )}
                              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1.5 text-center w-28">PNG, JPG · max 2 MB</p>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Agency Name *</label>
                          <input
                            value={profile.agencyName}
                            onChange={e => setProfile(prev => ({ ...prev, agencyName: e.target.value }))}
                            className={inp}
                            placeholder="e.g. Travlyy"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Registered Name</label>
                          <input
                            value={profile.registeredName}
                            onChange={e => setProfile(prev => ({ ...prev, registeredName: e.target.value }))}
                            className={inp}
                            placeholder="Legal/registered entity name"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Address</label>
                      <textarea
                        value={profile.address}
                        onChange={e => setProfile(prev => ({ ...prev, address: e.target.value }))}
                        className={inp + ' resize-none'}
                        rows={2}
                        placeholder="Complete office address"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">State</label>
                        <select
                          value={profile.state}
                          onChange={e => handleStateChange(e.target.value)}
                          className={inp}
                        >
                          <option value="">Select state</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">State Code</label>
                        <input
                          value={profile.stateCode}
                          onChange={e => setProfile(prev => ({ ...prev, stateCode: e.target.value }))}
                          className={inp}
                          placeholder="e.g. 09"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Contact Phone</label>
                        <input
                          value={profile.contactPhone}
                          onChange={e => setProfile(prev => ({ ...prev, contactPhone: e.target.value }))}
                          className={inp}
                          placeholder="+91-XXXXXXXXXX"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Contact Email</label>
                      <input
                        type="email"
                        value={profile.contactEmail}
                        onChange={e => setProfile(prev => ({ ...prev, contactEmail: e.target.value }))}
                        className={inp}
                        placeholder="agency@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* GST & Tax Settings */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80">
                    <h2 className="text-base font-semibold text-gray-900">GST & Tax Settings</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Configure GST for your invoices</p>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">GSTIN Number</label>
                        <input
                          value={profile.gstNumber}
                          onChange={e => setProfile(prev => ({ ...prev, gstNumber: e.target.value }))}
                          className={inp}
                          placeholder="22AAAAA0000A1Z5"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">GST Rate (%)</label>
                        <select
                          value={profile.gstRate}
                          onChange={e => setProfile(prev => ({ ...prev, gstRate: Number(e.target.value) }))}
                          className={inp}
                        >
                          {GST_RATES.map(r => (
                            <option key={r} value={r}>{r}%{r === 0 ? ' (No GST)' : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">GST Type</label>
                      <div className="flex gap-4">
                        <label className={`flex-1 border rounded-xl p-4 cursor-pointer transition-all ${
                          profile.gstType === 'sgst_cgst'
                            ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <input
                            type="radio"
                            name="gstType"
                            value="sgst_cgst"
                            checked={profile.gstType === 'sgst_cgst'}
                            onChange={() => setProfile(prev => ({ ...prev, gstType: 'sgst_cgst' }))}
                            className="sr-only"
                          />
                          <div className="font-semibold text-sm text-gray-900 mb-1">SGST + CGST</div>
                          <div className="text-xs text-gray-500">Intra-state supply (within same state)</div>
                        </label>
                        <label className={`flex-1 border rounded-xl p-4 cursor-pointer transition-all ${
                          profile.gstType === 'igst'
                            ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <input
                            type="radio"
                            name="gstType"
                            value="igst"
                            checked={profile.gstType === 'igst'}
                            onChange={() => setProfile(prev => ({ ...prev, gstType: 'igst' }))}
                            className="sr-only"
                          />
                          <div className="font-semibold text-sm text-gray-900 mb-1">IGST</div>
                          <div className="text-xs text-gray-500">Inter-state supply (different states)</div>
                        </label>
                      </div>
                    </div>

                    {profile.gstRate > 0 && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-700">
                          {profile.gstType === 'sgst_cgst'
                            ? `Your invoices will show SGST @ ${profile.gstRate / 2}% + CGST @ ${profile.gstRate / 2}% = ${profile.gstRate}% total GST`
                            : `Your invoices will show IGST @ ${profile.gstRate}%`
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Details (optional) */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80">
                    <h2 className="text-base font-semibold text-gray-900">Bank Details</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Optional — shown on invoices for payment reference</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Bank Name</label>
                        <input
                          value={profile.bankName}
                          onChange={e => setProfile(prev => ({ ...prev, bankName: e.target.value }))}
                          className={inp}
                          placeholder="e.g. HDFC Bank"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Account Number</label>
                        <input
                          value={profile.bankAccount}
                          onChange={e => setProfile(prev => ({ ...prev, bankAccount: e.target.value }))}
                          className={inp}
                          placeholder="XXXXXXXXXXXX"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">IFSC Code</label>
                        <input
                          value={profile.bankIfsc}
                          onChange={e => setProfile(prev => ({ ...prev, bankIfsc: e.target.value }))}
                          className={inp}
                          placeholder="e.g. HDFC0001234"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Save Button */}
                <div className="md:hidden pb-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium transition-colors shadow-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Business Profile'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

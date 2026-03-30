'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { db } from '@/lib/firebase';
import {
  doc, getDoc, setDoc, collection, query, where, onSnapshot, updateDoc,
} from 'firebase/firestore';
import {
  Palette, Link as LinkIcon, Copy, Check, Instagram, MessageCircle,
  FileText, Smartphone, Luggage, Globe, Save, ExternalLink, RefreshCw,
  ChevronDown, Image as ImageIcon,
} from 'lucide-react';

const PRESET_ACCENTS = [
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#EF4444', // red
  '#8B5CF6', // violet
  '#F97316', // orange
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#111827', // dark
];

const PRESET_BGS = [
  '#ffffff',
  '#FFFBEB',
  '#F0FDF4',
  '#EFF6FF',
  '#FDF4FF',
  '#111827',
  '#1C1917',
];

export default function CampaignBuilderPage() {
  const { user, orgId, role } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'packages'>('design');

  // Campaign settings state
  const [accentColor, setAccentColor] = useState('#F59E0B');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [logoUrl, setLogoUrl] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [poweredByText, setPoweredByText] = useState('logout.studio');
  const [showPoweredBy, setShowPoweredBy] = useState(true);

  // Per-package overrides: { [packageId]: { pdfUrl, campaignCategory } }
  const [pkgOverrides, setPkgOverrides] = useState<Record<string, { pdfUrl?: string; campaignCategory?: string }>>({});

  const campaignUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/campaign/${orgId}`
    : `/campaign/${orgId}`;

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'campaign_settings', orgId));
        if (snap.exists()) {
          const d = snap.data();
          setAccentColor(d.accentColor || '#F59E0B');
          setBgColor(d.bgColor || '#ffffff');
          setLogoUrl(d.logoUrl || '');
          setAgencyName(d.agencyName || '');
          setWhatsapp(d.whatsapp || '');
          setInstagram(d.instagram || '');
          setPoweredByText(d.poweredByText || 'logout.studio');
          setShowPoweredBy(d.showPoweredBy !== false);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    const q = query(collection(db, 'packages'), where('orgId', '==', orgId));
    const unsub = onSnapshot(q, snap => {
      const pkgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setPackages(pkgs);
      setPkgOverrides(prev => {
        const merged: Record<string, { pdfUrl?: string; campaignCategory?: string }> = {};
        pkgs.forEach((p: any) => {
          merged[p.id] = {
            pdfUrl: prev[p.id]?.pdfUrl ?? (p.pdfUrl || ''),
            campaignCategory: prev[p.id]?.campaignCategory ?? (p.campaignCategory || ''),
          };
        });
        return merged;
      });
    });
    return () => unsub();
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'campaign_settings', orgId), {
        accentColor, bgColor, logoUrl, agencyName, whatsapp, instagram,
        poweredByText, showPoweredBy,
        updatedAt: new Date(),
      }, { merge: true });

      // Update pdfUrl and campaignCategory on each package
      await Promise.all(
        Object.entries(pkgOverrides).map(([pkgId, override]) =>
          updateDoc(doc(db, 'packages', pkgId), {
            pdfUrl: override.pdfUrl || '',
            campaignCategory: override.campaignCategory || '',
          })
        )
      );

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(campaignUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updatePkgOverride = (pkgId: string, field: 'pdfUrl' | 'campaignCategory', value: string) => {
    setPkgOverrides(prev => ({ ...prev, [pkgId]: { ...prev[pkgId], [field]: value } }));
  };

  if (!user || (!orgId && role !== 'superadmin')) return null;

  const inp = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors focus:outline-none";

  // Live preview background style
  const previewBg: React.CSSProperties = {
    background: `
      radial-gradient(ellipse 80% 55% at -5% 0%, rgba(255,89,65,0.42) 0%, transparent 55%),
      radial-gradient(ellipse 65% 50% at 108% 5%, rgba(60,160,255,0.38) 0%, transparent 55%),
      radial-gradient(ellipse 70% 55% at -5% 102%, rgba(80,200,120,0.42) 0%, transparent 55%),
      radial-gradient(ellipse 65% 50% at 108% 98%, rgba(200,80,200,0.38) 0%, transparent 55%),
      ${bgColor}
    `,
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">

            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campaign Builder</h1>
                <p className="text-sm text-gray-400 mt-1">Create a mobile-first package listing page to share with customers.</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={campaignUrl}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                  <ExternalLink className="w-4 h-4" /> Preview
                </a>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-sm transition-colors disabled:opacity-60">
                  {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Campaign URL Banner */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center gap-4 mb-6">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Campaign URL</p>
                <p className="text-sm font-mono text-gray-700 truncate">{campaignUrl}</p>
              </div>
              <button
                onClick={copyUrl}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex-shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Main layout: settings + preview */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

              {/* Left: Settings */}
              <div className="space-y-5">
                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                  {(['design', 'packages'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                        activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                      }`}>
                      {tab === 'design' ? 'Design & Branding' : 'Packages & PDFs'}
                    </button>
                  ))}
                </div>

                {/* Design Tab */}
                {activeTab === 'design' && (
                  <div className="space-y-5">
                    {/* Agency Info */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
                      <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-indigo-500" /> Agency Info
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Agency Name</label>
                          <input value={agencyName} onChange={e => setAgencyName(e.target.value)}
                            className={inp} placeholder="e.g. Yatrik" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Logo URL</label>
                          <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
                            className={inp} placeholder="https://..." />
                          <p className="text-xs text-gray-400">Paste a direct image URL. Leave empty to use the default icon.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram Handle
                          </label>
                          <input value={instagram} onChange={e => setInstagram(e.target.value)}
                            className={inp} placeholder="@youragency" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5 text-green-500" /> WhatsApp Number
                          </label>
                          <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                            className={inp} placeholder="+91 9876543210" />
                        </div>
                      </div>
                    </div>

                    {/* Color Theme */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 shadow-sm">
                      <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-indigo-500" /> Color Theme
                      </h2>

                      {/* Accent Color */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Accent Color</label>
                        <p className="text-xs text-gray-400">Used for the logo circle background, package row bars, and buttons.</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {PRESET_ACCENTS.map(c => (
                            <button key={c} onClick={() => setAccentColor(c)}
                              className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                              style={{
                                backgroundColor: c,
                                borderColor: accentColor === c ? '#4f46e5' : 'transparent',
                                boxShadow: accentColor === c ? '0 0 0 2px white, 0 0 0 4px #4f46e5' : 'none',
                              }} />
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                          <input value={accentColor} onChange={e => setAccentColor(e.target.value)}
                            className={`${inp} max-w-[140px] font-mono`} placeholder="#F59E0B" />
                          <div className="flex-1 h-10 rounded-xl border border-gray-100 shadow-inner"
                            style={{ backgroundColor: accentColor }} />
                        </div>
                      </div>

                      {/* Background Color */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Background Color</label>
                        <p className="text-xs text-gray-400">The page background (paint blobs are always shown on top).</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {PRESET_BGS.map(c => (
                            <button key={c} onClick={() => setBgColor(c)}
                              className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                              style={{
                                backgroundColor: c,
                                borderColor: bgColor === c ? '#4f46e5' : '#e5e7eb',
                                boxShadow: bgColor === c ? '0 0 0 2px white, 0 0 0 4px #4f46e5' : 'none',
                              }} />
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                          <input value={bgColor} onChange={e => setBgColor(e.target.value)}
                            className={`${inp} max-w-[140px] font-mono`} placeholder="#ffffff" />
                          <div className="flex-1 h-10 rounded-xl border border-gray-100 shadow-inner"
                            style={{ backgroundColor: bgColor }} />
                        </div>
                      </div>
                    </div>

                    {/* Footer Settings */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
                      <h2 className="font-bold text-gray-900">Footer</h2>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="showPoweredBy" checked={showPoweredBy}
                          onChange={e => setShowPoweredBy(e.target.checked)}
                          className="rounded" />
                        <label htmlFor="showPoweredBy" className="text-sm font-medium text-gray-700">
                          Show "Powered by" text
                        </label>
                      </div>
                      {showPoweredBy && (
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Powered By Text</label>
                          <input value={poweredByText} onChange={e => setPoweredByText(e.target.value)}
                            className={inp} placeholder="logout.studio" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Packages Tab */}
                {activeTab === 'packages' && (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-sm text-amber-800">
                      <strong>Tip:</strong> Add a Google Drive PDF URL for each package so customers can view the detailed itinerary PDF. Set a Campaign Category to group packages under filter tabs on the campaign page.
                    </div>
                    {packages.length === 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">
                        No packages yet. Create packages from the Packages page first.
                      </div>
                    )}
                    {packages.map(pkg => {
                      const cover = pkg.images?.[0] || pkg.imageUrl;
                      const override = pkgOverrides[pkg.id] || {};
                      return (
                        <div key={pkg.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                          <div className="flex items-start gap-4">
                            {/* Thumbnail */}
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                              {cover
                                ? <img src={cover} alt={pkg.title} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-gray-300" />
                                  </div>
                              }
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm line-clamp-1">{pkg.title}</p>
                              <p className="text-xs text-gray-400 mb-3">{pkg.duration} · {pkg.destination}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> PDF URL (Google Drive)
                                  </label>
                                  <input
                                    type="url"
                                    value={override.pdfUrl || ''}
                                    onChange={e => updatePkgOverride(pkg.id, 'pdfUrl', e.target.value)}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Campaign Category (tab label)
                                  </label>
                                  <input
                                    type="text"
                                    value={override.campaignCategory || ''}
                                    onChange={e => updatePkgOverride(pkg.id, 'campaignCategory', e.target.value)}
                                    placeholder="e.g. 2N3D Weekend Trips"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Phone Preview */}
              <div className="hidden lg:block">
                <div className="sticky top-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-3">Live Preview</p>
                  {/* Phone frame */}
                  <div className="mx-auto w-[280px] rounded-[40px] border-[10px] border-gray-800 shadow-2xl overflow-hidden bg-white"
                    style={{ aspectRatio: '9/19.5' }}>
                    <div className="w-full h-full overflow-y-auto overflow-x-hidden text-[10px]" style={previewBg}>
                      <div className="flex flex-col items-center pt-5 pb-3 gap-2 px-3">
                        {/* Logo */}
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                          style={{ backgroundColor: accentColor }}>
                          {logoUrl
                            ? <img src={logoUrl} alt="" className="w-full h-full object-cover rounded-full" />
                            : <Luggage className="w-6 h-6 text-gray-900" />
                          }
                        </div>
                        {/* Name */}
                        <p className="font-black text-gray-900 text-xs">{agencyName || 'Your Agency'}</p>
                        {/* Social */}
                        <div className="flex gap-2">
                          {instagram && (
                            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                              <Instagram className="w-3.5 h-3.5 text-gray-600" />
                            </div>
                          )}
                          {whatsapp && (
                            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                              <MessageCircle className="w-3.5 h-3.5 text-gray-600" />
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Categories */}
                      <div className="flex gap-1.5 px-3 mb-2 overflow-x-auto">
                        <div className="flex-shrink-0 bg-gray-900 text-white px-2.5 py-1 rounded-full text-[9px] font-bold">All</div>
                        {Array.from(new Set(packages.map(p => pkgOverrides[p.id]?.campaignCategory || p.campaignCategory || p.category).filter(Boolean))).slice(0, 2).map(cat => (
                          <div key={cat} className="flex-shrink-0 border border-gray-300 text-gray-700 px-2.5 py-1 rounded-full text-[9px] font-bold whitespace-nowrap">{cat}</div>
                        ))}
                      </div>
                      {/* Package rows */}
                      <div className="px-3 space-y-1.5">
                        {packages.slice(0, 5).map(pkg => {
                          const cover = pkg.images?.[0] || pkg.imageUrl;
                          return (
                            <div key={pkg.id}
                              className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
                              style={{ backgroundColor: accentColor }}>
                              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-white/60">
                                {cover ? <img src={cover} alt="" className="w-full h-full object-cover" />
                                  : <div className="w-full h-full bg-gray-200" />}
                              </div>
                              <p className="flex-1 font-black text-[8px] uppercase text-gray-900 line-clamp-1">{pkg.title}</p>
                              <div className="flex gap-1">
                                {pkgOverrides[pkg.id]?.pdfUrl && (
                                  <span className="bg-gray-900 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">PDF</span>
                                )}
                                <span className="bg-gray-900 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">Book</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {showPoweredBy && (
                        <p className="text-center text-[8px] text-gray-400 py-3">Powered by: {poweredByText}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobilePreview } from '@/components/MobilePreview';
import { ImageUploadGrid } from '@/components/ImageUploadGrid';
import { useEffect, useState, useRef } from 'react';
import React from 'react';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Globe, Save, ExternalLink, ChevronDown, ChevronRight,
  Palette, Type, Image as ImageIcon, Info, Phone,
  FileText, Search, Loader2, Smartphone, Monitor,
  Megaphone, BarChart2, Star, Zap, Package, Plus, X, Quote,
  BookOpen, Bold, Italic, Underline, List, Heading1, Heading2, AlignLeft
} from 'lucide-react';

interface WebsiteSettings {
  themeColor: string; secondaryColor: string;
  agencyName: string; agencyLogo: string; agencyTagline: string;
  fontStyle: string;
  announcementBarEnabled: boolean; announcementBarText: string;
  heroTitle: string; heroSubtitle: string; heroCta: string;
  heroImage: string; heroOverlayOpacity: number;
  featuresEnabled: boolean;
  featureItems: Array<{ title: string; description: string }>;
  packagesTitle: string; packagesSubtitle: string;
  galleryImages: string[]; galleryTitle: string;
  statsEnabled: boolean;
  statItems: Array<{ value: string; label: string }>;
  aboutTitle: string; aboutDescription: string; aboutImage: string;
  testimonialsEnabled: boolean; testimonialsTitle: string;
  testimonialItems: Array<{ name: string; role: string; quote: string; rating: number; avatar: string }>;
  contactPhone: string; contactEmail: string; contactWhatsApp: string;
  socialInstagram: string; socialFacebook: string; googleMapsUrl: string;
  footerText: string; metaTitle: string; metaDescription: string;
  cloudinaryCloudName: string; cloudinaryUploadPreset: string;
  pageAboutUs: string;
  pageCancellationRefund: string;
  pagePrivacyPolicy: string;
  pageTermsConditions: string;
}

const DEFAULT_SETTINGS: WebsiteSettings = {
  themeColor: '#4f46e5', secondaryColor: '#6366f1',
  agencyName: '', agencyLogo: '', agencyTagline: '',
  fontStyle: 'sans',
  announcementBarEnabled: false,
  announcementBarText: '🌍 Special offer: Book before month-end & save 10%!',
  heroTitle: 'Discover Your Next Adventure', heroSubtitle: 'Explore the world with our curated travel packages.',
  heroCta: 'Explore Packages', heroImage: '', heroOverlayOpacity: 45,
  featuresEnabled: true,
  featureItems: [
    { title: 'Expert Local Guides', description: 'Professional local guides ensuring authentic experiences at every destination.' },
    { title: 'Best Price Guarantee', description: 'Competitive pricing with handpicked hotels and exclusive group deals.' },
    { title: '24/7 Travel Support', description: 'Round-the-clock assistance before, during, and after your trip.' },
    { title: 'Custom Packages', description: 'Tailored itineraries built around your unique travel preferences.' },
  ],
  packagesTitle: 'Popular Packages',
  packagesSubtitle: 'Choose from our handpicked selection of premium travel experiences.',
  galleryImages: [], galleryTitle: 'Our Destinations',
  statsEnabled: true,
  statItems: [
    { value: '10+', label: 'Years Experience' },
    { value: '500+', label: 'Trips Organized' },
    { value: '1000+', label: 'Happy Travelers' },
    { value: '50+', label: 'Destinations' },
  ],
  aboutTitle: '', aboutDescription: '', aboutImage: '',
  testimonialsEnabled: false,
  testimonialsTitle: 'What Our Travelers Say',
  testimonialItems: [
    { name: 'Sarah Johnson', role: 'Adventure Traveler', quote: 'An absolutely incredible experience! The attention to detail made our trip unforgettable.', rating: 5, avatar: '' },
    { name: 'Mike Chen', role: 'Family Vacation', quote: 'Perfectly organized trip. Our family had the time of our lives!', rating: 5, avatar: '' },
    { name: 'Priya Sharma', role: 'Honeymoon Trip', quote: 'Everything exceeded our expectations. Highly recommended!', rating: 5, avatar: '' },
  ],
  contactPhone: '', contactEmail: '', contactWhatsApp: '',
  socialInstagram: '', socialFacebook: '', googleMapsUrl: '',
  footerText: '', metaTitle: '', metaDescription: '',
  cloudinaryCloudName: '', cloudinaryUploadPreset: '',
  pageAboutUs: '',
  pageCancellationRefund: '',
  pagePrivacyPolicy: '',
  pageTermsConditions: '',
};

const COLOR_PRESETS = [
  { name: 'Indigo', primary: '#4f46e5', secondary: '#6366f1' },
  { name: 'Orange', primary: '#ea580c', secondary: '#f97316' },
  { name: 'Teal', primary: '#0d9488', secondary: '#14b8a6' },
  { name: 'Rose', primary: '#e11d48', secondary: '#f43f5e' },
  { name: 'Emerald', primary: '#059669', secondary: '#10b981' },
  { name: 'Amber', primary: '#b45309', secondary: '#d97706' },
];

type SectionId = 'appearance' | 'announcement' | 'brand' | 'hero' | 'features' | 'packages' | 'gallery' | 'stats' | 'about' | 'testimonials' | 'contact' | 'footer' | 'seo' | 'pages';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" />, description: 'Font, colors & theme presets' },
  { id: 'announcement', label: 'Announcement Bar', icon: <Megaphone className="w-4 h-4" />, description: 'Top banner with promotions' },
  { id: 'brand', label: 'Brand Identity', icon: <Globe className="w-4 h-4" />, description: 'Logo, agency name & tagline' },
  { id: 'hero', label: 'Hero Section', icon: <Type className="w-4 h-4" />, description: 'Main banner headline & image' },
  { id: 'features', label: 'Features / USPs', icon: <Zap className="w-4 h-4" />, description: '4 selling points below hero' },
  { id: 'packages', label: 'Packages Section', icon: <Package className="w-4 h-4" />, description: 'Title & subtitle for packages' },
  { id: 'gallery', label: 'Image Gallery', icon: <ImageIcon className="w-4 h-4" />, description: 'Showcase your destinations' },
  { id: 'stats', label: 'Statistics', icon: <BarChart2 className="w-4 h-4" />, description: 'Numbers that build trust' },
  { id: 'about', label: 'About Us', icon: <Info className="w-4 h-4" />, description: 'Tell your agency story' },
  { id: 'testimonials', label: 'Testimonials', icon: <Quote className="w-4 h-4" />, description: 'Customer reviews & ratings' },
  { id: 'contact', label: 'Contact & Social', icon: <Phone className="w-4 h-4" />, description: 'Phone, email, socials & map' },
  { id: 'footer', label: 'Footer', icon: <FileText className="w-4 h-4" />, description: 'Footer text & copyright' },
  { id: 'seo', label: 'SEO', icon: <Search className="w-4 h-4" />, description: 'Meta title & description' },
  { id: 'pages', label: 'Legal Pages', icon: <BookOpen className="w-4 h-4" />, description: 'About Us, Privacy Policy, Terms & more' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-indigo-600' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

// Rich text editor toolbar button
function ToolbarBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors">
      {children}
    </button>
  );
}

function RichTextEditor({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const editorRef = React.useRef<HTMLDivElement>(null);

  // Sync external value into editor (only on first load or if changed externally)
  const lastValueRef = React.useRef<string>('');
  React.useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current) {
      editorRef.current.innerHTML = value;
      lastValueRef.current = value;
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastValueRef.current = html;
      onChange(html);
    }
    editorRef.current?.focus();
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
          <ToolbarBtn onClick={() => exec('bold')} title="Bold"><Bold className="w-3.5 h-3.5" /></ToolbarBtn>
          <ToolbarBtn onClick={() => exec('italic')} title="Italic"><Italic className="w-3.5 h-3.5" /></ToolbarBtn>
          <ToolbarBtn onClick={() => exec('underline')} title="Underline"><Underline className="w-3.5 h-3.5" /></ToolbarBtn>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <ToolbarBtn onClick={() => exec('formatBlock', 'h2')} title="Heading 2"><Heading1 className="w-3.5 h-3.5" /></ToolbarBtn>
          <ToolbarBtn onClick={() => exec('formatBlock', 'h3')} title="Heading 3"><Heading2 className="w-3.5 h-3.5" /></ToolbarBtn>
          <ToolbarBtn onClick={() => exec('formatBlock', 'p')} title="Paragraph"><AlignLeft className="w-3.5 h-3.5" /></ToolbarBtn>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Bullet List"><List className="w-3.5 h-3.5" /></ToolbarBtn>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <ToolbarBtn onClick={() => exec('removeFormat')} title="Clear Formatting"><span className="text-[10px] font-bold">T̶</span></ToolbarBtn>
        </div>
        {/* Editable area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            if (editorRef.current) {
              const html = editorRef.current.innerHTML;
              lastValueRef.current = html;
              onChange(html);
            }
          }}
          className="min-h-[200px] max-h-[360px] overflow-y-auto px-4 py-3 text-sm text-gray-700 focus:outline-none prose prose-sm max-w-none rich-editor"
        />
      </div>
      <p className="text-[11px] text-gray-400">Use the toolbar to format your content. Changes are saved with the rest of your settings.</p>
    </div>
  );
}

export default function WebsiteBuilderPage() {
  const { user, orgId, role } = useAuth();
  const [activePage, setActivePage] = React.useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<WebsiteSettings>(DEFAULT_SETTINGS);
  const [packages, setPackages] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['appearance', 'hero']));
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!orgId) return;
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'website_settings', orgId));
        if (snap.exists()) setSettings(prev => ({ ...prev, ...snap.data() }));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchSettings();
    const q = query(collection(db, 'packages'), where('orgId', '==', orgId));
    const unsub = onSnapshot(q, snap => setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [orgId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'website_settings', orgId), { orgId, ...settings, updatedAt: serverTimestamp() }, { merge: true });
      alert('Website settings saved!');
    } catch (e) { alert('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const toggleSection = (id: SectionId) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const uploadImage = async (file: File, fieldKey: string, onSuccess: (url: string) => void) => {
    setUploadingFields(p => ({ ...p, [fieldKey]: true }));
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.secure_url) onSuccess(data.secure_url);
      else throw new Error(data.error);
    } catch (e: any) { alert(`Upload failed: ${e.message}`); }
    finally { setUploadingFields(p => ({ ...p, [fieldKey]: false })); }
  };

  const S = settings;
  const set = (patch: Partial<WebsiteSettings>) => setSettings(prev => ({ ...prev, ...patch }));

  const renderInput = (label: string, value: string, onChange: (v: string) => void, opts?: { placeholder?: string; type?: string }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input type={opts?.type || 'text'} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50 focus:bg-white transition-colors"
        placeholder={opts?.placeholder} />
    </div>
  );

  const renderTextarea = (label: string, value: string, onChange: (v: string) => void, opts?: { placeholder?: string; rows?: number }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={opts?.rows || 3}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none bg-gray-50 focus:bg-white transition-colors"
        placeholder={opts?.placeholder} />
    </div>
  );

  const renderImageUpload = (label: string, value: string, fieldKey: string, onChange: (v: string) => void) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        <input type="url" value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50 focus:bg-white"
          placeholder="https://..." />
        <label className={`cursor-pointer flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 whitespace-nowrap hover:bg-gray-50 transition-colors ${uploadingFields[fieldKey] ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {uploadingFields[fieldKey] ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
          <input type="file" className="hidden" accept="image/*" disabled={uploadingFields[fieldKey]}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, fieldKey, onChange); e.target.value = ''; }} />
        </label>
      </div>
      {value && <div className="mt-2 w-20 h-14 rounded-lg overflow-hidden border border-gray-200"><img src={value} alt="Preview" className="w-full h-full object-cover" /></div>}
    </div>
  );

  const sectionContent: Record<SectionId, React.ReactNode> = {
    appearance: (
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-3">Font Style</label>
          <div className="grid grid-cols-2 gap-3">
            {(['sans', 'serif'] as const).map(f => (
              <button key={f} type="button" onClick={() => set({ fontStyle: f })}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${S.fontStyle === f ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                style={{ fontFamily: f === 'serif' ? "Georgia, serif" : 'inherit' }}>
                {f === 'serif' ? 'Serif (Elegant)' : 'Sans-serif (Modern)'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-3">Color Presets</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {COLOR_PRESETS.map(preset => (
              <button key={preset.name} type="button" onClick={() => set({ themeColor: preset.primary, secondaryColor: preset.secondary })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${S.themeColor === preset.primary ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: preset.primary }} />
                {preset.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[{ label: 'Primary Color', key: 'themeColor' as const }, { label: 'Secondary Color', key: 'secondaryColor' as const }].map(({ label, key }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={S[key]} onChange={e => set({ [key]: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5" />
                  <input type="text" value={S[key]} onChange={e => set({ [key]: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),

    announcement: (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Enable Announcement Bar</p>
            <p className="text-xs text-gray-500 mt-0.5">Shows a colored banner at the very top of your site</p>
          </div>
          <Toggle value={S.announcementBarEnabled} onChange={v => set({ announcementBarEnabled: v })} />
        </div>
        {S.announcementBarEnabled && (
          <div className="pt-2">
            {renderInput('Announcement Text', S.announcementBarText, v => set({ announcementBarText: v }), { placeholder: '🎉 Special offer: Book now and save 10%!' })}
            <div className="mt-3 p-3 rounded-xl text-white text-sm text-center font-semibold" style={{ backgroundColor: S.themeColor }}>
              {S.announcementBarText || 'Preview of your announcement'}
            </div>
          </div>
        )}
      </div>
    ),

    brand: (
      <div className="space-y-5">
        {renderInput('Agency Name', S.agencyName, v => set({ agencyName: v }), { placeholder: 'Atlas Trails Travel' })}
        {renderInput('Tagline', S.agencyTagline, v => set({ agencyTagline: v }), { placeholder: 'Your journey, our expertise' })}
        {renderImageUpload('Logo', S.agencyLogo, 'logo', v => set({ agencyLogo: v }))}
      </div>
    ),

    hero: (
      <div className="space-y-5">
        {renderInput('Hero Title', S.heroTitle, v => set({ heroTitle: v }), { placeholder: 'Discover Your Next Adventure' })}
        {renderTextarea('Hero Subtitle', S.heroSubtitle, v => set({ heroSubtitle: v }), { placeholder: 'Explore the world with our curated packages.', rows: 2 })}
        {renderInput('CTA Button Text', S.heroCta, v => set({ heroCta: v }), { placeholder: 'Explore Packages' })}
        {renderImageUpload('Background Image', S.heroImage, 'hero', v => set({ heroImage: v }))}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Overlay Darkness ({S.heroOverlayOpacity}%)</label>
          <input type="range" min="0" max="80" value={S.heroOverlayOpacity} onChange={e => set({ heroOverlayOpacity: Number(e.target.value) })}
            className="w-full accent-indigo-600" />
          <div className="flex justify-between text-[10px] text-gray-400"><span>Light</span><span>Dark</span></div>
        </div>
      </div>
    ),

    features: (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Show Features Section</p>
            <p className="text-xs text-gray-500 mt-0.5">4 USP cards displayed below the hero</p>
          </div>
          <Toggle value={S.featuresEnabled} onChange={v => set({ featuresEnabled: v })} />
        </div>
        {S.featuresEnabled && (
          <div className="space-y-3 pt-2">
            {S.featureItems.map((feat, i) => (
              <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex-1 space-y-2">
                  <input value={feat.title} onChange={e => { const items = [...S.featureItems]; items[i] = { ...items[i], title: e.target.value }; set({ featureItems: items }); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white" placeholder={`Feature ${i + 1} title`} />
                  <input value={feat.description} onChange={e => { const items = [...S.featureItems]; items[i] = { ...items[i], description: e.target.value }; set({ featureItems: items }); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="Short description" />
                </div>
                <button type="button" onClick={() => set({ featureItems: S.featureItems.filter((_, idx) => idx !== i) })}
                  className="text-gray-300 hover:text-red-500 p-1.5 transition-colors"><X className="w-4 h-4" /></button>
              </div>
            ))}
            {S.featureItems.length < 4 && (
              <button type="button" onClick={() => set({ featureItems: [...S.featureItems, { title: '', description: '' }] })}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                <Plus className="w-4 h-4" /> Add Feature
              </button>
            )}
          </div>
        )}
      </div>
    ),

    packages: (
      <div className="space-y-5">
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">Packages are managed in the <strong>Packages</strong> section of the CRM. Here you can customize how they're displayed on your public site.</p>
        {renderInput('Section Title', S.packagesTitle, v => set({ packagesTitle: v }), { placeholder: 'Popular Packages' })}
        {renderTextarea('Section Subtitle', S.packagesSubtitle, v => set({ packagesSubtitle: v }), { placeholder: 'Choose from our handpicked selection...', rows: 2 })}
      </div>
    ),

    gallery: (
      <div className="space-y-4">
        {renderInput('Gallery Section Title', S.galleryTitle, v => set({ galleryTitle: v }), { placeholder: 'Our Destinations' })}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Gallery Images</label>
          <p className="text-xs text-gray-500 mb-3">Upload destination photos for the masonry gallery on your public site. The first image in each row appears larger.</p>
          <ImageUploadGrid images={S.galleryImages || []} onChange={imgs => set({ galleryImages: imgs })} maxImages={18} columns={3} />
        </div>
      </div>
    ),

    stats: (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Show Statistics Section</p>
            <p className="text-xs text-gray-500 mt-0.5">A bold stats bar in your theme color</p>
          </div>
          <Toggle value={S.statsEnabled} onChange={v => set({ statsEnabled: v })} />
        </div>
        {S.statsEnabled && (
          <div className="space-y-3 pt-2">
            {S.statItems.map((stat, i) => (
              <div key={i} className="flex gap-2 items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <input value={stat.value} onChange={e => { const items = [...S.statItems]; items[i] = { ...items[i], value: e.target.value }; set({ statItems: items }); }}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 bg-white text-center" placeholder="10+" />
                <input value={stat.label} onChange={e => { const items = [...S.statItems]; items[i] = { ...items[i], label: e.target.value }; set({ statItems: items }); }}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="Years Experience" />
                <button type="button" onClick={() => set({ statItems: S.statItems.filter((_, idx) => idx !== i) })}
                  className="text-gray-300 hover:text-red-500 p-1.5 transition-colors"><X className="w-4 h-4" /></button>
              </div>
            ))}
            {S.statItems.length < 6 && (
              <button type="button" onClick={() => set({ statItems: [...S.statItems, { value: '', label: '' }] })}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                <Plus className="w-4 h-4" /> Add Stat
              </button>
            )}
          </div>
        )}
      </div>
    ),

    about: (
      <div className="space-y-5">
        {renderInput('Section Title', S.aboutTitle, v => set({ aboutTitle: v }), { placeholder: 'About Our Agency' })}
        {renderTextarea('Description', S.aboutDescription, v => set({ aboutDescription: v }), { placeholder: 'Tell your customers about your agency...', rows: 5 })}
        {renderImageUpload('About Photo', S.aboutImage, 'about', v => set({ aboutImage: v }))}
      </div>
    ),

    testimonials: (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Show Testimonials Section</p>
            <p className="text-xs text-gray-500 mt-0.5">Display customer reviews with star ratings</p>
          </div>
          <Toggle value={S.testimonialsEnabled} onChange={v => set({ testimonialsEnabled: v })} />
        </div>
        {S.testimonialsEnabled && (
          <div className="space-y-4 pt-2">
            {renderInput('Section Title', S.testimonialsTitle, v => set({ testimonialsTitle: v }), { placeholder: 'What Our Travelers Say' })}
            <div className="space-y-3">
              {S.testimonialItems.map((t, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Testimonial {i + 1}</span>
                    <button type="button" onClick={() => set({ testimonialItems: S.testimonialItems.filter((_, idx) => idx !== i) })}
                      className="text-gray-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={t.name} onChange={e => { const items = [...S.testimonialItems]; items[i] = { ...items[i], name: e.target.value }; set({ testimonialItems: items }); }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500" placeholder="Customer Name" />
                    <input value={t.role} onChange={e => { const items = [...S.testimonialItems]; items[i] = { ...items[i], role: e.target.value }; set({ testimonialItems: items }); }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Family Vacation" />
                  </div>
                  <textarea value={t.quote} onChange={e => { const items = [...S.testimonialItems]; items[i] = { ...items[i], quote: e.target.value }; set({ testimonialItems: items }); }}
                    rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white resize-none focus:ring-2 focus:ring-indigo-500" placeholder="What they said..." />
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-600">Rating:</label>
                    <select value={t.rating} onChange={e => { const items = [...S.testimonialItems]; items[i] = { ...items[i], rating: Number(e.target.value) }; set({ testimonialItems: items }); }}
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                      {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars {'⭐'.repeat(r)}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {S.testimonialItems.length < 6 && (
                <button type="button" onClick={() => set({ testimonialItems: [...S.testimonialItems, { name: '', role: '', quote: '', rating: 5, avatar: '' }] })}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  <Plus className="w-4 h-4" /> Add Testimonial
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    ),

    contact: (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {renderInput('Phone', S.contactPhone, v => set({ contactPhone: v }), { placeholder: '+91 98765 43210', type: 'tel' })}
          {renderInput('Email', S.contactEmail, v => set({ contactEmail: v }), { placeholder: 'hello@agency.com', type: 'email' })}
        </div>
        {renderInput('WhatsApp Number', S.contactWhatsApp, v => set({ contactWhatsApp: v }), { placeholder: '+91 98765 43210', type: 'tel' })}
        <hr className="border-gray-100" />
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Social Media</p>
        <div className="grid grid-cols-2 gap-4">
          {renderInput('Instagram URL', S.socialInstagram, v => set({ socialInstagram: v }), { placeholder: 'https://instagram.com/...' })}
          {renderInput('Facebook URL', S.socialFacebook, v => set({ socialFacebook: v }), { placeholder: 'https://facebook.com/...' })}
        </div>
        {renderInput('Google Maps Embed URL', S.googleMapsUrl, v => set({ googleMapsUrl: v }), { placeholder: 'https://www.google.com/maps/embed?...' })}
      </div>
    ),

    footer: (
      <div className="space-y-5">
        {renderTextarea('Footer Description', S.footerText, v => set({ footerText: v }), { placeholder: 'Making your dream vacations a reality...', rows: 2 })}
      </div>
    ),

    seo: (
      <div className="space-y-5">
        {renderInput('Meta Title', S.metaTitle, v => set({ metaTitle: v }), { placeholder: 'Agency Name - Best Travel Packages' })}
        {renderTextarea('Meta Description', S.metaDescription, v => set({ metaDescription: v }), { placeholder: 'Describe your travel agency for search engines...', rows: 2 })}
      </div>
    ),

    pages: (
      <div className="space-y-6">
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-700">
          <p className="font-semibold mb-1">📄 Legal & Info Pages</p>
          <p>These pages will be accessible from the footer of your public website. Visitors can navigate back using the back button on each page.</p>
        </div>

        {/* Page Selector Tabs */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'aboutUs', label: 'About Us', field: 'pageAboutUs' as const },
            { key: 'cancellation', label: 'Cancellation & Refund', field: 'pageCancellationRefund' as const },
            { key: 'privacy', label: 'Privacy Policy', field: 'pagePrivacyPolicy' as const },
            { key: 'terms', label: 'Terms & Conditions', field: 'pageTermsConditions' as const },
          ].map(page => (
            <button key={page.key} type="button"
              onClick={() => setActivePage(activePage === page.key ? null : page.key)}
              className={`px-3 py-2.5 rounded-xl border-2 text-xs font-semibold text-left transition-all leading-tight ${
                activePage === page.key
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{page.label}</span>
                {S[page.field] && S[page.field].length > 10 && (
                  <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full ml-1 font-bold flex-shrink-0">Saved</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Active page editor */}
        {activePage === 'aboutUs' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-indigo-500" />
              <h4 className="text-sm font-bold text-gray-800">About Us Page</h4>
            </div>
            <RichTextEditor
              label="Content"
              value={S.pageAboutUs}
              onChange={v => set({ pageAboutUs: v })}
            />
          </div>
        )}

        {activePage === 'cancellation' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-indigo-500" />
              <h4 className="text-sm font-bold text-gray-800">Cancellation & Refund Policy Page</h4>
            </div>
            <RichTextEditor
              label="Content"
              value={S.pageCancellationRefund}
              onChange={v => set({ pageCancellationRefund: v })}
            />
          </div>
        )}

        {activePage === 'privacy' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-indigo-500" />
              <h4 className="text-sm font-bold text-gray-800">Privacy Policy Page</h4>
            </div>
            <RichTextEditor
              label="Content"
              value={S.pagePrivacyPolicy}
              onChange={v => set({ pagePrivacyPolicy: v })}
            />
          </div>
        )}

        {activePage === 'terms' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full bg-indigo-500" />
              <h4 className="text-sm font-bold text-gray-800">Terms & Conditions Page</h4>
            </div>
            <RichTextEditor
              label="Content"
              value={S.pageTermsConditions}
              onChange={v => set({ pageTermsConditions: v })}
            />
          </div>
        )}
      </div>
    ),
  };

  if (!user || (!orgId && role !== 'superadmin')) return null;
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/site/${orgId}` : '';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Top bar */}
          <div className="px-6 py-3.5 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Website Builder</h1>
              <p className="text-gray-400 text-xs mt-0.5">Design and customize your public travel agency storefront.</p>
            </div>
            <div className="flex items-center gap-3">
              {orgId && (
                <a href={publicUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> View Site
                </a>
              )}
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading settings...
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel */}
              <div className="w-[55%] overflow-y-auto p-5 space-y-2 border-r border-gray-200">
                <form onSubmit={handleSave}>
                  {SECTIONS.map(section => (
                    <div key={section.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-2">
                      <button type="button" onClick={() => toggleSection(section.id)}
                        className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          {section.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900">{section.label}</h3>
                          <p className="text-xs text-gray-400">{section.description}</p>
                        </div>
                        {expandedSections.has(section.id)
                          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                      </button>
                      {expandedSections.has(section.id) && (
                        <div className="px-4 pb-5 pt-2 border-t border-gray-100">
                          {sectionContent[section.id]}
                        </div>
                      )}
                    </div>
                  ))}
                </form>
              </div>

              {/* Right Panel — Live Preview */}
              <div className="w-[45%] bg-gray-100/60 flex flex-col overflow-hidden">
                {/* Device Toggle */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white flex-shrink-0">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Preview</span>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    {([['mobile', <Smartphone key="m" className="w-3.5 h-3.5" />, 'Mobile'], ['desktop', <Monitor key="d" className="w-3.5 h-3.5" />, 'Desktop']] as const).map(([mode, icon, label]) => (
                      <button key={mode} type="button" onClick={() => setPreviewMode(mode)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${previewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        {icon}{label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto flex items-start justify-center p-6 pt-8">
                  <MobilePreview settings={settings} packages={packages} viewMode={previewMode} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

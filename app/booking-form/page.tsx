'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Save, Plus, Trash2, ChevronUp, ChevronDown,
  Eye, EyeOff, ClipboardList, Loader2, AlertCircle,
  CheckCircle2, Palette, X, FileText, ToggleLeft, ToggleRight, ShieldCheck,
} from 'lucide-react';

type FieldType = 'text' | 'tel' | 'email' | 'date' | 'select' | 'number' | 'textarea';

interface BookingField {
  id: string;
  key?: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  required: boolean;
  enabled: boolean;
  order: number;
  isDefault: boolean;
}

interface BookingPage {
  id: string;
  title: string;
  fields: BookingField[];
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Delhi','Jammu & Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
];

const SOURCE_OPTIONS = ['Google','Instagram','Facebook','YouTube','WhatsApp','Friend Referral','Walk-in','Other'];

const DEFAULT_BOOKING_FIELDS: BookingField[] = [
  { id: 'f_name', key: 'customerName', label: 'Full Name', type: 'text', placeholder: 'Full Name', required: true, enabled: true, order: 0, isDefault: true },
  { id: 'f_phone', key: 'customerPhone', label: 'Phone Number (WhatsApp)', type: 'tel', placeholder: 'Phone Number', required: true, enabled: true, order: 1, isDefault: true },
  { id: 'f_email', key: 'customerEmail', label: 'Email Address', type: 'email', placeholder: 'Email Address', required: false, enabled: true, order: 2, isDefault: true },
  { id: 'f_date', key: 'travelDate', label: 'Travel Date', type: 'date', required: false, enabled: true, order: 3, isDefault: true },
  { id: 'f_state', key: 'state', label: 'State', type: 'select', options: INDIAN_STATES, required: false, enabled: true, order: 4, isDefault: true },
  { id: 'f_city', key: 'city', label: 'City', type: 'text', placeholder: 'City', required: false, enabled: true, order: 5, isDefault: true },
  { id: 'f_source', key: 'leadSource', label: 'Source (How did you hear?)', type: 'select', options: SOURCE_OPTIONS, required: false, enabled: true, order: 6, isDefault: true },
];

const COLOR_PRESETS = ['#22c55e','#4f46e5','#f97316','#ef4444','#0ea5e9','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#64748b'];
const TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text Input', tel: 'Phone', email: 'Email', date: 'Date Picker',
  select: 'Dropdown', number: 'Number', textarea: 'Long Text',
};

export default function BookingFormPage() {
  const { user, orgId } = useAuth();
  const [pages, setPages] = useState<BookingPage[]>([
    { id: 'page_1', title: 'Details', fields: DEFAULT_BOOKING_FIELDS }
  ]);
  const [bookingColor, setBookingColor] = useState('#22c55e');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState('');

  // Terms & Conditions settings
  const [termsEnabled, setTermsEnabled] = useState(false);
  const [termsMandatory, setTermsMandatory] = useState(true);
  const [termsContent, setTermsContent] = useState('');

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'website_settings', orgId));
        if (snap.exists() && snap.data().bookingForm) {
          const bf = snap.data().bookingForm;
          setBookingColor(bf.bookingColor || '#22c55e');
          
          if (bf.pages && bf.pages.length > 0) {
            setPages(bf.pages);
          } else if (bf.fields?.length) {
            // Backwards compatibility migration
            const savedMap: Record<string, BookingField> = Object.fromEntries(
              bf.fields.map((f: BookingField) => [f.id, f])
            );
            const merged = DEFAULT_BOOKING_FIELDS.map(df => ({
              ...df,
              ...(savedMap[df.id] ? {
                enabled: savedMap[df.id].enabled,
                required: savedMap[df.id].required,
                label: savedMap[df.id].label,
                placeholder: savedMap[df.id].placeholder ?? df.placeholder,
              } : {}),
            }));
            const custom = bf.fields.filter((f: BookingField) => !f.isDefault);
            const migratedFields = [...merged, ...custom].sort((a, b) => a.order - b.order);
            setPages([{ id: 'page_1', title: 'Details', fields: migratedFields }]);
          }

          // Load T&C settings
          if (bf.termsEnabled !== undefined) setTermsEnabled(bf.termsEnabled);
          if (bf.termsMandatory !== undefined) setTermsMandatory(bf.termsMandatory);
          if (bf.termsContent) setTermsContent(bf.termsContent);
        }
      } finally { setLoading(false); }
    })();
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId) { alert('No orgId — cannot save.'); return; }
    setSaving(true);
    try {
      // Strip undefined values — Firestore rejects them
      const cleanPages = JSON.parse(JSON.stringify(
        pages.map((p) => ({
          ...p,
          fields: p.fields.map((f, i) => ({ ...f, order: i }))
        }))
      ));
      await setDoc(doc(db, 'website_settings', orgId), {
        bookingForm: {
          bookingColor,
          pages: cleanPages,
          termsEnabled,
          termsMandatory,
          termsContent,
          // also save fields for absolute backwards compatibility during transition if needed
          fields: cleanPages.flatMap((p: BookingPage) => p.fields) 
        }
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error('[BookingForm] Save failed:', err?.code, err?.message, err);
      alert(`Failed to save: ${err?.message ?? err}`);
    }
    finally { setSaving(false); }
  };

  const addPage = () => {
    setPages(p => [...p, { id: `page_${Date.now()}`, title: `Page ${p.length + 1}`, fields: [] }]);
  };

  const removePage = (pIdx: number) => {
    setPages(p => p.filter((_, i) => i !== pIdx));
  };

  const updatePageTitle = (pIdx: number, title: string) => {
    setPages(p => {
      const np = [...p];
      np[pIdx].title = title;
      return np;
    });
  };

  const moveField = (pIdx: number, fIdx: number, dir: 'up' | 'down') => {
    const newPages = [...pages];
    const page = newPages[pIdx];
    
    if (dir === 'up') {
      if (fIdx > 0) {
        // Swap within same page
        [page.fields[fIdx], page.fields[fIdx - 1]] = [page.fields[fIdx - 1], page.fields[fIdx]];
      } else if (pIdx > 0) {
        // Move to previous page
        const field = page.fields.splice(fIdx, 1)[0];
        newPages[pIdx - 1].fields.push(field);
      }
    } else {
      if (fIdx < page.fields.length - 1) {
        // Swap within same page
        [page.fields[fIdx], page.fields[fIdx + 1]] = [page.fields[fIdx + 1], page.fields[fIdx]];
      } else if (pIdx < newPages.length - 1) {
        // Move to next page
        const field = page.fields.splice(fIdx, 1)[0];
        newPages[pIdx + 1].fields.unshift(field);
      }
    }
    setPages(newPages);
  };

  const toggle = (pIdx: number, id: string, prop: 'enabled' | 'required') => {
    setPages(p => {
      const np = [...p];
      np[pIdx].fields = np[pIdx].fields.map(x => x.id === id ? { ...x, [prop]: !x[prop] } : x);
      return np;
    });
  };

  const update = (pIdx: number, id: string, prop: string, val: any) => {
    setPages(p => {
      const np = [...p];
      np[pIdx].fields = np[pIdx].fields.map(x => x.id === id ? { ...x, [prop]: val } : x);
      return np;
    });
  };

  const addField = (pIdx: number) => {
    const id = `cf_${Date.now()}`;
    const nf: BookingField = { id, label: 'New Question', type: 'text', placeholder: 'Answer here', required: false, enabled: true, order: 0, isDefault: false };
    setPages(p => {
      const np = [...p];
      np[pIdx].fields.push(nf);
      return np;
    });
    setEditingId(id);
  };

  const removeField = (pIdx: number, id: string) => {
    setPages(p => {
      const np = [...p];
      np[pIdx].fields = np[pIdx].fields.filter(x => x.id !== id);
      return np;
    });
  };

  const addOption = (pIdx: number, fieldId: string) => {
    if (!newOption.trim()) return;
    setPages(p => {
      const np = [...p];
      const f = np[pIdx].fields.find(x => x.id === fieldId);
      if (f) {
        f.options = [...(f.options || []), newOption.trim()];
      }
      return np;
    });
    setNewOption('');
  };

  if (!user || !orgId) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">

            {/* Page header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Booking Form Builder</h1>
                <p className="text-sm text-gray-500 mt-1">Customize the multi-page form your customers fill when booking.</p>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" />
                  : saved ? <CheckCircle2 className="w-4 h-4" />
                  : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Color picker */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-indigo-600" />
                </div>
                <h2 className="font-semibold text-gray-900">Booking UI Color</h2>
              </div>
              <p className="text-sm text-gray-500 ml-11 mb-4">Used for buttons, progress bars, and accents in the booking flow.</p>
              <div className="flex items-center gap-4 ml-11 flex-wrap">
                <input type="color" value={bookingColor} onChange={e => setBookingColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer border-2 border-gray-200 p-0.5 bg-transparent" />
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PRESETS.map(c => (
                    <button key={c} onClick={() => setBookingColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${bookingColor === c ? 'border-gray-900 scale-110' : 'border-white shadow'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">{bookingColor}</span>
              </div>
            </div>

            {/* Pages list */}
            {loading ? (
              <div className="p-10 text-center text-gray-400 bg-white rounded-2xl border border-gray-200 mb-6 shadow-sm">Loading...</div>
            ) : (
              <div className="space-y-6 mb-6">
                {pages.map((page, pIdx) => (
                  <div key={page.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                          {pIdx + 1}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={page.title}
                            onChange={(e) => updatePageTitle(pIdx, e.target.value)}
                            className="font-bold text-gray-900 border-none bg-transparent p-0 focus:ring-0 text-lg w-full placeholder-gray-300"
                            placeholder="Page Title (e.g., Personal Details)"
                          />
                        </div>
                      </div>
                      {pIdx > 0 && (
                        <button onClick={() => removePage(pIdx)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Remove Page">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-gray-100">
                      {page.fields.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-400">No fields on this page.</div>
                      ) : (
                        page.fields.map((field, fIdx) => (
                          <div key={field.id} className={`${!field.enabled ? 'bg-gray-50/70 opacity-60' : ''}`}>
                            {/* Row */}
                            <div className="flex items-center gap-3 px-4 py-3.5">
                              {/* Reorder */}
                              <div className="flex flex-col gap-0.5">
                                <button onClick={() => moveField(pIdx, fIdx, 'up')} disabled={pIdx === 0 && fIdx === 0}
                                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:invisible transition-colors">
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => moveField(pIdx, fIdx, 'down')} disabled={pIdx === pages.length - 1 && fIdx === page.fields.length - 1}
                                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:invisible transition-colors">
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Label + type */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-medium text-gray-900 text-sm">{field.label}</span>
                                  {field.required && (
                                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Required</span>
                                  )}
                                  {field.isDefault && (
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Default</span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400">{TYPE_LABELS[field.type]}</span>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button onClick={() => toggle(pIdx, field.id, 'required')}
                                  className={`text-[11px] px-2 py-1 rounded-lg font-semibold border transition-colors ${field.required ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`}>
                                  {field.required ? '* Req' : 'Opt'}
                                </button>
                                <button onClick={() => toggle(pIdx, field.id, 'enabled')} title={field.enabled ? 'Hide' : 'Show'}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                  {field.enabled ? <Eye className="w-4 h-4 text-gray-500" /> : <EyeOff className="w-4 h-4 text-gray-300" />}
                                </button>
                                <button onClick={() => setEditingId(editingId === field.id ? null : field.id)}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border transition-colors ${editingId === field.id ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                                  Edit
                                </button>
                                {!field.isDefault && (
                                  <button onClick={() => removeField(pIdx, field.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Edit panel */}
                            {editingId === field.id && (
                              <div className="px-4 pb-5 pt-3 ml-7 border-t border-gray-100 bg-gray-50/80 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Label</label>
                                    <input type="text" value={field.label}
                                      onChange={e => update(pIdx, field.id, 'label', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-white" />
                                  </div>
                                  {!field.isDefault && (
                                    <div className="space-y-1">
                                      <label className="text-xs font-semibold text-gray-600">Field Type</label>
                                      <select value={field.type} onChange={e => update(pIdx, field.id, 'type', e.target.value as FieldType)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-white">
                                        {(Object.entries(TYPE_LABELS) as [FieldType, string][]).map(([v, l]) => (
                                          <option key={v} value={v}>{l}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                  {field.type !== 'select' && field.type !== 'date' && (
                                    <div className="space-y-1">
                                      <label className="text-xs font-semibold text-gray-600">Placeholder</label>
                                      <input type="text" value={field.placeholder || ''}
                                        onChange={e => update(pIdx, field.id, 'placeholder', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-white" />
                                    </div>
                                  )}
                                </div>

                                {/* Options editor for custom select fields */}
                                {field.type === 'select' && !field.isDefault && (
                                  <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-600">Dropdown Options</label>
                                    <div className="space-y-1.5">
                                      {(field.options || []).map((opt, oi) => (
                                        <div key={oi} className="flex items-center gap-2">
                                          <span className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5">{opt}</span>
                                          <button onClick={() => update(pIdx, field.id, 'options', (field.options || []).filter((_, i) => i !== oi))}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                      <div className="flex gap-2">
                                        <input type="text" value={newOption} onChange={e => setNewOption(e.target.value)}
                                          placeholder="Add option..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(pIdx, field.id); } }}
                                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-white" />
                                        <button onClick={() => addOption(pIdx, field.id)}
                                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                                          Add
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add custom field */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                      <button onClick={() => addField(pIdx)}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm px-4 py-3 rounded-xl w-full justify-center border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
                        <Plus className="w-4 h-4" />
                        Add Question to {page.title || `Page ${pIdx + 1}`}
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Add New Page Button */}
                <button onClick={addPage}
                  className="flex items-center gap-2 text-gray-600 hover:text-indigo-700 font-semibold text-sm px-4 py-4 rounded-2xl w-full justify-center border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all shadow-sm">
                  <Plus className="w-5 h-5" />
                  Add New Form Page
                </button>
              </div>
            )}

            {/* Terms & Conditions Panel */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">Terms & Conditions</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Show T&C checkbox in the booking form for customers to accept.</p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Enable / Disable T&C */}
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Show T&C in Booking Form</p>
                    <p className="text-xs text-gray-500 mt-0.5">Display a checkbox with a "Read Terms" link for customers</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTermsEnabled(v => !v)}
                    className="flex items-center gap-2 transition-all"
                  >
                    {termsEnabled
                      ? <ToggleRight className="w-9 h-9 text-indigo-600" />
                      : <ToggleLeft className="w-9 h-9 text-gray-300" />}
                  </button>
                </div>

                {termsEnabled && (
                  <>
                    {/* Mandatory / Optional */}
                    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Acceptance Required</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {termsMandatory ? 'Customers must accept before submitting.' : 'Acceptance is optional — booking proceeds either way.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          termsMandatory ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                        }`}>{termsMandatory ? 'Mandatory' : 'Optional'}</span>
                        <button
                          type="button"
                          onClick={() => setTermsMandatory(v => !v)}
                          className="flex items-center gap-1 transition-all"
                        >
                          {termsMandatory
                            ? <ToggleRight className="w-9 h-9 text-red-500" />
                            : <ToggleLeft className="w-9 h-9 text-gray-300" />}
                        </button>
                      </div>
                    </div>

                    {/* T&C Content Editor */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <label className="text-sm font-semibold text-gray-700">Terms & Conditions Content</label>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">This text will be shown in a scrollable popup when customers click "Read Terms & Conditions".</p>
                      <textarea
                        value={termsContent}
                        onChange={e => setTermsContent(e.target.value)}
                        placeholder={`Enter your Terms & Conditions here...\n\nExample:\n1. Bookings are non-refundable within 7 days of travel.\n2. The agency reserves the right to modify itineraries.\n3. Participants must carry valid ID proof.\n...`}
                        rows={12}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y leading-relaxed font-mono"
                      />
                      <p className="text-xs text-gray-400">{termsContent.length} characters · Supports plain text and line breaks</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <p>Name and Phone are always required for a booking. Custom field answers are saved with each booking and visible in the Bookings section.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

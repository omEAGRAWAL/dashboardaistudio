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
  CheckCircle2, Palette, X,
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
  const { user, orgId, role } = useAuth();
  const [fields, setFields] = useState<BookingField[]>(DEFAULT_BOOKING_FIELDS);
  const [bookingColor, setBookingColor] = useState('#22c55e');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'website_settings', orgId));
        if (snap.exists() && snap.data().bookingForm) {
          const bf = snap.data().bookingForm;
          setBookingColor(bf.bookingColor || '#22c55e');
          if (bf.fields?.length) {
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
            setFields([...merged, ...custom].sort((a, b) => a.order - b.order));
          }
        }
      } finally { setLoading(false); }
    })();
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'website_settings', orgId), {
        bookingForm: { bookingColor, fields: fields.map((f, i) => ({ ...f, order: i })) }
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  const move = (idx: number, dir: 'up' | 'down') => {
    const arr = [...fields];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    setFields(arr);
  };

  const toggle = (id: string, prop: 'enabled' | 'required') =>
    setFields(f => f.map(x => x.id === id ? { ...x, [prop]: !x[prop] } : x));

  const update = (id: string, prop: string, val: any) =>
    setFields(f => f.map(x => x.id === id ? { ...x, [prop]: val } : x));

  const addField = () => {
    const id = `cf_${Date.now()}`;
    const nf: BookingField = { id, label: 'New Question', type: 'text', placeholder: 'Answer here', required: false, enabled: true, order: fields.length, isDefault: false };
    setFields(f => [...f, nf]);
    setEditingId(id);
  };

  const removeField = (id: string) => setFields(f => f.filter(x => x.id !== id));

  const addOption = (fieldId: string) => {
    if (!newOption.trim()) return;
    const f = fields.find(x => x.id === fieldId);
    if (!f) return;
    update(fieldId, 'options', [...(f.options || []), newOption.trim()]);
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
                <p className="text-sm text-gray-500 mt-1">Customize the form your customers fill when booking.</p>
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
              <p className="text-sm text-gray-500 ml-11 mb-4">Used for buttons and accents in the booking flow.</p>
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

            {/* Fields list */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Form Fields</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Reorder, enable/disable, and add custom questions</p>
                </div>
              </div>

              {loading ? (
                <div className="p-10 text-center text-gray-400">Loading...</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {fields.map((field, idx) => (
                    <div key={field.id} className={`${!field.enabled ? 'bg-gray-50/70 opacity-60' : ''}`}>

                      {/* Row */}
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        {/* Reorder */}
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => move(idx, 'up')} disabled={idx === 0}
                            className="p-0.5 text-gray-300 hover:text-gray-600 disabled:invisible transition-colors">
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => move(idx, 'down')} disabled={idx === fields.length - 1}
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
                          <button onClick={() => toggle(field.id, 'required')}
                            className={`text-[11px] px-2 py-1 rounded-lg font-semibold border transition-colors ${field.required ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`}>
                            {field.required ? '* Req' : 'Opt'}
                          </button>
                          <button onClick={() => toggle(field.id, 'enabled')} title={field.enabled ? 'Hide' : 'Show'}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            {field.enabled ? <Eye className="w-4 h-4 text-gray-500" /> : <EyeOff className="w-4 h-4 text-gray-300" />}
                          </button>
                          <button onClick={() => setEditingId(editingId === field.id ? null : field.id)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border transition-colors ${editingId === field.id ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                            Edit
                          </button>
                          {!field.isDefault && (
                            <button onClick={() => removeField(field.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
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
                                onChange={e => update(field.id, 'label', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-white" />
                            </div>
                            {!field.isDefault && (
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600">Field Type</label>
                                <select value={field.type} onChange={e => update(field.id, 'type', e.target.value as FieldType)}
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
                                  onChange={e => update(field.id, 'placeholder', e.target.value)}
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
                                    <button onClick={() => update(field.id, 'options', (field.options || []).filter((_, i) => i !== oi))}
                                      className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                                <div className="flex gap-2">
                                  <input type="text" value={newOption} onChange={e => setNewOption(e.target.value)}
                                    placeholder="Add option..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(field.id); } }}
                                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-white" />
                                  <button onClick={() => addOption(field.id)}
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
                  ))}
                </div>
              )}

              {/* Add custom field */}
              <div className="p-4 border-t border-gray-100">
                <button onClick={addField}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm px-4 py-3 rounded-xl w-full justify-center border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
                  <Plus className="w-4 h-4" />
                  Add Custom Question
                </button>
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

'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ImageUploadGrid } from '@/components/ImageUploadGrid';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Package, Plus, Trash2, Edit2, Image as ImageIcon, MapPin, Clock,
  X, ChevronDown, ChevronUp, CheckCircle, XCircle, List, Zap,
  Users, Flag, ExternalLink, Star, AlignLeft, Info
} from 'lucide-react';

const CATEGORIES = ['Beach', 'Adventure', 'Cultural', 'Wildlife', 'Pilgrimage', 'Honeymoon', 'Family', 'Backpacking', 'Luxury', 'Cruise', 'Hill Station', 'Desert'];
const DIFFICULTIES = ['Easy', 'Moderate', 'Challenging', 'Expert'];
const DIFFICULTY_COLOR: Record<string, string> = { Easy: 'bg-green-100 text-green-700', Moderate: 'bg-amber-100 text-amber-700', Challenging: 'bg-orange-100 text-orange-700', Expert: 'bg-red-100 text-red-700' };

const EMPTY_FORM = {
  title: '', destination: '', category: '', difficulty: 'Easy', departureCity: '',
  description: '', imageUrl: '', images: [] as string[], duration: '',
  priceDouble: '', priceTriple: '', priceQuad: '',
  highlights: [''],
  inclusions: [''],
  exclusions: [''],
  itinerary: [{ day: 1, title: '', description: '' }] as Array<{ day: number; title: string; description: string }>,
  minGroupSize: '', maxGroupSize: '', note: '',
};

type FormData = typeof EMPTY_FORM;

type SectionKey = 'basic' | 'pricing' | 'description' | 'highlights' | 'inclusions' | 'itinerary' | 'images' | 'notes';

const FORM_SECTIONS: { id: SectionKey; label: string; icon: React.ReactNode }[] = [
  { id: 'basic', label: 'Basic Info', icon: <Info className="w-4 h-4" /> },
  { id: 'pricing', label: 'Pricing', icon: <Star className="w-4 h-4" /> },
  { id: 'description', label: 'Description', icon: <AlignLeft className="w-4 h-4" /> },
  { id: 'highlights', label: 'Highlights', icon: <Zap className="w-4 h-4" /> },
  { id: 'inclusions', label: 'Inclusions & Exclusions', icon: <CheckCircle className="w-4 h-4" /> },
  { id: 'itinerary', label: 'Day-wise Itinerary', icon: <List className="w-4 h-4" /> },
  { id: 'images', label: 'Photos', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'notes', label: 'Notes & Terms', icon: <Info className="w-4 h-4" /> },
];

export default function PackagesPage() {
  const { user, orgId, role } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [activeSection, setActiveSection] = useState<SectionKey>('basic');
  const [expandedItinerary, setExpandedItinerary] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    if (!orgId) return;
    const q = query(collection(db, 'packages'), where('orgId', '==', orgId));
    const unsub = onSnapshot(q, snap => {
      setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [orgId]);

  const set = (patch: Partial<FormData>) => setFormData(prev => ({ ...prev, ...patch }));

  const handleOpenModal = (pkg: any = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        title: pkg.title || '', destination: pkg.destination || '',
        category: pkg.category || '', difficulty: pkg.difficulty || 'Easy',
        departureCity: pkg.departureCity || '',
        description: pkg.description || '',
        imageUrl: pkg.imageUrl || '',
        images: pkg.images || (pkg.imageUrl ? [pkg.imageUrl] : []),
        duration: pkg.duration || '',
        priceDouble: pkg.priceDouble?.toString() || '',
        priceTriple: pkg.priceTriple?.toString() || '',
        priceQuad: pkg.priceQuad?.toString() || '',
        highlights: pkg.highlights?.length ? pkg.highlights : [''],
        inclusions: pkg.inclusions?.length ? pkg.inclusions : [''],
        exclusions: pkg.exclusions?.length ? pkg.exclusions : [''],
        itinerary: pkg.itinerary?.length ? pkg.itinerary : [{ day: 1, title: '', description: '' }],
        minGroupSize: pkg.minGroupSize?.toString() || '',
        maxGroupSize: pkg.maxGroupSize?.toString() || '',
        note: pkg.note || '',
      });
    } else {
      setEditingPackage(null);
      setFormData(EMPTY_FORM);
    }
    setActiveSection('basic');
    setExpandedItinerary(new Set([0]));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    const data: any = {
      orgId,
      title: formData.title, destination: formData.destination,
      category: formData.category, difficulty: formData.difficulty,
      departureCity: formData.departureCity,
      description: formData.description,
      imageUrl: formData.images[0] || formData.imageUrl,
      images: formData.images,
      duration: formData.duration,
      priceDouble: Number(formData.priceDouble) || 0,
      priceTriple: Number(formData.priceTriple) || 0,
      priceQuad: Number(formData.priceQuad) || 0,
      highlights: formData.highlights.filter(h => h.trim()),
      inclusions: formData.inclusions.filter(i => i.trim()),
      exclusions: formData.exclusions.filter(e => e.trim()),
      itinerary: formData.itinerary.filter(d => d.title.trim() || d.description.trim()),
      minGroupSize: Number(formData.minGroupSize) || null,
      maxGroupSize: Number(formData.maxGroupSize) || null,
      note: formData.note,
    };
    try {
      if (editingPackage) {
        await updateDoc(doc(db, 'packages', editingPackage.id), data);
      } else {
        await addDoc(collection(db, 'packages'), { ...data, createdAt: serverTimestamp() });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save package');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    await deleteDoc(doc(db, 'packages', id)).catch(console.error);
  };

  // Dynamic list helpers
  const updateList = (key: 'highlights' | 'inclusions' | 'exclusions', i: number, val: string) => {
    const arr = [...formData[key]]; arr[i] = val; set({ [key]: arr });
  };
  const addListItem = (key: 'highlights' | 'inclusions' | 'exclusions') => set({ [key]: [...formData[key], ''] });
  const removeListItem = (key: 'highlights' | 'inclusions' | 'exclusions', i: number) => set({ [key]: formData[key].filter((_, idx) => idx !== i) });

  // Itinerary helpers
  const updateDay = (i: number, field: string, val: string) => {
    const arr = [...formData.itinerary]; arr[i] = { ...arr[i], [field]: val }; set({ itinerary: arr });
  };
  const addDay = () => {
    const next = formData.itinerary.length + 1;
    set({ itinerary: [...formData.itinerary, { day: next, title: '', description: '' }] });
    setExpandedItinerary(prev => new Set([...prev, formData.itinerary.length]));
  };
  const removeDay = (i: number) => {
    const arr = formData.itinerary.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, day: idx + 1 }));
    set({ itinerary: arr });
  };
  const toggleDay = (i: number) => setExpandedItinerary(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });

  if (!user || (!orgId && role !== 'superadmin')) return null;

  const inp = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50 focus:bg-white transition-colors";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Travel Packages</h1>
                <p className="text-gray-400 text-sm mt-1">Manage packages displayed on your public website.</p>
              </div>
              <button onClick={() => handleOpenModal()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Create Package
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-400">Loading packages...</div>
            ) : packages.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No packages yet</h3>
                <p className="text-gray-400 mb-6 text-sm">Create your first travel package to display on your website.</p>
                <button onClick={() => handleOpenModal()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                  Create Package
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map(pkg => {
                  const cover = pkg.images?.[0] || pkg.imageUrl;
                  const prices = [pkg.priceDouble, pkg.priceTriple, pkg.priceQuad].filter(p => p > 0);
                  const minPrice = prices.length ? Math.min(...prices) : null;
                  return (
                    <div key={pkg.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                      {/* Image */}
                      <div className="h-48 bg-gray-100 relative">
                        {cover
                          ? <img src={cover} alt={pkg.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-10 h-10" /></div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                          {pkg.category && (
                            <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{pkg.category}</span>
                          )}
                          {pkg.difficulty && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${DIFFICULTY_COLOR[pkg.difficulty] || 'bg-gray-100 text-gray-700'}`}>{pkg.difficulty}</span>
                          )}
                        </div>
                        {pkg.images?.length > 1 && (
                          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] text-white font-medium">
                            📷 {pkg.images.length} photos
                          </div>
                        )}
                        {/* Actions */}
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          <button onClick={() => handleOpenModal(pkg)} className="p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-sm backdrop-blur-sm transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(pkg.id)} className="p-1.5 bg-white/90 hover:bg-white text-red-500 rounded-lg shadow-sm backdrop-blur-sm transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-semibold mb-1.5">
                          <MapPin className="w-3.5 h-3.5" />{pkg.destination}
                          {pkg.duration && <><span className="text-gray-300 mx-1">·</span><Clock className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-500">{pkg.duration}</span></>}
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 line-clamp-2">{pkg.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2 flex-1 mb-4">{pkg.description}</p>

                        {/* Feature pills */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {pkg.itinerary?.length > 0 && (
                            <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{pkg.itinerary.length}-day itinerary</span>
                          )}
                          {pkg.inclusions?.length > 0 && (
                            <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{pkg.inclusions.length} inclusions</span>
                          )}
                          {pkg.highlights?.length > 0 && (
                            <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{pkg.highlights.length} highlights</span>
                          )}
                          {pkg.departureCity && (
                            <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Flag className="w-2.5 h-2.5" />{pkg.departureCity}</span>
                          )}
                        </div>

                        {/* Pricing */}
                        <div className="border-t border-gray-100 pt-4 grid grid-cols-3 gap-2 text-center">
                          {[{ label: 'Double', price: pkg.priceDouble }, { label: 'Triple', price: pkg.priceTriple }, { label: 'Quad', price: pkg.priceQuad }].map(t => (
                            <div key={t.label}>
                              <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">{t.label}</p>
                              <p className="font-bold text-gray-900 text-sm">₹{t.price || '—'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">{editingPackage ? 'Edit Package' : 'Create Package'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar nav */}
              <div className="w-52 border-r border-gray-100 bg-gray-50/50 p-3 flex-shrink-0 overflow-y-auto">
                {FORM_SECTIONS.map(sec => (
                  <button key={sec.id} type="button" onClick={() => setActiveSection(sec.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 text-left ${activeSection === sec.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <span className={activeSection === sec.id ? 'text-white' : 'text-gray-400'}>{sec.icon}</span>
                    {sec.label}
                  </button>
                ))}
              </div>

              {/* Form content */}
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-5">

                  {/* Basic Info */}
                  {activeSection === 'basic' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Package Title *</label>
                          <input required value={formData.title} onChange={e => set({ title: e.target.value })} className={inp} placeholder="e.g. Bali Beach Getaway" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Destination *</label>
                          <input required value={formData.destination} onChange={e => set({ destination: e.target.value })} className={inp} placeholder="e.g. Bali, Indonesia" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Category</label>
                          <select value={formData.category} onChange={e => set({ category: e.target.value })} className={inp}>
                            <option value="">Select category</option>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Difficulty Level</label>
                          <select value={formData.difficulty} onChange={e => set({ difficulty: e.target.value })} className={inp}>
                            {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Duration *</label>
                          <input required value={formData.duration} onChange={e => set({ duration: e.target.value })} className={inp} placeholder="5 Days / 4 Nights" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Departure City</label>
                          <input value={formData.departureCity} onChange={e => set({ departureCity: e.target.value })} className={inp} placeholder="e.g. Mumbai" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Group Size</label>
                          <div className="flex gap-2 items-center">
                            <input value={formData.minGroupSize} onChange={e => set({ minGroupSize: e.target.value })} type="number" min="1" className={inp} placeholder="Min" />
                            <span className="text-gray-400 text-sm flex-shrink-0">–</span>
                            <input value={formData.maxGroupSize} onChange={e => set({ maxGroupSize: e.target.value })} type="number" min="1" className={inp} placeholder="Max" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  {activeSection === 'pricing' && (
                    <div className="space-y-5">
                      <p className="text-sm text-gray-500 bg-indigo-50 border border-indigo-100 rounded-xl p-3">Prices are per person. All three sharing types are shown to customers on your public site.</p>
                      <div className="grid grid-cols-3 gap-6">
                        {[{ label: 'Double Sharing', key: 'priceDouble' as const, desc: '2 persons per room' },
                          { label: 'Triple Sharing', key: 'priceTriple' as const, desc: '3 persons per room' },
                          { label: 'Quad Sharing', key: 'priceQuad' as const, desc: '4 persons per room' }].map(({ label, key, desc }) => (
                          <div key={key} className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">{label}</label>
                            <p className="text-xs text-gray-400">{desc}</p>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₹</span>
                              <input required type="number" min="0" value={formData[key]} onChange={e => set({ [key]: e.target.value })}
                                className={`${inp} pl-8`} placeholder="0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {activeSection === 'description' && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Package Description *</label>
                      <p className="text-xs text-gray-400">Write a compelling overview of the package. This is shown on the package detail page.</p>
                      <textarea required value={formData.description} onChange={e => set({ description: e.target.value })} rows={10}
                        className={inp + ' resize-none'} placeholder="Describe this travel package in detail. Include what makes it special, the experience travelers can expect, accommodation details, and any other relevant information..." />
                    </div>
                  )}

                  {/* Highlights */}
                  {activeSection === 'highlights' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">Key Highlights</label>
                        <p className="text-xs text-gray-400">Short bullet points of the best things about this package. Displayed prominently on the detail page.</p>
                      </div>
                      <div className="space-y-2">
                        {formData.highlights.map((h, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                            <input value={h} onChange={e => updateList('highlights', i, e.target.value)} className={inp + ' flex-1'}
                              placeholder={`e.g. Sunrise trek to Mount Batur`} />
                            <button type="button" onClick={() => removeListItem('highlights', i)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => addListItem('highlights')}
                        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
                        <Plus className="w-4 h-4" /> Add Highlight
                      </button>
                    </div>
                  )}

                  {/* Inclusions & Exclusions */}
                  {activeSection === 'inclusions' && (
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 text-green-600" /></div>
                          <label className="text-sm font-semibold text-gray-700">What's Included</label>
                        </div>
                        {formData.inclusions.map((inc, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input value={inc} onChange={e => updateList('inclusions', i, e.target.value)} className={inp + ' flex-1'}
                              placeholder="e.g. Hotel accommodation" />
                            <button type="button" onClick={() => removeListItem('inclusions', i)} className="text-gray-300 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addListItem('inclusions')}
                          className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-semibold">
                          <Plus className="w-4 h-4" /> Add Inclusion
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center"><XCircle className="w-3.5 h-3.5 text-red-500" /></div>
                          <label className="text-sm font-semibold text-gray-700">What's NOT Included</label>
                        </div>
                        {formData.exclusions.map((exc, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input value={exc} onChange={e => updateList('exclusions', i, e.target.value)} className={inp + ' flex-1'}
                              placeholder="e.g. International flights" />
                            <button type="button" onClick={() => removeListItem('exclusions', i)} className="text-gray-300 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addListItem('exclusions')}
                          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-semibold">
                          <Plus className="w-4 h-4" /> Add Exclusion
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Itinerary */}
                  {activeSection === 'itinerary' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">Day-wise Itinerary</label>
                        <p className="text-xs text-gray-400">Add a detailed day-by-day plan. Each day is shown as an expandable section on the public page.</p>
                      </div>
                      {formData.itinerary.map((day, i) => (
                        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer" onClick={() => toggleDay(i)}>
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {day.day}
                            </div>
                            <input
                              value={day.title}
                              onChange={e => { e.stopPropagation(); updateDay(i, 'title', e.target.value); }}
                              onClick={e => e.stopPropagation()}
                              className="flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
                              placeholder={`Day ${day.day} title (e.g. Arrival & City Tour)`}
                            />
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={e => { e.stopPropagation(); removeDay(i); }} className="text-gray-300 hover:text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
                              {expandedItinerary.has(i) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </div>
                          </div>
                          {expandedItinerary.has(i) && (
                            <div className="p-4 bg-white">
                              <textarea value={day.description} onChange={e => updateDay(i, 'description', e.target.value)}
                                rows={4} className={inp + ' resize-none'} placeholder={`Describe Day ${day.day} activities, meals, places to visit...`} />
                            </div>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={addDay}
                        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
                        <Plus className="w-4 h-4" /> Add Day
                      </button>
                    </div>
                  )}

                  {/* Images */}
                  {activeSection === 'images' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">Package Photos</label>
                        <p className="text-xs text-gray-400">Upload multiple photos. The first image is used as the cover. Shown in a gallery on the detail page.</p>
                      </div>
                      <ImageUploadGrid
                        images={formData.images}
                        onChange={imgs => set({ images: imgs, imageUrl: imgs[0] || '' })}
                        maxImages={12}
                        columns={4}
                      />
                    </div>
                  )}

                  {/* Notes */}
                  {activeSection === 'notes' && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Important Notes & Terms</label>
                      <p className="text-xs text-gray-400">Cancellation policy, visa requirements, health conditions, booking terms, etc.</p>
                      <textarea value={formData.note} onChange={e => set({ note: e.target.value })} rows={10}
                        className={inp + ' resize-none'} placeholder="e.g. &#10;• 50% advance required at booking&#10;• Cancellation within 7 days — no refund&#10;• Valid passport required (6 months validity)&#10;• Travel insurance recommended" />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                  <div className="flex gap-1">
                    {FORM_SECTIONS.map((sec, i) => (
                      <button key={sec.id} type="button" onClick={() => setActiveSection(sec.id)}
                        className={`w-2 h-2 rounded-full transition-all ${activeSection === sec.id ? 'bg-indigo-600 w-4' : 'bg-gray-300 hover:bg-gray-400'}`} />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                    <button type="submit"
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors text-sm shadow-sm">
                      {editingPackage ? 'Save Changes' : 'Create Package'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

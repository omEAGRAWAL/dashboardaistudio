'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Globe, Save, ExternalLink } from 'lucide-react';

export default function WebsiteBuilderPage() {
  const { user, orgId, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    themeColor: '#4f46e5',
    heroTitle: 'Discover Your Next Adventure',
    heroSubtitle: 'Explore the world with our curated travel packages.',
    heroImage: '',
    cloudinaryCloudName: '',
    cloudinaryUploadPreset: ''
  });

  useEffect(() => {
    if (!orgId) return;

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'website_settings', orgId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error fetching website settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [orgId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'website_settings', orgId), {
        orgId,
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("Website settings saved successfully!");
    } catch (error) {
      console.error("Error saving website settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!user || (!orgId && role !== 'superadmin')) return null;

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/site/${orgId}` : '';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Website Builder</h1>
                <p className="text-gray-500 text-sm mt-1">Customize your public travel agency storefront.</p>
              </div>
              <a 
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Public Site
              </a>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading settings...</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Storefront Appearance</h2>
                      <p className="text-sm text-gray-500">These settings will be reflected immediately on your public site.</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-8">
                  {/* Theme Settings */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Theme & Branding</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Primary Theme Color</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            value={settings.themeColor} 
                            onChange={e => setSettings({...settings, themeColor: e.target.value})}
                            className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                          />
                          <input 
                            type="text" 
                            value={settings.themeColor} 
                            onChange={e => setSettings({...settings, themeColor: e.target.value})}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Hero Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Hero Section</h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Hero Title</label>
                        <input 
                          type="text" 
                          value={settings.heroTitle} 
                          onChange={e => setSettings({...settings, heroTitle: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g. Discover Your Next Adventure"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Hero Subtitle</label>
                        <textarea 
                          value={settings.heroSubtitle} 
                          onChange={e => setSettings({...settings, heroSubtitle: e.target.value})}
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g. Explore the world with our curated travel packages."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Hero Background Image URL</label>
                        <div className="flex gap-3">
                          <input 
                            type="url" 
                            value={settings.heroImage} 
                            onChange={e => setSettings({...settings, heroImage: e.target.value})}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://images.unsplash.com/..."
                          />
                          <label className="cursor-pointer flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
                            Upload
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                if (!settings.cloudinaryCloudName || !settings.cloudinaryUploadPreset) {
                                  alert("Please configure Cloudinary settings below first.");
                                  return;
                                }

                                try {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  formData.append('upload_preset', settings.cloudinaryUploadPreset);
                                  
                                  const res = await fetch(`https://api.cloudinary.com/v1_1/${settings.cloudinaryCloudName}/image/upload`, {
                                    method: 'POST',
                                    body: formData
                                  });
                                  
                                  const data = await res.json();
                                  if (data.secure_url) {
                                    setSettings({...settings, heroImage: data.secure_url});
                                  } else {
                                    throw new Error(data.error?.message || "Upload failed");
                                  }
                                } catch (error) {
                                  console.error("Upload error:", error);
                                  alert("Failed to upload image. Check your Cloudinary settings.");
                                }
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">Paste a direct link or upload via Cloudinary.</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Cloudinary Settings */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Cloudinary Integration (Optional)</h3>
                    <p className="text-sm text-gray-500 mb-4">If you want to upload images directly instead of pasting URLs, configure your Cloudinary account here.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Cloud Name</label>
                        <input 
                          type="text" 
                          value={settings.cloudinaryCloudName} 
                          onChange={e => setSettings({...settings, cloudinaryCloudName: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g. dzqbzqg..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Upload Preset (Unsigned)</label>
                        <input 
                          type="text" 
                          value={settings.cloudinaryUploadPreset} 
                          onChange={e => setSettings({...settings, cloudinaryUploadPreset: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g. my_preset"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

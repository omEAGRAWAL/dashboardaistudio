'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Package, Plus, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';

export default function PackagesPage() {
  const { user, orgId, role } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [cloudinarySettings, setCloudinarySettings] = useState({ cloudName: '', uploadPreset: '' });

  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    description: '',
    imageUrl: '',
    duration: '',
    priceDouble: '',
    priceTriple: '',
    priceQuad: ''
  });

  useEffect(() => {
    if (!orgId) return;

    // Fetch Cloudinary settings
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'website_settings', orgId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCloudinarySettings({
            cloudName: data.cloudinaryCloudName || '',
            uploadPreset: data.cloudinaryUploadPreset || ''
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();

    const q = query(collection(db, 'packages'), where('orgId', '==', orgId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pkgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPackages(pkgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orgId]);

  const handleOpenModal = (pkg: any = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        title: pkg.title || '',
        destination: pkg.destination || '',
        description: pkg.description || '',
        imageUrl: pkg.imageUrl || '',
        duration: pkg.duration || '',
        priceDouble: pkg.priceDouble?.toString() || '',
        priceTriple: pkg.priceTriple?.toString() || '',
        priceQuad: pkg.priceQuad?.toString() || ''
      });
    } else {
      setEditingPackage(null);
      setFormData({
        title: '', destination: '', description: '', imageUrl: '', duration: '',
        priceDouble: '', priceTriple: '', priceQuad: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    const packageData = {
      orgId,
      title: formData.title,
      destination: formData.destination,
      description: formData.description,
      imageUrl: formData.imageUrl,
      duration: formData.duration,
      priceDouble: Number(formData.priceDouble) || 0,
      priceTriple: Number(formData.priceTriple) || 0,
      priceQuad: Number(formData.priceQuad) || 0,
    };

    try {
      if (editingPackage) {
        await updateDoc(doc(db, 'packages', editingPackage.id), packageData);
      } else {
        await addDoc(collection(db, 'packages'), {
          ...packageData,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving package:", error);
      alert("Failed to save package");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;
    try {
      await deleteDoc(doc(db, 'packages', id));
    } catch (error) {
      console.error("Error deleting package:", error);
    }
  };

  if (!user || (!orgId && role !== 'superadmin')) return null;

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
                <p className="text-gray-500 text-sm mt-1">Manage the packages shown on your public website.</p>
              </div>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Package
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading packages...</div>
            ) : packages.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No packages yet</h3>
                <p className="text-gray-500 mb-6">Create your first travel package to display on your website.</p>
                <button 
                  onClick={() => handleOpenModal()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Package
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map(pkg => (
                  <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="h-48 bg-gray-100 relative">
                      {pkg.imageUrl ? (
                        <img src={pkg.imageUrl} alt={pkg.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-12 h-12 opacity-20" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button onClick={() => handleOpenModal(pkg)} className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-sm backdrop-blur-sm transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(pkg.id)} className="p-2 bg-white/90 hover:bg-white text-red-600 rounded-lg shadow-sm backdrop-blur-sm transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{pkg.title}</h3>
                      </div>
                      <p className="text-sm text-indigo-600 font-medium mb-3">{pkg.destination} • {pkg.duration}</p>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{pkg.description}</p>
                      <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Double</p>
                          <p className="font-medium text-gray-900">${pkg.priceDouble}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Triple</p>
                          <p className="font-medium text-gray-900">${pkg.priceTriple}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Quad</p>
                          <p className="font-medium text-gray-900">${pkg.priceQuad}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">{editingPackage ? 'Edit Package' : 'Create Package'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Package Title</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Bali Getaway" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Destination</label>
                  <input required type="text" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Bali, Indonesia" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Describe the package..."></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Image URL</label>
                  <div className="flex gap-3">
                    <input type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://..." />
                    <label className="cursor-pointer flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
                      Upload
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          if (!cloudinarySettings.cloudName || !cloudinarySettings.uploadPreset) {
                            alert("Please configure Cloudinary settings in the Website Builder first.");
                            return;
                          }

                          try {
                            const uploadData = new FormData();
                            uploadData.append('file', file);
                            uploadData.append('upload_preset', cloudinarySettings.uploadPreset);
                            
                            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinarySettings.cloudName}/image/upload`, {
                              method: 'POST',
                              body: uploadData
                            });
                            
                            const data = await res.json();
                            if (data.secure_url) {
                              setFormData({...formData, imageUrl: data.secure_url});
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Duration</label>
                  <input required type="text" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. 5 Days / 4 Nights" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-4">Pricing (Per Person)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Double Sharing</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input required type="number" min="0" value={formData.priceDouble} onChange={e => setFormData({...formData, priceDouble: e.target.value})} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Triple Sharing</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input required type="number" min="0" value={formData.priceTriple} onChange={e => setFormData({...formData, priceTriple: e.target.value})} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Quad Sharing</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input required type="number" min="0" value={formData.priceQuad} onChange={e => setFormData({...formData, priceQuad: e.target.value})} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                  {editingPackage ? 'Save Changes' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

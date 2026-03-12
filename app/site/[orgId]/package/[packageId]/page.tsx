'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, Clock, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PackageDetailsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const packageId = params.packageId as string;
  const router = useRouter();
  
  const [settings, setSettings] = useState<any>(null);
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    sharingType: 'double',
    numberOfPersons: 2
  });

  useEffect(() => {
    if (!orgId || !packageId) return;

    const fetchData = async () => {
      try {
        // Fetch settings
        const settingsDoc = await getDoc(doc(db, 'website_settings', orgId));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        }

        // Fetch package
        const pkgDoc = await getDoc(doc(db, 'packages', packageId));
        if (pkgDoc.exists()) {
          setPkg({ id: pkgDoc.id, ...pkgDoc.data() });
        }
      } catch (error) {
        console.error("Error fetching package data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orgId, packageId]);

  const calculateTotal = () => {
    if (!pkg) return 0;
    const persons = Number(formData.numberOfPersons);
    if (formData.sharingType === 'double') return pkg.priceDouble * persons;
    if (formData.sharingType === 'triple') return pkg.priceTriple * persons;
    if (formData.sharingType === 'quad') return pkg.priceQuad * persons;
    return 0;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !pkg) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        orgId,
        packageId: pkg.id,
        packageTitle: pkg.title,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        sharingType: formData.sharingType,
        numberOfPersons: Number(formData.numberOfPersons),
        totalPrice: calculateTotal(),
        status: 'Pending',
        source: 'Website',
        createdAt: serverTimestamp()
      });
      setBookingSuccess(true);
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to submit booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!pkg) {
    return <div className="min-h-screen flex items-center justify-center">Package not found.</div>;
  }

  const themeColor = settings?.themeColor || '#4f46e5';

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href={`/site/${orgId}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors">
              <ArrowLeft className="w-5 h-5" /> Back to Packages
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Package Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-3xl overflow-hidden shadow-lg h-[400px] relative">
              <img 
                src={pkg.imageUrl || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop'} 
                alt={pkg.title} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div>
              <div className="flex items-center gap-3 text-lg font-medium mb-4" style={{ color: themeColor }}>
                <MapPin className="w-5 h-5" />
                {pkg.destination}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">{pkg.title}</h1>
              <div className="flex items-center gap-6 text-gray-600 mb-8 border-b border-gray-200 pb-8">
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="w-5 h-5" />
                  {pkg.duration}
                </div>
              </div>
              
              <div className="prose prose-lg max-w-none text-gray-600">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Overview</h3>
                <p className="whitespace-pre-wrap leading-relaxed">{pkg.description}</p>
              </div>
            </div>
          </div>

          {/* Booking Form Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sticky top-24">
              {bookingSuccess ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Booking Confirmed!</h3>
                  <p className="text-gray-600 mb-8">Thank you for booking with us. We will contact you shortly with further details.</p>
                  <Link 
                    href={`/site/${orgId}`}
                    className="inline-block w-full py-4 rounded-xl text-white font-bold text-lg transition-transform hover:scale-105"
                    style={{ backgroundColor: themeColor }}
                  >
                    Return Home
                  </Link>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Book this Package</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Double</p>
                      <p className="font-bold text-gray-900">${pkg.priceDouble}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Triple</p>
                      <p className="font-bold text-gray-900">${pkg.priceTriple}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Quad</p>
                      <p className="font-bold text-gray-900">${pkg.priceQuad}</p>
                    </div>
                  </div>

                  <form onSubmit={handleBooking} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Full Name</label>
                      <input 
                        required 
                        type="text" 
                        value={formData.customerName}
                        onChange={e => setFormData({...formData, customerName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Email Address</label>
                      <input 
                        required 
                        type="email" 
                        value={formData.customerEmail}
                        onChange={e => setFormData({...formData, customerEmail: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Phone Number</label>
                      <input 
                        required 
                        type="tel" 
                        value={formData.customerPhone}
                        onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                        placeholder="+1 234 567 8900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Sharing Type</label>
                        <select 
                          value={formData.sharingType}
                          onChange={e => setFormData({...formData, sharingType: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 font-medium"
                        >
                          <option value="double">Double</option>
                          <option value="triple">Triple</option>
                          <option value="quad">Quad</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Persons</label>
                        <input 
                          required 
                          type="number" 
                          min="1"
                          value={formData.numberOfPersons}
                          onChange={e => setFormData({...formData, numberOfPersons: parseInt(e.target.value) || 1})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 font-medium text-center"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 mt-6">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-600 font-medium">Total Price</span>
                        <span className="text-3xl font-black text-gray-900">${calculateTotal()}</span>
                      </div>
                      
                      <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full py-4 rounded-xl text-white font-bold text-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
                        style={{ backgroundColor: themeColor }}
                      >
                        {submitting ? 'Processing...' : 'Confirm Booking'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

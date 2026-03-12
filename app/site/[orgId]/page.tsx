'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PublicSitePage() {
  const params = useParams();
  const orgId = params.orgId as string;
  
  const [settings, setSettings] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;

    const fetchData = async () => {
      try {
        // Fetch settings
        const settingsDoc = await getDoc(doc(db, 'website_settings', orgId));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        }

        // Fetch packages
        const pkgsQuery = query(collection(db, 'packages'), where('orgId', '==', orgId));
        const pkgsSnapshot = await getDocs(pkgsQuery);
        const pkgsData = pkgsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setPackages(pkgsData);
      } catch (error) {
        console.error("Error fetching site data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orgId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const themeColor = settings?.themeColor || '#4f46e5';
  const heroImage = settings?.heroImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop';

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="font-bold text-xl" style={{ color: themeColor }}>
              Travel Agency
            </div>
            <div className="flex gap-6">
              <a href="#packages" className="text-gray-600 hover:text-gray-900 font-medium">Destinations</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 font-medium">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            {settings?.heroTitle || 'Discover Your Next Adventure'}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 font-light">
            {settings?.heroSubtitle || 'Explore the world with our curated travel packages.'}
          </p>
          <a 
            href="#packages"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-lg transition-transform hover:scale-105"
            style={{ backgroundColor: themeColor }}
          >
            View Packages <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Packages Section */}
      <div id="packages" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Popular Destinations</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Choose from our handpicked selection of premium travel experiences.</p>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No packages available at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map(pkg => (
              <Link href={`/site/${orgId}/package/${pkg.id}`} key={pkg.id} className="group">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                  <div className="h-64 relative overflow-hidden">
                    <img 
                      src={pkg.imageUrl || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop'} 
                      alt={pkg.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-gray-900 shadow-sm">
                      From ${Math.min(pkg.priceDouble || 9999, pkg.priceTriple || 9999, pkg.priceQuad || 9999)}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 font-medium">
                      <MapPin className="w-4 h-4" style={{ color: themeColor }} />
                      {pkg.destination}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {pkg.title}
                    </h3>
                    <p className="text-gray-600 mb-6 line-clamp-3 flex-1">
                      {pkg.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                        <Clock className="w-4 h-4" />
                        {pkg.duration}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold" style={{ color: themeColor }}>
                        View Details <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4" style={{ color: themeColor }}>Travel Agency</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">Making your dream vacations a reality with expertly curated travel packages.</p>
          <div className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Travel Agency. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

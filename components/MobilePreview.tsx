'use client';

import { MapPin, Phone, Mail, Star } from 'lucide-react';

interface PreviewSettings {
  agencyName?: string; agencyLogo?: string; agencyTagline?: string;
  themeColor?: string; fontStyle?: string;
  announcementBarEnabled?: boolean; announcementBarText?: string;
  heroTitle?: string; heroSubtitle?: string; heroCta?: string;
  heroImage?: string; heroOverlayOpacity?: number;
  featuresEnabled?: boolean;
  featureItems?: Array<{ title: string; description: string }>;
  packagesTitle?: string;
  galleryImages?: string[];
  statsEnabled?: boolean;
  statItems?: Array<{ value: string; label: string }>;
  aboutTitle?: string; aboutDescription?: string; aboutImage?: string;
  testimonialsEnabled?: boolean;
  testimonialItems?: Array<{ name: string; role: string; quote: string; rating: number }>;
  contactPhone?: string; contactEmail?: string;
  footerText?: string;
}

interface MobilePreviewProps {
  settings: PreviewSettings;
  packages?: any[];
  viewMode?: 'mobile' | 'desktop';
}

function PreviewContent({ settings, packages = [], compact = false }: { settings: PreviewSettings; packages?: any[]; compact?: boolean }) {
  const tc = settings.themeColor || '#4f46e5';
  const overlayOpacity = (settings.heroOverlayOpacity ?? 45) / 100;
  const heroImage = settings.heroImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop';
  const agencyName = settings.agencyName || 'Travel Agency';
  const isSerif = settings.fontStyle === 'serif';
  const headingFont = isSerif ? "Georgia,'Times New Roman',serif" : 'inherit';

  const featureItems = settings.featureItems?.length ? settings.featureItems : [
    { title: 'Expert Guides' }, { title: 'Best Prices' },
    { title: '24/7 Support' }, { title: 'Custom Packages' },
  ];
  const statItems = settings.statItems?.length ? settings.statItems : [
    { value: '10+', label: 'Years' }, { value: '500+', label: 'Trips' },
    { value: '1K+', label: 'Travelers' }, { value: '50+', label: 'Destinations' },
  ];
  const samplePackages = packages.length > 0 ? packages.slice(0, compact ? 3 : 2) : [
    { title: 'Bali Retreat', destination: 'Bali', duration: '5D/4N', priceDouble: 999 },
    { title: 'Paris Getaway', destination: 'Paris', duration: '7D/6N', priceDouble: 1499 },
    { title: 'Maldives Escape', destination: 'Maldives', duration: '4D/3N', priceDouble: 2199 },
  ];

  // Compact = desktop scaled preview, non-compact = mobile
  const s = compact ? {
    navPad: 'px-2 py-1.5', logoSz: 'w-4 h-4', nameText: 'text-[8px]', navLink: 'text-[6px]',
    heroH: 'h-24', h1: 'text-[12px]', sub: 'text-[7px]', btn: 'text-[7px] px-2 py-0.5 rounded-full',
    sec: 'px-3 py-2.5', secTitle: 'text-[10px]', secSub: 'text-[7px]',
    cardH: 'h-12', cardTitle: 'text-[8px]', cardMeta: 'text-[7px]', cardPad: 'p-1.5',
    featGrid: 'grid-cols-4', featPad: 'p-2', featDot: 'w-1.5 h-1.5', featIcon: 'w-4 h-4',
    featTitle: 'text-[7px]', gallH: 'h-10', statNum: 'text-[12px]', statLabel: 'text-[6px]',
    footPad: 'p-3', footName: 'text-[8px]', footSub: 'text-[6px]',
    pkgGrid: 'grid-cols-3',
  } : {
    navPad: 'px-3 py-2', logoSz: 'w-5 h-5', nameText: 'text-[10px]', navLink: 'text-[8px]',
    heroH: 'h-32', h1: 'text-[14px]', sub: 'text-[8px]', btn: 'text-[8px] px-3 py-1 rounded-full',
    sec: 'px-3 py-3', secTitle: 'text-[11px]', secSub: 'text-[8px]',
    cardH: 'h-14', cardTitle: 'text-[9px]', cardMeta: 'text-[8px]', cardPad: 'p-2',
    featGrid: 'grid-cols-4', featPad: 'p-2', featDot: 'w-2 h-2', featIcon: 'w-5 h-5',
    featTitle: 'text-[8px]', gallH: 'h-12', statNum: 'text-[14px]', statLabel: 'text-[7px]',
    footPad: 'p-3', footName: 'text-[9px]', footSub: 'text-[7px]',
    pkgGrid: 'grid-cols-2',
  };

  return (
    <div className="w-full h-full bg-white overflow-y-auto" style={{ fontFamily: isSerif ? headingFont : 'inherit' }}>

      {/* Announcement */}
      {settings.announcementBarEnabled && settings.announcementBarText && (
        <div className={`text-white text-center font-semibold py-1 ${s.navLink}`} style={{ backgroundColor: tc }}>
          {settings.announcementBarText}
        </div>
      )}

      {/* Navbar */}
      <div className={`sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 flex items-center justify-between ${s.navPad}`}>
        <div className="flex items-center gap-1.5">
          {settings.agencyLogo
            ? <img src={settings.agencyLogo} alt={agencyName} className={`rounded object-cover ${s.logoSz}`} />
            : <div className={`rounded flex items-center justify-center text-white font-bold ${s.logoSz} text-[7px]`} style={{ backgroundColor: tc }}>{agencyName.charAt(0)}</div>
          }
          <span className={`font-bold truncate max-w-[80px] ${s.nameText}`} style={{ color: tc }}>{agencyName}</span>
        </div>
        <div className={`flex gap-2 text-gray-400 font-medium ${s.navLink}`}>
          <span>Packages</span><span>Contact</span>
        </div>
      </div>

      {/* Hero */}
      <div className={`relative flex items-center justify-center overflow-hidden ${s.heroH}`}>
        <img src={heroImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
        <div className="relative z-10 text-center px-3">
          <h2 className={`text-white font-black leading-tight mb-1.5 drop-shadow ${s.h1}`} style={{ fontFamily: headingFont }}>
            {settings.heroTitle || 'Discover Your Next Adventure'}
          </h2>
          <p className={`text-white/75 mb-2 line-clamp-1 ${s.sub}`}>
            {settings.heroSubtitle || 'Explore the world with our curated packages.'}
          </p>
          <span className={`inline-block text-white font-bold ${s.btn}`} style={{ backgroundColor: tc }}>
            {settings.heroCta || 'Explore Packages'} →
          </span>
        </div>
      </div>

      {/* Features */}
      {settings.featuresEnabled !== false && (
        <div className={`${s.sec} bg-white`}>
          <div className={`grid ${s.featGrid} gap-1.5`}>
            {featureItems.slice(0, 4).map((f: any, i: number) => (
              <div key={i} className={`rounded-lg bg-gray-50 text-center ${s.featPad}`}>
                <div className={`rounded-md mx-auto mb-1 flex items-center justify-center ${s.featIcon}`} style={{ backgroundColor: `${tc}20` }}>
                  <div className={`rounded-full ${s.featDot}`} style={{ backgroundColor: tc }} />
                </div>
                <p className={`font-bold text-gray-800 leading-tight ${s.featTitle}`}>{f.title || `Feature ${i + 1}`}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packages */}
      <div className={`${s.sec} bg-gray-50`}>
        <p className={`font-black text-gray-900 mb-2 ${s.secTitle}`} style={{ fontFamily: headingFont }}>
          {settings.packagesTitle || 'Popular Packages'}
        </p>
        <div className={`grid ${s.pkgGrid} gap-2`}>
          {samplePackages.map((pkg: any, i: number) => {
            const img = pkg.images?.[0] || pkg.imageUrl;
            return (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <div className={`bg-gray-200 relative ${s.cardH}`}>
                  {img
                    ? <img src={img} alt={pkg.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><MapPin className="w-3 h-3 text-gray-300" /></div>
                  }
                  <div className={`absolute top-1 right-1 bg-white/90 rounded-full font-black text-gray-900 text-[5px] px-1.5 py-0.5`}>
                    ₹{pkg.priceDouble || '---'}
                  </div>
                </div>
                <div className={s.cardPad}>
                  <p className={`font-bold text-gray-900 line-clamp-1 ${s.cardTitle}`}>{pkg.title}</p>
                  <p className={`text-gray-400 truncate ${s.cardMeta}`} style={{ color: tc }}>{pkg.destination}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gallery */}
      {settings.galleryImages && settings.galleryImages.length > 0 && (
        <div className={`${s.sec} bg-white`}>
          <p className={`font-black text-gray-900 mb-1.5 ${s.secTitle}`}>Gallery</p>
          <div className="grid grid-cols-3 gap-1">
            {settings.galleryImages.slice(0, 6).map((img, i) => (
              <div key={i} className={`rounded-lg overflow-hidden ${s.gallH} bg-gray-100`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {settings.statsEnabled !== false && (
        <div className={`${s.sec} grid grid-cols-4 gap-1 text-center`} style={{ backgroundColor: tc }}>
          {statItems.slice(0, 4).map((st: any, i: number) => (
            <div key={i}>
              <p className={`font-black text-white ${s.statNum}`}>{st.value}</p>
              <p className={`text-white/70 font-semibold uppercase tracking-wider ${s.statLabel}`}>{st.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* About */}
      {settings.aboutTitle && (
        <div className={`${s.sec} bg-gray-50`}>
          <p className={`font-black text-gray-900 mb-1 ${s.secTitle}`} style={{ fontFamily: headingFont }}>{settings.aboutTitle}</p>
          {settings.aboutImage && (
            <div className={`rounded-xl overflow-hidden mb-1.5 ${s.cardH} bg-gray-200`}>
              <img src={settings.aboutImage} alt="About" className="w-full h-full object-cover" />
            </div>
          )}
          <p className={`text-gray-500 line-clamp-3 ${s.secSub}`}>{settings.aboutDescription}</p>
        </div>
      )}

      {/* Testimonials */}
      {settings.testimonialsEnabled && settings.testimonialItems && settings.testimonialItems.length > 0 && (
        <div className={`${s.sec} bg-white`}>
          <p className={`font-black text-gray-900 mb-1.5 ${s.secTitle}`}>Reviews</p>
          <div className="space-y-1.5">
            {settings.testimonialItems.slice(0, 2).map((t: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 p-2">
                <div className="flex mb-0.5">
                  {Array.from({ length: Math.min(t.rating || 5, 5) }).map((_, j) => (
                    <Star key={j} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className={`text-gray-500 italic line-clamp-2 mb-0.5 ${s.cardMeta}`}>"{t.quote}"</p>
                <p className={`font-bold text-gray-800 ${s.cardMeta}`}>{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <div className={`${s.sec} bg-gray-50`}>
        <p className={`font-black text-gray-900 mb-1.5 ${s.secTitle}`}>Contact</p>
        <div className="space-y-1">
          {settings.contactPhone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 flex-shrink-0" style={{ color: tc }} />
              <span className={`text-gray-600 truncate ${s.cardMeta}`}>{settings.contactPhone}</span>
            </div>
          )}
          {settings.contactEmail && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3 flex-shrink-0" style={{ color: tc }} />
              <span className={`text-gray-600 truncate ${s.cardMeta}`}>{settings.contactEmail}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={`bg-gray-950 ${s.footPad}`}>
        <p className={`font-bold text-white mb-0.5 ${s.footName}`} style={{ color: tc }}>{agencyName}</p>
        <p className={`text-gray-600 ${s.footSub}`}>
          {settings.footerText || `© ${new Date().getFullYear()} ${agencyName}. All rights reserved.`}
        </p>
      </div>
    </div>
  );
}

export function MobilePreview({ settings, packages = [], viewMode = 'mobile' }: MobilePreviewProps) {
  if (viewMode === 'desktop') {
    const CONTENT_W = 620;
    const CONTAINER_W = 410;
    const CONTENT_H = 600;
    const scale = CONTAINER_W / CONTENT_W;
    const containerH = Math.round(CONTENT_H * scale);

    return (
      <div className="flex flex-col items-center">
        <div style={{ width: `${CONTAINER_W}px` }}>
          {/* Browser chrome */}
          <div className="bg-gray-200 rounded-t-xl px-3 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white rounded-md px-2 py-1 text-[10px] text-gray-400 truncate">
              yatrik.com/site/{(settings.agencyName || 'your-agency').toLowerCase().replace(/\s+/g, '-')}
            </div>
          </div>
          {/* Scaled content */}
          <div style={{ width: `${CONTAINER_W}px`, height: `${containerH}px`, overflow: 'hidden', position: 'relative', border: '1.5px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
            <div className="scrollbar-hide" style={{ width: `${CONTENT_W}px`, height: `${CONTENT_H}px`, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <PreviewContent settings={settings} packages={packages} compact={true} />
            </div>
          </div>
        </div>
        {/* Laptop stand */}
        <div style={{ width: `${CONTAINER_W + 30}px` }} className="h-2.5 bg-gray-300 rounded-b-lg mt-0" />
        <div className="w-20 h-1.5 bg-gray-400 rounded-b-lg" />
      </div>
    );
  }

  // Mobile phone frame
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[290px] h-[580px] bg-gray-900 rounded-[2.5rem] p-[10px] shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[22px] bg-gray-900 rounded-b-2xl z-20" />
        {/* Side buttons */}
        <div className="absolute -right-0.5 top-24 w-1 h-8 bg-gray-700 rounded-r" />
        <div className="absolute -left-0.5 top-20 w-1 h-6 bg-gray-700 rounded-l" />
        <div className="absolute -left-0.5 top-28 w-1 h-6 bg-gray-700 rounded-l" />
        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden overflow-y-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <PreviewContent settings={settings} packages={packages} compact={false} />
        </div>
      </div>
      {/* Home indicator */}
      <div className="w-16 h-1 bg-gray-700 rounded-full mt-3" />
    </div>
  );
}

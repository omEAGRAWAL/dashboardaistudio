'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface NavbarClientProps {
  settings: {
    agencyLogo?: string;
    agencyTagline?: string;
    announcementBarEnabled?: boolean;
    announcementBarText?: string;
  } | null;
  tc: string;
  agencyName: string;
  navLinks: { href: string; label: string }[];
}

export function NavbarClient({ settings, tc, agencyName, navLinks }: NavbarClientProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100' : 'bg-transparent'}`}
      style={{ top: settings?.announcementBarEnabled && settings?.announcementBarText ? '40px' : '0' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[72px] items-center">
          <div className="flex items-center gap-3">
            {settings?.agencyLogo
              ? <Image src={settings.agencyLogo} alt={agencyName} width={200} height={40} className="h-10 w-auto rounded-lg object-cover" />
              : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: tc }}>{agencyName.charAt(0)}</div>
            }
            <div>
              <span className={`font-black text-xl tracking-tight ${scrolled ? 'text-gray-900' : 'text-white'}`}>{agencyName}</span>
              {settings?.agencyTagline && (
                <p className={`text-[11px] leading-none mt-0.5 ${scrolled ? 'text-gray-400' : 'text-white/60'}`}>{settings.agencyTagline}</p>
              )}
            </div>
          </div>
          <div className="hidden md:flex gap-8 items-center">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className={`text-sm font-semibold transition-colors hover:opacity-70 ${scrolled ? 'text-gray-700' : 'text-white/90'}`}>
                {link.label}
              </a>
            ))}
            <a href="#contact" className="text-sm font-bold px-6 py-2.5 rounded-full text-white shadow-lg hover:opacity-90 hover:shadow-xl transition-all" style={{ backgroundColor: tc }}>
              Book Now
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

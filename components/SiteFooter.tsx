'use client';

import Link from 'next/link';
import { Phone, Mail, MessageCircle } from 'lucide-react';

interface SiteFooterProps {
  orgId: string;
  settings: any;
}

export default function SiteFooter({ orgId, settings }: SiteFooterProps) {
  const tc = settings?.themeColor || '#4f46e5';
  const agencyName = settings?.agencyName || 'Travel Agency';

  const navLinks = [
    { href: `/site/${orgId}#packages`, label: 'Packages' },
    { href: `/site/${orgId}#about`, label: 'About' },
    { href: `/site/${orgId}#contact`, label: 'Contact' },
  ];

  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              {settings?.agencyLogo
                ? <img src={settings.agencyLogo} alt={agencyName} className="h-9 w-auto rounded-lg" />
                : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: tc }}>{agencyName.charAt(0)}</div>
              }
              <span className="font-bold text-lg">{agencyName}</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              {settings?.footerText || 'Making your dream vacations a reality with expertly curated travel packages.'}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-5">Quick Links</h4>
            <div className="space-y-3">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} className="block text-sm text-gray-500 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-5">Contact</h4>
            <div className="space-y-3 text-sm text-gray-500">
              {settings?.contactPhone && (
                <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4 flex-shrink-0" />{settings.contactPhone}
                </a>
              )}
              {settings?.contactEmail && (
                <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 flex-shrink-0" />{settings.contactEmail}
                </a>
              )}
              {settings?.contactWhatsApp && (
                <a href={`https://wa.me/${settings.contactWhatsApp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />{settings.contactWhatsApp}
                </a>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-5">Legal</h4>
            <div className="space-y-3">
              <Link href={`/site/${orgId}/about-us`} className="block text-sm text-gray-500 hover:text-white transition-colors">About Us</Link>
              <Link href={`/site/${orgId}/privacy-policy`} className="block text-sm text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href={`/site/${orgId}/terms-conditions`} className="block text-sm text-gray-500 hover:text-white transition-colors">Terms &amp; Conditions</Link>
              <Link href={`/site/${orgId}/cancellation-refund`} className="block text-sm text-gray-500 hover:text-white transition-colors">Cancellation &amp; Refund</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} {agencyName}. All rights reserved.</p>
          <p className="text-xs text-gray-700">Powered by Yatrik</p>
        </div>
      </div>
    </footer>
  );
}

'use client';

import { LayoutDashboard, Users, Settings, LogOut, Shield, Package, CalendarCheck, Globe, ClipboardList, Smartphone, X, MessageSquare, Bot, ShieldCheck, Building2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useSidebar } from './SidebarContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const { logOut, role } = useAuth();
  const { isOpen, setIsOpen } = useSidebar();
  const pathname = usePathname();

  const isTeamVisible = role === 'org_admin' || role === 'superadmin';

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
      pathname === path ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'
    }`;

  const handleNav = () => setIsOpen(false);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          w-64 bg-white border-r border-gray-200 h-screen flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Y</span>
            </div>
            <span className="font-bold text-xl text-gray-800 tracking-tight">Yatrik</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/home" onClick={handleNav} className={linkClass('/home')}>
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            Leads
          </Link>

          <Link href="/bookings" onClick={handleNav} className={linkClass('/bookings')}>
            <CalendarCheck className="w-5 h-5 flex-shrink-0" />
            Bookings
          </Link>

          <Link href="/packages" onClick={handleNav} className={linkClass('/packages')}>
            <Package className="w-5 h-5 flex-shrink-0" />
            Packages
          </Link>

          {isTeamVisible && (
            <Link href="/team" onClick={handleNav} className={linkClass('/team')}>
              <Users className="w-5 h-5 flex-shrink-0" />
              Team
            </Link>
          )}

          {isTeamVisible && (
            <Link href="/website-builder" onClick={handleNav} className={linkClass('/website-builder')}>
              <Globe className="w-5 h-5 flex-shrink-0" />
              Website Builder
            </Link>
          )}

          {isTeamVisible && (
            <Link href="/booking-form" onClick={handleNav} className={linkClass('/booking-form')}>
              <ClipboardList className="w-5 h-5 flex-shrink-0" />
              Booking Form
            </Link>
          )}

          {isTeamVisible && (
            <Link href="/campaign-builder" onClick={handleNav} className={linkClass('/campaign-builder')}>
              <Smartphone className="w-5 h-5 flex-shrink-0" />
              Campaign Builder
            </Link>
          )}

          <Link href="/whatsapp" onClick={handleNav} className={linkClass('/whatsapp')}>
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            WhatsApp Inbox
          </Link>

          {isTeamVisible && (
            <Link href="/chatbot" onClick={handleNav} className={linkClass('/chatbot')}>
              <Bot className="w-5 h-5 flex-shrink-0" />
              Chatbot Builder
            </Link>
          )}

          {isTeamVisible && (
            <Link href="/business-profile" onClick={handleNav} className={linkClass('/business-profile')}>
              <Building2 className="w-5 h-5 flex-shrink-0" />
              Business Profile
            </Link>
          )}

          {role === 'superadmin' && (
            <Link href="/admin" onClick={handleNav} className={linkClass('/admin')}>
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              Superadmin
            </Link>
          )}

          <Link href="/settings" onClick={handleNav} className={linkClass('/settings')}>
            <Settings className="w-5 h-5 flex-shrink-0" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logOut}
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg font-medium transition-colors w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

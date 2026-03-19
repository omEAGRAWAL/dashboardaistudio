'use client';

import { LayoutDashboard, Users, Settings, LogOut, Shield, Package, CalendarCheck, Globe, ClipboardList, Smartphone } from 'lucide-react';
import { useAuth } from './AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const { logOut, role } = useAuth();
  const pathname = usePathname();

  const isTeamVisible = role === 'org_admin' || role === 'superadmin';

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 flex items-center gap-2 border-b border-gray-200">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">T</span>
        </div>
        <span className="font-bold text-xl text-gray-800 tracking-tight">Travlyy</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <Link
          href="/home"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            pathname === '/home' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          Leads
        </Link>

        <Link 
          href="/bookings" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            pathname === '/bookings' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <CalendarCheck className="w-5 h-5" />
          Bookings
        </Link>
        
        <Link 
          href="/packages" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            pathname === '/packages' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Package className="w-5 h-5" />
          Packages
        </Link>

        {isTeamVisible && (
          <Link 
            href="/team" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname === '/team' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            Team
          </Link>
        )}

        {isTeamVisible && (
          <Link
            href="/website-builder"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname === '/website-builder' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Globe className="w-5 h-5" />
            Website Builder
          </Link>
        )}

        {isTeamVisible && (
          <Link
            href="/booking-form"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname === '/booking-form' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            Booking Form
          </Link>
        )}

        {isTeamVisible && (
          <Link
            href="/campaign-builder"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              pathname === '/campaign-builder' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            Campaign Builder
          </Link>
        )}
        
        <Link 
          href="/settings" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            pathname === '/settings' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={logOut}
          className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg font-medium transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}

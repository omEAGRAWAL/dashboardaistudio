'use client';

import { LayoutDashboard, Users, Settings, LogOut, Shield } from 'lucide-react';
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

      <nav className="flex-1 p-4 space-y-2">
        <Link 
          href="/" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            pathname === '/' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
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

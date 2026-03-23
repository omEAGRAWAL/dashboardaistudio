'use client';

import Image from 'next/image';
import { Bell, Plus, Search, Menu } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useSidebar } from './SidebarContext';

export function Header() {
  const { user } = useAuth();
  const { setIsOpen } = useSidebar();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search — hidden on smallest screens, expands on sm+ */}
        <div className="relative hidden sm:block w-full max-w-xs md:max-w-sm lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {/* Mobile search icon */}
        <button className="sm:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <Search className="w-5 h-5" />
        </button>

        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <button className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Create Event</span>
        </button>

        <div className="hidden sm:block h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border border-indigo-200 flex-shrink-0">
            {user?.photoURL ? (
              <Image src={user.photoURL} alt={user.displayName || 'User'} width={32} height={32} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-indigo-600 font-bold text-sm">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-700 leading-none">{user?.displayName || 'Travel Agent'}</p>
            <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

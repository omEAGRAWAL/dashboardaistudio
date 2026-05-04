'use client';

import {
  LayoutDashboard, Users, Settings, LogOut, Shield, Package, CalendarCheck,
  Globe, ClipboardList, Smartphone, X, MessageSquare, Bot, ShieldCheck,
  Building2, Lock, AlertTriangle, Megaphone, Mail, Bell,
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useOrg } from './OrgProvider';
import { useSidebar } from './SidebarContext';
import { FEATURES, FeatureKey } from '@/lib/features';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  featureKey?: FeatureKey;
  requiredRole?: 'org_admin' | 'agent';
  onClick: () => void;
}

function NavItem({ href, icon: Icon, label, featureKey, requiredRole, onClick }: NavItemProps) {
  const { role } = useAuth();
  const { hasFeature, isTrialing } = useOrg();
  const pathname = usePathname();

  const active = pathname === href;

  // Superadmin bypasses all feature gating
  if (role === 'superadmin') {
    return (
      <Link href={href} onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${active ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        {label}
      </Link>
    );
  }

  // Role check
  if (requiredRole === 'org_admin' && role !== 'org_admin') return null;

  // Feature check
  const isLocked = featureKey ? !hasFeature(featureKey) : false;

  if (isLocked) {
    const planNeeded = featureKey && [
      FEATURES.CHATBOT_BUILDER, FEATURES.WEBSITE_BUILDER, FEATURES.CAMPAIGN_BUILDER,
      FEATURES.TEAM_MANAGEMENT, FEATURES.CUSTOM_DOMAIN, FEATURES.ANALYTICS,
    ].includes(featureKey as any) ? 'Pro' : 'Starter';

    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-300 cursor-not-allowed select-none relative"
           title={`Upgrade to ${planNeeded} to unlock`}>
        <div className="relative">
          <Icon className="w-5 h-5 flex-shrink-0" />
          <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-gray-400" />
        </div>
        <span>{label}</span>
        <span className="ml-auto text-xs bg-gray-100 text-gray-400 rounded-full px-1.5 py-0.5 font-normal">{planNeeded}</span>
      </div>
    );
  }

  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${active ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const { logOut, role } = useAuth();
  const { isTrialing, trialDaysLeft } = useOrg();
  const { isOpen, setIsOpen } = useSidebar();
  const handleNav = () => setIsOpen(false);

  const showTrialBanner = isTrialing && trialDaysLeft !== null && trialDaysLeft <= 7 && role !== 'superadmin';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <div className={`
        fixed md:relative inset-y-0 left-0 z-50 md:z-auto
        w-64 bg-white border-r border-gray-200 h-screen flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Y</span>
            </div>
            <span className="font-bold text-xl text-gray-800 tracking-tight">Yatrik</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem href="/home"             icon={LayoutDashboard} label="Leads"            featureKey={FEATURES.LEADS_CRM}        onClick={handleNav} />
          <NavItem href="/reminders"        icon={Bell}            label="Reminders"        onClick={handleNav} />
          <NavItem href="/bookings"         icon={CalendarCheck}   label="Bookings"         featureKey={FEATURES.BOOKINGS}         onClick={handleNav} />
          <NavItem href="/packages"         icon={Package}         label="Packages"         featureKey={FEATURES.PACKAGES}         onClick={handleNav} />
          <NavItem href="/whatsapp"         icon={MessageSquare}   label="WhatsApp Inbox"     featureKey={FEATURES.WHATSAPP_INBOX}      onClick={handleNav} />
          <NavItem href="/broadcasts"       icon={Megaphone}       label="WA Broadcasts"      featureKey={FEATURES.WHATSAPP_BROADCAST}  requiredRole="org_admin" onClick={handleNav} />
          <NavItem href="/email-marketing"  icon={Mail}            label="Email Marketing"    featureKey={FEATURES.EMAIL_MARKETING}     requiredRole="org_admin" onClick={handleNav} />
          <NavItem href="/team"             icon={Users}           label="Team"             featureKey={FEATURES.TEAM_MANAGEMENT}  requiredRole="org_admin" onClick={handleNav} />
          <NavItem href="/website-builder"  icon={Globe}           label="Website Builder"  featureKey={FEATURES.WEBSITE_BUILDER}  requiredRole="org_admin" onClick={handleNav} />
          <NavItem href="/booking-form"     icon={ClipboardList}   label="Booking Form"     featureKey={FEATURES.BOOKING_FORM}     requiredRole="org_admin" onClick={handleNav} />
          <NavItem href="/campaign-builder" icon={Smartphone}      label="Campaign Builder" featureKey={FEATURES.CAMPAIGN_BUILDER} requiredRole="org_admin" onClick={handleNav} />
          <NavItem href="/chatbot"          icon={Bot}             label="Chatbot Builder"  featureKey={FEATURES.CHATBOT_BUILDER}  requiredRole="org_admin" onClick={handleNav} />
          <NavItem href="/business-profile" icon={Building2}       label="Business Profile" requiredRole="org_admin"               onClick={handleNav} />

          {role === 'superadmin' && (
            <NavItem href="/admin" icon={ShieldCheck} label="Superadmin" onClick={handleNav} />
          )}

          <NavItem href="/settings" icon={Settings} label="Settings" onClick={handleNav} />
        </nav>

        {/* Trial expiry warning */}
        {showTrialBanner && (
          <div className="mx-3 mb-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-yellow-800">
                {trialDaysLeft! <= 0 ? 'Trial expired' : `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left`}
              </div>
              <Link href="/settings" className="text-yellow-700 underline">Upgrade now</Link>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button onClick={logOut}
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg font-medium transition-colors w-full">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

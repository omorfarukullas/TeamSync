'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Calendar, Users, MessageSquare, LogOut, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    memberId?: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const navTabs = [
    {
      name: 'My Availability',
      href: '/dashboard',
      icon: Calendar,
      exact: true,
    },
    {
      name: 'Team Availability',
      href: '/dashboard/team',
      icon: Users,
      badge: 'Live',
    },
    {
      name: 'Team Chat',
      href: '/dashboard/chat',
      icon: MessageSquare,
    },
  ];

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand / Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-navy-800 to-navy-600 text-white flex items-center justify-center shadow-md shadow-navy-800/20 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-navy-700 transition-colors flex items-center gap-1">
                TeamSync <span className="text-lg">📅</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-400 uppercase tracking-wider -mt-1">
                University Scheduler
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            {navTabs.map((tab) => {
              const isActive = tab.exact
                ? pathname === tab.href
                : pathname.startsWith(tab.href);
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-navy-800 shadow-sm border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-navy-700' : 'text-slate-400'}`} />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {tab.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: User Profile & Logout */}
          <div className="flex items-center gap-3">
            {/* User Avatar + Name */}
            <div className="flex items-center gap-2.5 pl-2">
              <div className="relative">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-navy-600/20 shadow-sm"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-navy-700 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-navy-600/20">
                    {getInitials(user?.name)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.name || 'Team Member'}
                </span>
                <span className="text-[11px] font-medium text-slate-400 capitalize">
                  {user?.memberId || 'Student'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 sm:px-3 sm:py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 flex items-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Calendar, Users, MessageSquare, LogOut } from 'lucide-react';

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
      name: 'MY AVAILABILITY',
      href: '/dashboard',
      icon: Calendar,
      exact: true,
    },
    {
      name: 'TEAM MATRIX',
      href: '/dashboard/team',
      icon: Users,
      badge: 'LIVE',
    },
    {
      name: 'TEAM CHAT',
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
    <header className="sticky top-0 z-40 bg-white border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand / Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-widest text-black group-hover:opacity-75 transition-opacity">
                TEAMSYNC
              </span>
              <span className="font-mono text-[9px] text-[#525252] tracking-widest uppercase -mt-0.5">
                University Scheduling Matrix
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-8 h-full">
            {navTabs.map((tab) => {
              const isActive = tab.exact
                ? pathname === tab.href
                : pathname.startsWith(tab.href);
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`h-full flex items-center gap-2 text-xs font-mono tracking-wider transition-all border-b-2 ${
                    isActive
                      ? 'border-black text-black font-bold'
                      : 'border-transparent text-[#525252] hover:text-black hover:border-black/30'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span className="font-mono text-[9px] font-bold px-1 py-0.2 bg-black text-white border border-black">
                      {tab.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: User Profile & Logout */}
          <div className="flex items-center gap-4">
            {/* User Avatar + Name */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="w-9 h-9 object-cover border-2 border-black"
                  />
                ) : (
                  <div className="w-9 h-9 bg-black text-white flex items-center justify-center font-mono font-bold text-xs border-2 border-black">
                    {getInitials(user?.name)}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-black border border-white" />
              </div>

              <div className="hidden lg:flex flex-col text-left">
                <span className="font-mono text-xs font-bold text-black leading-tight">
                  {user?.name || 'Member'}
                </span>
                <span className="font-mono text-[10px] text-[#525252] uppercase tracking-wider">
                  {user?.memberId || 'Student'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="border border-black px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-black hover:bg-black hover:text-white transition-invert flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


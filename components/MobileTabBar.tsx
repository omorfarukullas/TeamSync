'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users, MessageSquare } from 'lucide-react';

export default function MobileTabBar() {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'My Schedule',
      href: '/dashboard',
      icon: Calendar,
      exact: true,
    },
    {
      name: 'Team View',
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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-lg px-2 py-1.5 pb-safe">
      <div className="grid grid-cols-3 gap-1">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-150 ease-out active:scale-90 select-none relative ${
                isActive
                  ? 'text-navy-700 font-bold bg-navy-50/80 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-navy-700 stroke-[2.5]' : 'text-slate-400'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

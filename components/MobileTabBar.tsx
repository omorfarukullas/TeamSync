'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users, MessageSquare } from 'lucide-react';

export default function MobileTabBar() {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'SCHEDULE',
      href: '/dashboard',
      icon: Calendar,
      exact: true,
    },
    {
      name: 'MATRIX',
      href: '/dashboard/team',
      icon: Users,
      badge: 'LIVE',
    },
    {
      name: 'CHAT',
      href: '/dashboard/chat',
      icon: MessageSquare,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-4 border-black pb-safe">
      <div className="grid grid-cols-3 divide-x divide-black">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-2.5 px-1 transition-invert select-none relative ${
                isActive
                  ? 'bg-black text-white font-bold'
                  : 'bg-white text-black hover:bg-[#F5F5F5]'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" strokeWidth={2} />
                {tab.badge && !isActive && (
                  <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-black" />
                )}
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider mt-1">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


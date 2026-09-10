import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { updateMemberAvatar } from '@/lib/supabase-server';
import Navbar from '@/components/Navbar';
import MobileTabBar from '@/components/MobileTabBar';
import PresenceTracker from '@/components/PresenceTracker';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  // Automatically sync Google account avatar to database if available
  if (session.user.email && session.user.image) {
    updateMemberAvatar(session.user.email, session.user.image).catch(() => {});
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <Navbar user={session.user} />
      <PresenceTracker />

      {/* Main Content Area (extra bottom padding on mobile for MobileTabBar) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 mb-16 md:mb-6">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />
    </div>
  );
}

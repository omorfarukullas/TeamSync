import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import LoginCard from '@/components/LoginCard';

export default async function LoginPage() {
  const session = await auth();

  // If already logged in, go straight to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#1F4E79] via-[#163a5c] to-[#0F2D47] relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-navy-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <LoginCard />

        <footer className="mt-8 text-center text-xs text-navy-200/70 font-medium">
          TeamSync 📅 &copy; {new Date().getFullYear()} &middot; University Team Scheduler
        </footer>
      </div>
    </main>
  );
}

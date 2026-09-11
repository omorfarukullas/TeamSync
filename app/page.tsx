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
    <main className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-white">
      {/* Left Column: Editorial Statement Panel */}
      <section className="bg-black text-white p-8 sm:p-12 md:p-16 lg:p-20 flex flex-col justify-between relative border-b-4 md:border-b-0 md:border-r-4 border-black">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-horizontal-lines opacity-10 pointer-events-none" />

        <div className="relative z-10">
          <div className="font-mono text-[10px] sm:text-xs tracking-[0.25em] text-[#A3A3A3] uppercase mb-4">
            Vol. 01 — Matrix System
          </div>
          <div className="w-12 h-1 bg-white mb-8" />
        </div>

        <div className="relative z-10 my-12 md:my-0">
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] uppercase text-white mb-6">
            Team<br />Sync
          </h1>
          <p className="font-body text-base sm:text-lg lg:text-xl text-[#D4D4D4] max-w-md leading-relaxed">
            Deterministic availability matrices and real-time meeting slot resolution for university project teams.
          </p>
        </div>

        <div className="relative z-10 font-mono text-[10px] sm:text-xs text-[#737373] tracking-widest uppercase flex items-center justify-between border-t border-white/20 pt-6">
          <span>4 Members Only</span>
          <span>Zero Conflicts</span>
        </div>
      </section>

      {/* Right Column: Authentication Panel */}
      <section className="bg-white text-black p-8 sm:p-12 md:p-16 lg:p-20 flex flex-col justify-between items-center relative">
        <div className="w-full flex justify-end">
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#737373]">
            Security: Google OAuth 2.0
          </span>
        </div>

        <div className="w-full max-w-md my-auto py-8">
          <LoginCard />
        </div>

        <footer className="w-full text-center font-mono text-[10px] text-[#737373] tracking-wider uppercase border-t border-black/10 pt-4">
          TeamSync &copy; {new Date().getFullYear()} &middot; Omor Faruk
        </footer>
      </section>
    </main>
  );
}


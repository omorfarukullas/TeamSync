import Link from 'next/link';
import { signOut } from '@/lib/auth';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { DEFAULT_MEMBERS } from '@/lib/constants';

export default function DeniedPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-white relative">
      <div className="w-full max-w-lg bg-black text-white p-8 sm:p-12 border-4 border-black text-left">
        {/* Editorial Top Marker */}
        <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-6">
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#A3A3A3]">
            SECURITY VIOLATION // 403
          </span>
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight uppercase text-white mb-2">
          Access Denied
        </h1>
        <p className="font-mono text-xs uppercase tracking-wider text-[#A3A3A3] mb-6">
          Unregistered Account Signature
        </p>

        <p className="font-body text-sm text-[#D4D4D4] mb-8 leading-relaxed">
          The Google account authenticated is not registered within this workspace. Access to team availability matrices and real-time coordination is limited strictly to authorized cohort members.
        </p>

        {/* Authorized Team List */}
        <div className="border border-white/20 p-4 mb-8 bg-[#171717]">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#A3A3A3] mb-3">
            Authorized Operators:
          </div>
          <ul className="space-y-1.5 font-mono text-xs text-white">
            {DEFAULT_MEMBERS.map((m) => (
              <li key={m.id} className="flex items-center justify-between border-b border-white/10 pb-1 last:border-0 last:pb-0">
                <span className="font-bold">{m.name}</span>
                <span className="text-[#A3A3A3] text-[11px]">{m.email}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-white text-black hover:bg-[#E5E5E5] font-mono text-xs uppercase tracking-widest transition-invert flex items-center justify-center gap-2 border border-white"
            >
              <LogOut className="w-4 h-4" />
              <span>Switch Account</span>
            </button>
          </form>

          <Link
            href="/"
            className="w-full py-3.5 px-4 bg-transparent hover:bg-white/10 text-white font-mono text-xs uppercase tracking-widest transition-invert flex items-center justify-center gap-2 border border-white/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portal</span>
          </Link>
        </div>
      </div>
    </main>
  );
}


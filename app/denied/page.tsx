import Link from 'next/link';
import { signOut } from '@/lib/auth';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export default function DeniedPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#1F4E79] via-[#163a5c] to-[#0F2D47] relative">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 sm:p-10 border border-red-100 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 text-red-600 mb-6 ring-8 ring-red-50">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          ⛔ Access Denied
        </h1>
        <p className="text-base font-semibold text-red-600 mt-2">
          You are not a team member
        </p>

        <p className="text-sm text-slate-500 mt-4 leading-relaxed">
          The email address you signed in with is not on the authorized team list. Only the 4 registered team members can access TeamSync.
        </p>

        <div className="mt-6 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 text-left space-y-1">
          <div className="font-semibold text-slate-700">Authorized Team Members:</div>
          <div className="text-slate-500">• mehedi@gmail.com</div>
          <div className="text-slate-500">• omor@gmail.com</div>
          <div className="text-slate-500">• rayan@gmail.com</div>
          <div className="text-slate-500">• mahjabin@gmail.com</div>
        </div>

        <div className="mt-8 space-y-3">
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out / Switch Account</span>
            </button>
          </form>

          <Link
            href="/"
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Login</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

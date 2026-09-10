'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { DEFAULT_MEMBERS } from '@/lib/constants';
import { Calendar, Users, MessageSquare, Sparkles, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [showDemoSelector, setShowDemoSelector] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Sign-in error:', error);
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async (email: string) => {
    try {
      setDemoLoading(email);
      await signIn('demo-login', {
        email,
        callbackUrl: '/dashboard',
      });
    } catch (error) {
      console.error('Demo sign-in error:', error);
      setDemoLoading(null);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Main Glassmorphism Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20 transition-all">
        {/* App Wordmark & Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-navy-700 to-navy-500 text-white shadow-lg shadow-navy-700/30 mb-4 transform hover:scale-105 transition-transform">
            <Calendar className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
            TeamSync <span className="text-2xl">📅</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Your university team scheduling tool
          </p>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-3 gap-2 mb-8 text-center text-xs font-semibold text-navy-800">
          <div className="bg-navy-50/80 p-2.5 rounded-xl border border-navy-100 flex flex-col items-center gap-1">
            <Users className="w-4 h-4 text-navy-600" />
            <span>4 Members</span>
          </div>
          <div className="bg-navy-50/80 p-2.5 rounded-xl border border-navy-100 flex flex-col items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Best Slot</span>
          </div>
          <div className="bg-navy-50/80 p-2.5 rounded-xl border border-navy-100 flex flex-col items-center gap-1">
            <MessageSquare className="w-4 h-4 text-navy-600" />
            <span>Team Chat</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading || !!demoLoading}
          className="w-full h-13 py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-2xl border border-slate-300 shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed group relative overflow-hidden"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-navy-700" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              {/* Google official SVG logo */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-base text-slate-700 group-hover:text-slate-900 font-medium">
                Sign in with Google
              </span>
            </>
          )}
        </button>

        {/* Access info */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Restricted to authorized team members</span>
        </div>

        {/* Demo Fast Login Switcher (Ideal for local testing) */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowDemoSelector(!showDemoSelector)}
            className="w-full text-xs font-semibold text-navy-600 hover:text-navy-800 transition-colors flex items-center justify-center gap-1"
          >
            <span>{showDemoSelector ? '▲ Hide Quick Demo Switcher' : '▼ Test as Team Member (Fast Sign-in)'}</span>
          </button>

          {showDemoSelector && (
            <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-[11px] text-slate-500 text-center mb-2">
                Click any member to sign in directly (no Google setup needed for testing):
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_MEMBERS.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleDemoSignIn(member.email)}
                    disabled={isLoading || !!demoLoading}
                    className="p-2.5 bg-slate-50 hover:bg-navy-50 hover:border-navy-300 border border-slate-200 rounded-xl text-left transition-all flex items-center gap-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                  >
                    <div className="w-6 h-6 rounded-full bg-navy-700 text-white flex items-center justify-center text-[10px] font-bold">
                      {member.name[0]}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-900 truncate">{member.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{member.email}</div>
                    </div>
                    {demoLoading === member.email && (
                      <Loader2 className="w-3 h-3 animate-spin ml-auto text-navy-700" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

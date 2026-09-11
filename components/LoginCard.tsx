'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2, ArrowRight } from 'lucide-react';

export default function LoginCard() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Sign-in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full border-t-4 border-black pt-8">
      {/* Editorial Header */}
      <div className="mb-8">
        <span className="font-mono text-[10px] tracking-widest uppercase text-[#525252] block mb-2">
          AUTHENTICATION PORTAL
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-black">
          Member Sign In
        </h2>
        <p className="font-body text-sm text-[#525252] mt-2 leading-relaxed">
          Access is strictly restricted to registered university team members. Sign in with your verified Google account.
        </p>
      </div>

      {/* Feature Descriptors with Em-Dashes */}
      <div className="border-y border-black/20 py-4 mb-8">
        <p className="font-mono text-[11px] text-[#525252] uppercase tracking-wider text-center flex flex-wrap justify-center items-center gap-2">
          <span>4 Members</span>
          <span className="text-black/30">&mdash;</span>
          <span>Matrix Consensus</span>
          <span className="text-black/30">&mdash;</span>
          <span>Live Sync</span>
        </p>
      </div>

      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full py-4 px-6 bg-black text-white hover:bg-[#262626] active:bg-[#404040] font-mono text-xs uppercase tracking-widest transition-invert flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border border-black"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>CONNECTING...</span>
          </>
        ) : (
          <>
            {/* Monochrome Google SVG */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 12.8c-.85 1.5-2.5 2.5-4.64 2.5-2.98 0-5.4-2.42-5.4-5.4s2.42-5.4 5.4-5.4c1.38 0 2.63.53 3.58 1.39l-1.44 1.44c-.58-.55-1.32-.83-2.14-.83-1.88 0-3.4 1.52-3.4 3.4s1.52 3.4 3.4 3.4c1.68 0 2.78-1.02 3.02-2.16H12v-2h5.72c.07.38.1.75.1 1.15 0 2.05-.78 3.82-2.18 5.06z" />
            </svg>
            <span>SIGN IN WITH GOOGLE</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Access Restriction Notice */}
      <div className="mt-6 text-center">
        <p className="font-mono text-[10px] text-[#737373] uppercase tracking-wider">
          Restricted to authorized student accounts
        </p>
      </div>
    </div>
  );
}


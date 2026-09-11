'use client';

import { Check, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect, useRef } from 'react';
import { TOTAL_SLOTS } from '@/lib/constants';

interface ProgressCounterProps {
  filledCount: number;
  totalCount?: number;
  memberName?: string;
  isSelf?: boolean;
}

export default function ProgressCounter({
  filledCount,
  totalCount = TOTAL_SLOTS,
  memberName = 'Your',
  isSelf = true,
}: ProgressCounterProps) {
  const percentage = Math.round((filledCount / totalCount) * 100);
  const isComplete = filledCount >= totalCount;
  const prevFilled = useRef(filledCount);

  // Trigger monochrome celebratory confetti once when user completes all slots
  useEffect(() => {
    if (isComplete && prevFilled.current < totalCount && isSelf) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#000000', '#525252', '#ffffff'],
        });
      } catch (e) {}
    }
    prevFilled.current = filledCount;
  }, [filledCount, isComplete, totalCount, isSelf]);

  return (
    <div className="bg-white p-4 sm:p-5 border border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 flex items-center justify-center border border-black ${
            isComplete ? 'bg-black text-white' : 'bg-white text-black'
          }`}
        >
          {isComplete ? (
            <Check className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <CheckCircle2 className="w-5 h-5 stroke-[1.5]" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-bold text-black tracking-tight">
              {isSelf ? 'Your Schedule Progress' : `${memberName}'s Schedule`}
            </h3>
            {isComplete && (
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-black text-white border border-black">
                COMPLETE
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-[#525252] mt-0.5">
            <span className="font-bold text-black">{filledCount}</span> of{' '}
            <span className="text-black">{totalCount}</span> slots filled (
            {percentage}%)
          </p>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full sm:w-48 md:w-64 flex flex-col gap-1.5">
        <div className="w-full bg-[#F5F5F5] h-2.5 border border-black overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-300"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between font-mono text-[9px] text-[#737373] uppercase tracking-wider">
          <span>0 SLOTS</span>
          <span>{totalCount} SLOTS</span>
        </div>
      </div>
    </div>
  );
}


'use client';

import { CheckCircle2, Sparkles } from 'lucide-react';
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

  // Trigger celebratory confetti once when user completes 25/25 slots!
  useEffect(() => {
    if (isComplete && prevFilled.current < totalCount && isSelf) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1F4E79', '#10B981', '#F59E0B'],
        });
      } catch (e) {}
    }
    prevFilled.current = filledCount;
  }, [filledCount, isComplete, totalCount, isSelf]);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isComplete
              ? 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50'
              : 'bg-navy-50 text-navy-700'
          }`}
        >
          {isComplete ? (
            <Sparkles className="w-5 h-5 text-emerald-600 animate-bounce" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-navy-700" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              {isSelf ? 'Your Schedule Progress' : `${memberName}'s Schedule`}
            </h3>
            {isComplete && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Complete 🎉
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            <span className="font-extrabold text-navy-800">{filledCount}</span> of{' '}
            <span className="font-bold text-slate-700">{totalCount}</span> slots filled (
            {percentage}%)
          </p>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full sm:w-48 md:w-64 flex flex-col gap-1.5">
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-sm'
                : 'bg-gradient-to-r from-navy-700 to-navy-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 px-0.5">
          <span>0 slots</span>
          <span>{totalCount} slots</span>
        </div>
      </div>
    </div>
  );
}

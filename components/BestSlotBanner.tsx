'use client';

import { Trophy, Calendar, Sparkles, AlertCircle, Users } from 'lucide-react';
import { SlotScore } from '@/lib/types';

interface BestSlotBannerProps {
  bestSlots: SlotScore[];
  totalMembersCount?: number;
}

export default function BestSlotBanner({
  bestSlots,
  totalMembersCount = 4,
}: BestSlotBannerProps) {
  // Empty state: No scores or all scores are 0
  if (!bestSlots || bestSlots.length === 0 || bestSlots[0].score === 0) {
    return (
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-3xl p-6 sm:p-8 border-2 border-dashed border-slate-300 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          No availability data yet
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1">
          Ask your team members to fill in their schedules on the <strong>My Availability</strong> tab to automatically compute the best meeting slot!
        </p>
      </div>
    );
  }

  const maxPossibleScore = totalMembersCount * 2; // 8
  const isMultipleTied = bestSlots.length > 1;

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400/80 shadow-lg shadow-amber-500/10 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header Banner Title */}
      <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs sm:text-sm uppercase tracking-wider">
          <Trophy className="w-5 h-5 text-amber-600 animate-bounce" />
          <span>
            {isMultipleTied
              ? `🏆 ${bestSlots.length} TIED BEST MEETING SLOTS FOUND`
              : '🏆 BEST COMMON MEETING SLOT'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white font-black text-xs shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Top Match</span>
        </div>
      </div>

      {/* Slots list (single or stacked if multiple tied) */}
      <div className="space-y-4 relative z-10">
        {bestSlots.map((slot, index) => {
          const scorePercent = Math.round((slot.score / maxPossibleScore) * 100);

          return (
            <div
              key={`${slot.day}-${slot.time_slot}`}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-amber-300"
            >
              {/* Day & Slot Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {slot.day}
                  </span>
                  <span className="text-slate-400 font-bold text-lg">&middot;</span>
                  <span className="text-base sm:text-lg font-bold text-navy-800">
                    {slot.time_slot}
                  </span>
                </div>

                {/* Breakdown badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-bold">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C6EFCE] text-[#375623] border border-[#70AD47]">
                    ✅ {slot.breakdown.available} Available
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFEB9C] text-[#7D4E00] border border-[#FFAB00]">
                    ⚠️ {slot.breakdown.maybe} Maybe
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFC7CE] text-[#9C0006] border border-[#FF0000]">
                    ❌ {slot.breakdown.not_available} Not Available
                  </span>
                  {slot.breakdown.not_filled > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500">
                      ⏳ {slot.breakdown.not_filled} Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Overall Score Badge */}
              <div className="flex items-center md:flex-col items-end justify-between md:justify-center p-3 bg-amber-50/80 rounded-xl border border-amber-200/70 min-w-[140px]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Overall Score
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-amber-900 font-mono">
                    {slot.score}
                  </span>
                  <span className="text-xs font-bold text-amber-700">
                    / {maxPossibleScore}
                  </span>
                </div>
                <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                  {scorePercent}% Agreement
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

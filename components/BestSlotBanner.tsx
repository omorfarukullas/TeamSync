'use client';

import { Calendar, AlertCircle } from 'lucide-react';
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
      <div className="bg-white p-6 sm:p-8 border-2 border-dashed border-black text-center flex flex-col items-center justify-center">
        <div className="w-10 h-10 border border-black flex items-center justify-center mb-3 bg-[#F5F5F5]">
          <Calendar className="w-5 h-5 text-black" strokeWidth={1.5} />
        </div>
        <h3 className="font-serif text-lg font-bold text-black">
          No Consensus Data Yet
        </h3>
        <p className="font-body text-xs sm:text-sm text-[#525252] max-w-md mt-1">
          Have team members log availability on the <strong>My Availability</strong> tab to automatically compute optimal meeting windows.
        </p>
      </div>
    );
  }

  const maxPossibleScore = totalMembersCount * 2; // e.g. 8 for 4 members
  const isMultipleTied = bestSlots.length > 1;
  const hasPendingMembers = bestSlots.some((s) => s.breakdown.not_filled > 0);

  return (
    <div className="bg-black text-white p-6 sm:p-8 border-4 border-black relative overflow-hidden">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-horizontal-lines opacity-10 pointer-events-none" />

      {/* Header Banner Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10 border-b border-white/20 pb-4">
        <div>
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#A3A3A3] block mb-1">
            OPTIMAL CONSENSUS
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight uppercase text-white">
            {isMultipleTied
              ? `Top ${bestSlots.length} Recommended Meeting Slots`
              : 'Recommended Meeting Slot'}
          </h2>
        </div>

        <div className="self-start sm:self-auto">
          <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 bg-white text-black font-bold border border-white">
            TOP MATCH
          </span>
        </div>
      </div>

      {/* Notice if any members haven't submitted yet */}
      {hasPendingMembers && (
        <div className="mb-6 p-3 bg-white/10 border border-white/30 text-white text-xs font-mono flex items-center gap-2 relative z-10">
          <AlertCircle className="w-4 h-4 text-white shrink-0" />
          <span>
            Pending team submissions detected. Scores reflect current responses and recalculate in real time.
          </span>
        </div>
      )}

      {/* Slots list */}
      <div className="space-y-4 relative z-10">
        {bestSlots.map((slot) => {
          const denominator = slot.effectiveMaxScore > 0 ? slot.effectiveMaxScore : maxPossibleScore;
          const scorePercent = Math.round((slot.score / denominator) * 100);
          const submittedMembers = slot.effectiveMaxScore > 0 ? slot.effectiveMaxScore / 2 : 0;
          const isPartialSubmission = slot.breakdown.not_filled > 0;

          return (
            <div
              key={`${slot.day}-${slot.time_slot}`}
              className="bg-white text-black p-5 border-2 border-white flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Day & Slot Info */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-serif text-2xl font-bold text-black tracking-tight">
                    {slot.day}
                  </span>
                  <span className="text-[#A3A3A3]">&mdash;</span>
                  <span className="font-mono text-sm font-bold text-[#525252]">
                    {slot.time_slot}
                  </span>
                </div>

                {/* Breakdown badges with data-ink */}
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs font-bold">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#C6EFCE] text-[#375623] border border-[#70AD47]">
                    ✓ {slot.breakdown.available} Available
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFEB9C] text-[#7D4E00] border border-[#FFAB00]">
                    ? {slot.breakdown.maybe} Maybe
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFC7CE] text-[#9C0006] border border-[#FF0000]">
                    ✗ {slot.breakdown.not_available} Unavailable
                  </span>
                  {slot.breakdown.not_filled > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F5F5F5] text-black border border-black">
                      ⏳ {slot.breakdown.not_filled} Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Overall Score Badge */}
              <div className="flex items-center md:flex-col items-end justify-between md:justify-center p-3 bg-black text-white border border-black min-w-[150px]">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#A3A3A3]">
                  Consensus Score
                </span>
                <div className="flex items-baseline gap-1 mt-0.5 font-mono">
                  <span className="text-2xl font-black text-white">
                    {slot.score}
                  </span>
                  <span className="text-xs text-[#A3A3A3]">
                    / {denominator}
                  </span>
                  {isPartialSubmission && (
                    <span className="text-[10px] text-[#A3A3A3] ml-0.5">
                      ({submittedMembers}/{totalMembersCount})
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-white mt-0.5">
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


'use client';

import { DAYS, TIME_SLOTS, STATUS_CONFIG } from '@/lib/constants';
import { Member, SlotScore, AvailabilityStatus } from '@/lib/types';
import { Clock, Trophy, HelpCircle } from 'lucide-react';

interface TeamTableProps {
  members: Member[];
  slotScores: SlotScore[];
  bestScore: number;
}

export default function TeamTable({
  members,
  slotScores,
  bestScore,
}: TeamTableProps) {
  // Helper to find score record for a day/slot
  const getSlot = (day: string, timeSlot: string): SlotScore | undefined => {
    return slotScores.find((s) => s.day === day && s.time_slot === timeSlot);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 sm:p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Full Team Availability Comparison
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Compare all 4 schedules simultaneously to identify common free windows
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Highlighted = Best Meeting Slots</span>
          </span>
        </div>
      </div>

      {/* Main Comparison Table */}
      <div className="overflow-x-auto max-h-[75vh]">
        <table className="w-full min-w-[760px] text-left border-collapse">
          {/* Frozen Table Head */}
          <thead className="sticky top-0 z-30 bg-[#1F4E79] text-white shadow-sm">
            <tr>
              <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider w-36 border-r border-navy-800">
                Day
              </th>
              <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider w-44 border-r border-navy-800">
                Time Slot
              </th>
              {members.map((member) => (
                <th
                  key={member.id}
                  className="py-3.5 px-3 text-xs font-bold uppercase tracking-wider text-center border-r border-navy-800 min-w-[90px]"
                >
                  <div className="flex flex-col items-center">
                    <span className="truncate max-w-[80px]">{member.name}</span>
                    <span className="text-[10px] font-normal text-navy-200 lowercase">
                      {member.id}
                    </span>
                  </div>
                </th>
              ))}
              <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-center w-28">
                Score (0-8)
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-sm">
            {DAYS.map((day) => {
              return TIME_SLOTS.map((timeSlot, slotIndex) => {
                const slot = getSlot(day, timeSlot);
                const score = slot?.score ?? 0;
                const isBest = score > 0 && score === bestScore;

                return (
                  <tr
                    key={`${day}-${timeSlot}`}
                    className={`transition-all ${
                      isBest
                        ? 'bg-[#FEFCE8] hover:bg-[#FEF9C3] ring-1 ring-inset ring-amber-400 font-semibold'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Day Column (rowspan 5, navy background) */}
                    {slotIndex === 0 && (
                      <td
                        rowSpan={5}
                        className="py-4 px-4 bg-[#1F4E79] text-white font-extrabold text-base align-middle text-center border-r border-navy-800 border-b-2 border-b-white/20 select-none"
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span>{day}</span>
                          <span className="text-[10px] font-medium text-navy-200 uppercase tracking-widest bg-navy-900/60 px-2 py-0.5 rounded-full">
                            5 Slots
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Time Slot */}
                    <td
                      className={`py-3.5 px-4 font-semibold text-slate-800 border-r border-slate-200 whitespace-nowrap ${
                        isBest ? 'border-l-4 border-l-amber-500 pl-3' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{timeSlot}</span>
                      </div>
                    </td>

                    {/* 4 Members' columns */}
                    {members.map((member) => {
                      const memberData = slot?.members?.[member.id];
                      const status: AvailabilityStatus | undefined = memberData?.status;
                      const remarks = memberData?.remarks;

                      let cellBg = 'bg-[#F5F5F5] text-slate-400';
                      let emojiDisplay = '—';

                      if (status === 'available') {
                        cellBg = 'bg-[#C6EFCE] text-[#375623]';
                        emojiDisplay = '✅';
                      } else if (status === 'not_available') {
                        cellBg = 'bg-[#FFC7CE] text-[#9C0006]';
                        emojiDisplay = '❌';
                      } else if (status === 'maybe') {
                        cellBg = 'bg-[#FFEB9C] text-[#7D4E00]';
                        emojiDisplay = '⚠️';
                      }

                      return (
                        <td
                          key={member.id}
                          className={`py-2 px-2 text-center border-r border-slate-200 font-bold transition-colors ${cellBg}`}
                          title={remarks ? `${member.name}: ${remarks}` : `${member.name}: ${status || 'Not set'}`}
                        >
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className="text-base select-none">{emojiDisplay}</span>
                            {remarks && (
                              <span className="text-[10px] truncate max-w-[80px] font-medium opacity-80" title={remarks}>
                                💬 {remarks}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Score Column */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`text-sm font-black font-mono px-2 py-0.5 rounded-lg ${
                            isBest
                              ? 'bg-amber-500 text-white shadow-sm'
                              : score >= 6
                              ? 'bg-emerald-100 text-emerald-800'
                              : score >= 4
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {score}
                        </span>

                        {isBest && (
                          <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900 border border-amber-300">
                            🏆 Best
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 font-medium">
        <div>
          Hover over any status cell with 💬 to view member notes/remarks.
        </div>
        <div className="text-slate-400 font-semibold text-[11px]">
          Max score: 8 (4 members × 2 pts)
        </div>
      </div>
    </div>
  );
}

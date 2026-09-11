'use client';

import { useState } from 'react';
import { DAYS, TIME_SLOTS } from '@/lib/constants';
import { Member, SlotScore, AvailabilityStatus } from '@/lib/types';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface TeamTableProps {
  members: Member[];
  slotScores: SlotScore[];
  bestScore: number;
  currentUserImage?: string;
  currentMemberId?: string;
  onlineMemberIds?: Set<string>;
}

export default function TeamTable({
  members,
  slotScores,
  bestScore,
  currentUserImage,
  currentMemberId,
  onlineMemberIds,
}: TeamTableProps) {
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>(
    DAYS.reduce((acc, day) => ({ ...acc, [day]: true }), {})
  );

  const toggleDay = (day: string) => {
    setExpandedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const getSlot = (day: string, timeSlot: string): SlotScore | undefined => {
    return slotScores.find((s) => s.day === day && s.time_slot === timeSlot);
  };

  return (
    <div className="space-y-6">
      {/* Mobile Card-Based Team View (md:hidden) */}
      <div className="md:hidden space-y-4">
        {DAYS.map((day) => {
          const isExpanded = expandedDays[day] ?? true;

          const bestSlotsInDay = TIME_SLOTS.filter((slot) => {
            const s = getSlot(day, slot);
            return s && s.score > 0 && s.score === bestScore;
          }).length;

          return (
            <div
              key={day}
              className="bg-white border-2 border-black overflow-hidden"
            >
              {/* Day Accordion Header */}
              <button
                type="button"
                onClick={() => toggleDay(day)}
                className="w-full py-3.5 px-4 bg-black text-white flex items-center justify-between text-left border-b border-black"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-serif text-base font-bold uppercase tracking-wider">{day}</span>
                  {bestSlotsInDay > 0 && (
                    <span className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 bg-white text-black border border-white">
                      {bestSlotsInDay} OPTIMAL
                    </span>
                  )}
                </div>
                <div className="text-white">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Slot Cards List */}
              {isExpanded && (
                <div className="p-3 space-y-3 bg-[#FAFAFA]">
                  {TIME_SLOTS.map((timeSlot) => {
                    const slot = getSlot(day, timeSlot);
                    const score = slot?.score ?? 0;
                    const isBest = score > 0 && score === bestScore;
                    const slotMaxScore = slot?.maxScore ?? (members.length * 2);

                    return (
                      <div
                        key={`${day}-${timeSlot}`}
                        className={`p-3.5 border bg-white space-y-3 ${
                          isBest
                            ? 'border-2 border-black border-l-8 border-l-black font-semibold'
                            : 'border border-black'
                        }`}
                      >
                        {/* Header: Slot Time + Score Badge */}
                        <div className="flex items-center justify-between gap-2 border-b border-black/20 pb-2">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-black text-xs">
                            <Clock className="w-3.5 h-3.5 text-[#525252] shrink-0" />
                            <span>{timeSlot}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isBest && (
                              <span className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 bg-black text-white border border-black">
                                BEST SLOT
                              </span>
                            )}
                            <span className="font-mono text-xs font-bold text-black border border-black px-2 py-0.5 bg-[#F5F5F5]">
                              SCORE: {score}/{slotMaxScore}
                            </span>
                          </div>
                        </div>

                        {/* 4 Members Status: 2x2 Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          {members.map((member) => {
                            const memberData = slot?.members?.[member.id];
                            const status: AvailabilityStatus | undefined = memberData?.status;
                            const remarks = memberData?.remarks;

                            let cellBg = 'bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]';
                            let statusText = 'NOT SET';
                            let statusEmoji = '—';

                            if (status === 'available') {
                              cellBg = 'bg-[#C6EFCE] text-[#375623] border-[#70AD47]';
                              statusText = 'AVAILABLE';
                              statusEmoji = '✓';
                            } else if (status === 'not_available') {
                              cellBg = 'bg-[#FFC7CE] text-[#9C0006] border-[#FF0000]';
                              statusText = 'UNAVAILABLE';
                              statusEmoji = '✗';
                            } else if (status === 'maybe') {
                              cellBg = 'bg-[#FFEB9C] text-[#7D4E00] border-[#FFAB00]';
                              statusText = 'MAYBE';
                              statusEmoji = '?';
                            }

                            return (
                              <div
                                key={member.id}
                                className="p-2 border border-black bg-white flex flex-col justify-between gap-1"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="w-4 h-4 bg-black text-white flex items-center justify-center font-mono font-bold text-[9px] shrink-0 border border-black">
                                      {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-mono text-xs font-bold text-black truncate">
                                      {member.name}
                                    </span>
                                  </div>
                                  <span className="font-mono text-xs font-bold select-none shrink-0">{statusEmoji}</span>
                                </div>

                                <div className={`font-mono text-[9px] font-bold px-1.5 py-0.5 text-center border ${cellBg}`}>
                                  {statusText}
                                </div>

                                {remarks && (
                                  <div
                                    className="font-mono text-[10px] text-[#525252] truncate border-t border-black/10 pt-0.5"
                                    title={remarks}
                                  >
                                    Note: {remarks}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Quick Legend for Mobile */}
        <div className="p-3.5 bg-white border border-black font-mono text-xs text-black space-y-2">
          <span className="font-bold uppercase tracking-wider block">Status Legend & Scoring:</span>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <span className="px-2 py-1 bg-[#C6EFCE] text-[#375623] border border-[#70AD47] font-bold text-center">
              ✓ Avail (+2)
            </span>
            <span className="px-2 py-1 bg-[#FFEB9C] text-[#7D4E00] border border-[#FFAB00] font-bold text-center">
              ? Maybe (+1)
            </span>
            <span className="px-2 py-1 bg-[#FFC7CE] text-[#9C0006] border border-[#FF0000] font-bold text-center">
              ✗ Unavail (0)
            </span>
          </div>
        </div>
      </div>

      {/* Main Desktop Comparison Table (hidden on mobile, visible on md+) */}
      <div className="hidden md:block bg-white border-2 border-black overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#525252] block mb-1">
              COLLECTIVE MATRIX
            </span>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-black uppercase">
              Full Team Availability Comparison
            </h2>
            <p className="font-body text-xs text-[#525252] mt-0.5">
              Simultaneous 4-member alignment matrix for identifying collective consensus windows.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-black">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-black text-white border border-black font-bold uppercase tracking-wider">
              <span>■ Left Border = Recommended Slot</span>
            </span>
          </div>
        </div>

        {/* Main Comparison Table */}
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="w-full min-w-[760px] text-left border-collapse">
            {/* Frozen Table Head */}
            <thead className="sticky top-0 z-30 bg-black text-white">
              <tr>
                <th className="py-3.5 px-4 font-mono text-xs font-bold uppercase tracking-wider w-36 border-r border-white/20">
                  Day
                </th>
                <th className="py-3.5 px-4 font-mono text-xs font-bold uppercase tracking-wider w-44 border-r border-white/20">
                  Time Slot
                </th>
                {members.map((member) => {
                  const isSelf = member.id === currentMemberId;
                  const isOnline = isSelf || (onlineMemberIds ? onlineMemberIds.has(member.id) : false);
                  const avatarUrl = (isSelf && currentUserImage) ? currentUserImage : (member.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`);

                  return (
                    <th
                      key={member.id}
                      className="py-3 px-3 font-mono text-xs font-bold uppercase tracking-wider text-center border-r border-white/20 min-w-[110px]"
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        {/* Member Avatar Thumbnail with Sharp Square Dot */}
                        <div className="relative">
                          <img
                            src={avatarUrl}
                            alt={member.name}
                            className="w-7 h-7 object-cover border border-white bg-[#171717]"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.includes('dicebear')) {
                                target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`;
                              }
                            }}
                          />
                          <span
                            title={isOnline ? `${member.name} is Online` : `${member.name} is Offline`}
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border border-white ${
                              isOnline ? 'bg-white' : 'bg-[#737373]'
                            }`}
                          />
                        </div>

                        <span className="truncate max-w-[90px] leading-tight font-bold text-white">
                          {member.name}
                        </span>
                        <span className="text-[9px] font-normal text-[#A3A3A3] uppercase tracking-wider">
                          {isSelf ? '(YOU)' : member.id}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th className="py-3.5 px-4 font-mono text-xs font-bold uppercase tracking-wider text-center w-32">
                  Score (0-{members.length * 2})
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/20 text-sm">
              {DAYS.map((day) => {
                return TIME_SLOTS.map((timeSlot, slotIndex) => {
                  const slot = getSlot(day, timeSlot);
                  const score = slot?.score ?? 0;
                  const isBest = score > 0 && score === bestScore;

                  return (
                    <tr
                      key={`${day}-${timeSlot}`}
                      className={`transition-colors duration-100 ${
                        isBest
                          ? 'bg-white font-bold'
                          : 'hover:bg-[#F5F5F5]'
                      }`}
                    >
                      {/* Day Column (merged rowspan, black background) */}
                      {slotIndex === 0 && (
                        <td
                          rowSpan={TIME_SLOTS.length}
                          className="py-4 px-4 bg-black text-white font-serif font-bold text-base align-middle text-center border-r-2 border-black border-b-2 border-b-white/20 select-none uppercase tracking-wider"
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span>{day}</span>
                            <span className="font-mono text-[9px] uppercase tracking-widest bg-white text-black px-2 py-0.5 border border-white font-bold">
                              {TIME_SLOTS.length} SLOTS
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Time Slot */}
                      <td
                        className={`py-3 px-4 font-mono text-xs font-semibold text-black border-r border-black/20 whitespace-nowrap ${
                          isBest ? 'border-l-4 border-l-black pl-3 bg-[#FAFAFA]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#525252]" />
                          <span>{timeSlot}</span>
                        </div>
                      </td>

                      {/* 4 Members' columns with data-ink */}
                      {members.map((member) => {
                        const memberData = slot?.members?.[member.id];
                        const status: AvailabilityStatus | undefined = memberData?.status;
                        const remarks = memberData?.remarks;

                        let cellBg = 'bg-[#F5F5F5] text-[#737373]';
                        let emojiDisplay = '—';

                        if (status === 'available') {
                          cellBg = 'bg-[#C6EFCE] text-[#375623]';
                          emojiDisplay = '✓';
                        } else if (status === 'not_available') {
                          cellBg = 'bg-[#FFC7CE] text-[#9C0006]';
                          emojiDisplay = '✗';
                        } else if (status === 'maybe') {
                          cellBg = 'bg-[#FFEB9C] text-[#7D4E00]';
                          emojiDisplay = '?';
                        }

                        return (
                          <td
                            key={member.id}
                            className={`py-2 px-2 text-center border-r border-black/20 font-mono font-bold transition-colors ${cellBg}`}
                            title={remarks ? `${member.name}: ${remarks}` : `${member.name}: ${status || 'Not set'}`}
                          >
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <span className="text-sm select-none">{emojiDisplay}</span>
                              {remarks && (
                                <span className="font-mono text-[9px] truncate max-w-[85px] font-normal opacity-75" title={remarks}>
                                  💬 {remarks}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Score Column */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-mono">
                          <span
                            className={`text-sm font-bold px-2 py-0.5 border ${
                              isBest
                                ? 'bg-black text-white border-black'
                                : 'bg-[#F5F5F5] text-black border-black/30'
                            }`}
                          >
                            {score}
                          </span>

                          {isBest && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-black text-white border border-black">
                              BEST
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
        <div className="p-4 bg-white border-t-2 border-black font-mono text-xs text-[#525252] flex flex-wrap items-center justify-between gap-2">
          <div>
            Hover over any cell with 💬 to view submitted remarks.
          </div>
          <div className="text-black font-bold text-[11px] uppercase tracking-wider">
            Score denominator: 8 (4 members &times; 2 pts)
          </div>
        </div>
      </div>
    </div>
  );
}



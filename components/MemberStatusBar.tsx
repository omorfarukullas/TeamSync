'use client';

import { Member, AvailabilityRecord } from '@/lib/types';
import { countMemberFilledSlots, TOTAL_SLOTS } from '@/lib/constants';

interface MemberStatusBarProps {
  members: Member[];
  availability: AvailabilityRecord[];
  currentMemberId?: string;
  currentUserImage?: string;
  onlineMemberIds?: Set<string>;
}

export default function MemberStatusBar({
  members,
  availability,
  currentMemberId,
  currentUserImage,
  onlineMemberIds,
}: MemberStatusBarProps) {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
            Team Member Status
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Live schedule submission & online presence tracking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {members.map((member) => {
          const filledCount = countMemberFilledSlots(member.id, availability);
          const hasFilledAtLeastOne = filledCount > 0;
          const isComplete = filledCount >= TOTAL_SLOTS;
          const isSelf = member.id === currentMemberId;
          const isOnline = isSelf || (onlineMemberIds ? onlineMemberIds.has(member.id) : false);

          const initial = member.name.charAt(0).toUpperCase();
          const avatarUrl = (isSelf && currentUserImage) ? currentUserImage : (member.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`);

          return (
            <div
              key={member.id}
              className={`relative flex flex-col items-center p-3.5 sm:p-4 rounded-2xl border transition-all ${
                isSelf
                  ? 'bg-navy-50/70 border-navy-200 shadow-sm'
                  : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-50'
              }`}
            >
              {/* Self Badge */}
              {isSelf && (
                <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-navy-700 text-white shadow-xs">
                  You
                </span>
              )}

              {/* Avatar Circle with Online/Offline Status Dot */}
              <div className="relative mb-3 group cursor-default">
                <img
                  src={avatarUrl}
                  alt={member.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-3 ring-white shadow-md bg-slate-100"
                  onError={(e) => {
                    // Fallback to DiceBear if Google DP fails or initial
                    const target = e.currentTarget;
                    if (!target.src.includes('dicebear')) {
                      target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`;
                    }
                  }}
                />

                {/* 🟢 Online (Green) / ⚫ Offline (Grey) Indicator Dot */}
                <span
                  title={isOnline ? `${member.name} is Online` : `${member.name} is Offline`}
                  className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center transition-colors duration-300 ${
                    isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  {isOnline && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </span>
              </div>

              {/* Member Name */}
              <span className="font-bold text-slate-800 text-sm sm:text-base text-center truncate max-w-full">
                {member.name}
              </span>

              {/* Progress Count Pill / Hover Tooltip */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    isComplete
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : hasFilledAtLeastOne
                      ? 'bg-navy-100 text-navy-800 border border-navy-200'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {filledCount} / {TOTAL_SLOTS} slots
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

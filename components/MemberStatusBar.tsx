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
    <div className="bg-white p-5 sm:p-6 border border-black">
      <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-6">
        <div>
          <h2 className="font-serif text-base sm:text-lg font-bold uppercase tracking-wider text-black">
            Team Member Roster
          </h2>
          <p className="font-mono text-[10px] text-[#525252] uppercase tracking-widest mt-0.5">
            Real-time consensus & online telemetry
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {members.map((member) => {
          const filledCount = countMemberFilledSlots(member.id, availability);
          const isComplete = filledCount >= TOTAL_SLOTS;
          const isSelf = member.id === currentMemberId;
          const isOnline = isSelf || (onlineMemberIds ? onlineMemberIds.has(member.id) : false);

          const avatarUrl = (isSelf && currentUserImage) ? currentUserImage : (member.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`);

          return (
            <div
              key={member.id}
              className={`relative flex flex-col items-center p-4 border transition-invert group ${
                isSelf
                  ? 'border-2 border-black bg-white hover:bg-black'
                  : 'border border-black bg-white hover:bg-black'
              }`}
            >
              {/* Self Tag */}
              {isSelf && (
                <span className="absolute top-2 right-2 font-mono text-[9px] font-bold px-1 py-0.2 bg-black text-white group-hover:bg-white group-hover:text-black border border-black uppercase tracking-wider">
                  YOU
                </span>
              )}

              {/* Square Avatar with Sharp Online Indicator */}
              <div className="relative mb-3">
                <img
                  src={avatarUrl}
                  alt={member.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover border-2 border-black bg-[#F5F5F5]"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('dicebear')) {
                      target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`;
                    }
                  }}
                />

                {/* Sharp square online indicator */}
                <span
                  title={isOnline ? `${member.name} is Online` : `${member.name} is Offline`}
                  className={`absolute -bottom-1 -right-1 w-3 h-3 border border-white transition-colors ${
                    isOnline ? 'bg-black' : 'bg-[#A3A3A3]'
                  }`}
                />
              </div>

              {/* Member Name */}
              <span className="font-serif font-bold text-black group-hover:text-white text-sm sm:text-base text-center truncate max-w-full transition-colors">
                {member.name}
              </span>

              {/* Progress Count Badge */}
              <div className="mt-2">
                <span
                  className={`font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 border border-black transition-colors ${
                    isComplete
                      ? 'bg-black text-white group-hover:bg-white group-hover:text-black'
                      : 'bg-[#F5F5F5] text-black group-hover:bg-white group-hover:text-black'
                  }`}
                >
                  {filledCount} / {TOTAL_SLOTS} SLOTS
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


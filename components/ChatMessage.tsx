'use client';

import { ChatMessage as ChatMessageType, Member } from '@/lib/types';
import { Check } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  isSelf: boolean;
  senderMember?: Member;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  showDateHeader?: string | null;
}

const MEMBER_COLORS: Record<string, { text: string; badge: string }> = {
  mehedi: { text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  omor: { text: 'text-sky-700', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  rayan: { text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  mahjabin: { text: 'text-purple-700', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export default function ChatMessage({
  message,
  isSelf,
  senderMember,
  isFirstInGroup = true,
  isLastInGroup = true,
  showDateHeader,
}: ChatMessageProps) {
  const memberId = message.member_id?.toLowerCase();
  const memberName = message.members?.name || senderMember?.name || message.member_id;
  const avatarUrl = message.members?.avatar_url || senderMember?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${memberId}`;
  const initial = (memberName || 'U').charAt(0).toUpperCase();
  const memberStyle = MEMBER_COLORS[memberId] || { text: 'text-slate-800', badge: 'bg-slate-100 text-slate-700 border-slate-200' };

  // Format timestamp (e.g., 10:45 AM)
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full">
      {/* Optional Date Header Divider */}
      {showDateHeader && (
        <div className="flex items-center justify-center my-5 select-none">
          <div className="h-px bg-slate-200 flex-1 max-w-[80px] sm:max-w-xs" />
          <span className="px-3.5 py-1 mx-3 rounded-full text-[11px] font-bold bg-slate-200/70 text-slate-600 shadow-2xs border border-slate-300/60 uppercase tracking-wider">
            {showDateHeader}
          </span>
          <div className="h-px bg-slate-200 flex-1 max-w-[80px] sm:max-w-xs" />
        </div>
      )}

      {/* Message Row */}
      <div
        className={`flex items-end gap-2.5 animate-fade-in-up ${
          isFirstInGroup ? 'mt-3.5' : 'mt-1'
        } ${isLastInGroup ? 'mb-2' : 'mb-0.5'} ${
          isSelf ? 'justify-end flex-row-reverse' : 'justify-start'
        }`}
      >
        {/* Avatar Slot: only show image on the first message of a group */}
        <div className="flex-shrink-0 w-8 h-8">
          {isFirstInGroup ? (
            <img
              src={avatarUrl}
              alt={memberName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-xs bg-slate-100"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('dicebear')) {
                  target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${memberId}`;
                }
              }}
            />
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>

        {/* Message Bubble Column */}
        <div
          className={`flex flex-col max-w-[85%] sm:max-w-[72%] ${
            isSelf ? 'items-end' : 'items-start'
          }`}
        >
          {/* Sender Header: shown only on first message of a group */}
          {!isSelf && isFirstInGroup && (
            <div className="flex items-center gap-1.5 mb-1 ml-1 text-xs">
              <span className={`font-black ${memberStyle.text}`}>{memberName}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${memberStyle.badge}`}>
                {memberId}
              </span>
              <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                {formatTime(message.created_at)}
              </span>
            </div>
          )}

          {/* Bubble Container */}
          <div
            className={`px-4 py-2.5 text-sm leading-relaxed transition-all break-words shadow-2xs ${
              isSelf
                ? 'bg-gradient-to-tr from-navy-800 to-[#1F4E79] text-white rounded-2xl'
                : 'bg-white text-slate-800 border border-slate-200/90 rounded-2xl'
            } ${
              isSelf
                ? isFirstInGroup && !isLastInGroup
                  ? 'rounded-tr-xs rounded-br-md'
                  : !isFirstInGroup && isLastInGroup
                  ? 'rounded-tr-md rounded-br-xs'
                  : !isFirstInGroup && !isLastInGroup
                  ? 'rounded-r-md'
                  : 'rounded-tr-xs'
                : isFirstInGroup && !isLastInGroup
                ? 'rounded-tl-xs rounded-bl-md'
                : !isFirstInGroup && isLastInGroup
                ? 'rounded-tl-md rounded-bl-xs'
                : !isFirstInGroup && !isLastInGroup
                ? 'rounded-l-md'
                : 'rounded-tl-xs'
            }`}
          >
            <p className="whitespace-pre-wrap selection:bg-white/30">{message.content}</p>
          </div>

          {/* Bottom metadata (timestamp + checkmark for self) */}
          {isSelf && isLastInGroup && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-1 mr-1">
              <span>{formatTime(message.created_at)}</span>
              <span>&middot;</span>
              <span className="flex items-center gap-0.5 text-navy-700 font-semibold">
                <Check className="w-3 h-3 text-emerald-500 inline" /> You
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


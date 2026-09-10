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

const MEMBER_COLORS: Record<string, { text: string; badge: string; dot: string }> = {
  mehedi: {
    text: 'text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  omor: {
    text: 'text-sky-700',
    badge: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dot: 'bg-sky-500',
  },
  rayan: {
    text: 'text-amber-700',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  mahjabin: {
    text: 'text-purple-700',
    badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dot: 'bg-purple-500',
  },
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
  const avatarUrl =
    message.members?.avatar_url ||
    senderMember?.avatar_url ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${memberId}`;
  const memberStyle = MEMBER_COLORS[memberId] || {
    text: 'text-slate-800',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

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
      {/* Minimalist Centered Date Divider */}
      {showDateHeader && (
        <div className="flex items-center justify-center my-5 select-none">
          <div className="h-px bg-slate-200/80 flex-1 max-w-[60px] sm:max-w-[120px]" />
          <span className="px-3 py-1 mx-3 rounded-full text-[11px] font-semibold bg-slate-100/90 text-slate-500 border border-slate-200/60 shadow-2xs">
            {showDateHeader}
          </span>
          <div className="h-px bg-slate-200/80 flex-1 max-w-[60px] sm:max-w-[120px]" />
        </div>
      )}

      {/* Outgoing Message: Flush right, zero avatar phantom space */}
      {isSelf ? (
        <div
          className={`flex flex-col items-end ml-auto max-w-[85%] sm:max-w-[70%] animate-fade-in-up ${
            isFirstInGroup ? 'mt-3' : 'mt-0.5'
          } ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}
        >
          {/* Outgoing Bubble */}
          <div
            className={`px-4 py-2.5 text-sm leading-relaxed transition-all break-words shadow-2xs bg-gradient-to-tr from-navy-800 to-[#1F4E79] text-white ${
              isFirstInGroup && !isLastInGroup
                ? 'rounded-2xl rounded-tr-xs rounded-br-sm'
                : !isFirstInGroup && isLastInGroup
                ? 'rounded-2xl rounded-tr-sm rounded-br-xs'
                : !isFirstInGroup && !isLastInGroup
                ? 'rounded-2xl rounded-r-sm'
                : 'rounded-2xl rounded-tr-xs'
            }`}
          >
            <p className="whitespace-pre-wrap selection:bg-white/30">{message.content}</p>
          </div>

          {/* Timestamp & Delivery confirmation */}
          {isLastInGroup && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-1 mr-1">
              <span>{formatTime(message.created_at)}</span>
              <span>&middot;</span>
              <span className="inline-flex items-center gap-0.5 text-navy-700 font-semibold">
                <Check className="w-3 h-3 text-emerald-500 inline" /> You
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Incoming Message from Teammates */
        <div
          className={`flex items-end gap-2.5 max-w-[88%] sm:max-w-[75%] animate-fade-in-up ${
            isFirstInGroup ? 'mt-3.5' : 'mt-0.5'
          } ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}
        >
          {/* Teammate Avatar on First Message */}
          <div className="flex-shrink-0 w-8 h-8">
            {isFirstInGroup ? (
              <img
                src={avatarUrl}
                alt={memberName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-2xs bg-slate-100"
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

          {/* Teammate Content Column */}
          <div className="flex flex-col items-start min-w-0">
            {/* Author Header (first message only) */}
            {isFirstInGroup && (
              <div className="flex items-center gap-1.5 mb-1 ml-0.5 text-xs">
                <span className={`font-bold ${memberStyle.text}`}>{memberName}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md border ${memberStyle.badge}`}>
                  {memberId}
                </span>
                <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                  {formatTime(message.created_at)}
                </span>
              </div>
            )}

            {/* Teammate Bubble */}
            <div
              className={`px-4 py-2.5 text-sm leading-relaxed transition-all break-words shadow-2xs bg-white text-slate-800 border border-slate-200/85 ${
                isFirstInGroup && !isLastInGroup
                  ? 'rounded-2xl rounded-tl-xs rounded-bl-sm'
                  : !isFirstInGroup && isLastInGroup
                  ? 'rounded-2xl rounded-tl-sm rounded-bl-xs'
                  : !isFirstInGroup && !isLastInGroup
                  ? 'rounded-2xl rounded-l-sm'
                  : 'rounded-2xl rounded-tl-xs'
              }`}
            >
              <p className="whitespace-pre-wrap selection:bg-slate-100">{message.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


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

  // Format timestamp in mono font
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
      {/* Centered Date Divider */}
      {showDateHeader && (
        <div className="flex items-center justify-center my-6 select-none relative">
          <div className="h-px bg-black/20 w-full absolute inset-x-0" />
          <span className="relative z-10 px-3 py-1 bg-white border border-black font-mono text-[10px] font-bold text-black uppercase tracking-widest">
            {showDateHeader}
          </span>
        </div>
      )}

      {/* Outgoing Message: Self (Black Bubble, White Text) */}
      {isSelf ? (
        <div
          className={`flex flex-col items-end ml-auto max-w-[85%] sm:max-w-[70%] animate-fade-in ${
            isFirstInGroup ? 'mt-3' : 'mt-1'
          } ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}
        >
          {/* Outgoing Bubble */}
          <div className="px-4 py-2.5 text-sm font-body leading-relaxed break-words bg-black text-white border border-black">
            <p className="whitespace-pre-wrap selection:bg-white selection:text-black">{message.content}</p>
          </div>

          {/* Timestamp & Delivery confirmation */}
          {isLastInGroup && (
            <div className="flex items-center gap-1 font-mono text-[9px] text-[#525252] uppercase tracking-wider mt-1 mr-0.5">
              <span>{formatTime(message.created_at)}</span>
              <span>&middot;</span>
              <span className="inline-flex items-center gap-0.5 text-black font-bold">
                <Check className="w-3 h-3 text-black inline" /> YOU
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Incoming Message from Teammates (White Bubble, 1px Black Border) */
        <div
          className={`flex items-end gap-2.5 max-w-[88%] sm:max-w-[75%] animate-fade-in ${
            isFirstInGroup ? 'mt-3.5' : 'mt-1'
          } ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}
        >
          {/* Teammate Square Avatar on First Message */}
          <div className="flex-shrink-0 w-8 h-8">
            {isFirstInGroup ? (
              <img
                src={avatarUrl}
                alt={memberName}
                className="w-8 h-8 object-cover border border-black bg-[#F5F5F5]"
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
            {/* Author Header */}
            {isFirstInGroup && (
              <div className="flex items-center gap-2 mb-1 text-xs font-mono">
                <span className="font-bold text-black uppercase tracking-wider">{memberName}</span>
                <span className="text-[9px] text-[#525252] border border-black/30 px-1 uppercase tracking-widest">
                  {memberId}
                </span>
                <span className="text-[9px] text-[#737373]">
                  {formatTime(message.created_at)}
                </span>
              </div>
            )}

            {/* Teammate Bubble */}
            <div className="px-4 py-2.5 text-sm font-body leading-relaxed break-words bg-white text-black border border-black">
              <p className="whitespace-pre-wrap selection:bg-black selection:text-white">{message.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



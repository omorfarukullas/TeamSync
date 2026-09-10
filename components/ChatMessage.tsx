'use client';

import { ChatMessage as ChatMessageType, Member } from '@/lib/types';
import { MessageSquare } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  isSelf: boolean;
  senderMember?: Member;
}

export default function ChatMessage({
  message,
  isSelf,
  senderMember,
}: ChatMessageProps) {
  const memberName = message.members?.name || senderMember?.name || message.member_id;
  const avatarUrl = message.members?.avatar_url || senderMember?.avatar_url;
  const initial = (memberName || 'U').charAt(0).toUpperCase();

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
    <div
      className={`flex items-end gap-2.5 my-3.5 ${
        isSelf ? 'justify-end flex-row-reverse' : 'justify-start'
      }`}
    >
      {/* Avatar (for team members or self) */}
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={memberName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-xs"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs ${
              isSelf ? 'bg-navy-800' : 'bg-slate-600'
            }`}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Message Bubble + Sender Name */}
      <div
        className={`flex flex-col max-w-[82%] sm:max-w-[70%] ${
          isSelf ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender Name & Time above bubble (for others) */}
        {!isSelf && (
          <div className="flex items-center gap-1.5 mb-1 ml-1 text-xs text-slate-500 font-semibold">
            <span className="text-slate-800 font-bold">{memberName}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {formatTime(message.created_at)}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs transition-all break-words ${
            isSelf
              ? 'bg-[#1F4E79] text-white rounded-br-xs'
              : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp for self (bottom right) */}
        {isSelf && (
          <span className="text-[10px] text-slate-400 font-medium mt-1 mr-1">
            {formatTime(message.created_at)} &middot; You
          </span>
        )}
      </div>
    </div>
  );
}

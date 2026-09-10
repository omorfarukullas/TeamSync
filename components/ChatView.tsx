'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage as ChatMessageType, Member } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { usePresence } from '@/hooks/usePresence';
import ChatMessage from './ChatMessage';
import {
  Send,
  MessageSquare,
  Sparkles,
  RefreshCw,
  ArrowDown,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatViewProps {
  initialMessages: ChatMessageType[];
  currentMemberId: string;
  currentMemberName: string;
  members: Member[];
}

const QUICK_SUGGESTIONS = [
  '📅 Updated my availability!',
  '🕒 How about 11:11 AM?',
  '✅ That time works for me!',
  '👍 Sounds good to me',
  '❓ Can everyone check Saturday?',
];

function getDateHeader(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return msgDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function isSameDay(date1?: string, date2?: string): boolean {
  if (!date1 || !date2) return false;
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  } catch {
    return false;
  }
}

function isSameGroup(msg1?: ChatMessageType, msg2?: ChatMessageType): boolean {
  if (!msg1 || !msg2) return false;
  if (msg1.member_id?.toLowerCase() !== msg2.member_id?.toLowerCase()) return false;
  if (!isSameDay(msg1.created_at, msg2.created_at)) return false;
  try {
    const t1 = new Date(msg1.created_at).getTime();
    const t2 = new Date(msg2.created_at).getTime();
    return Math.abs(t2 - t1) <= 2 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function ChatView({
  initialMessages,
  currentMemberId,
  currentMemberName,
  members,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { onlineMemberIds, isOnline } = usePresence();

  // Auto scroll to latest message
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  useEffect(() => {
    // Only auto-scroll down if user is near bottom
    if (!showScrollBottom) {
      scrollToBottom('smooth');
    }
  }, [messages, showScrollBottom]);

  // Handle scroll detection for "jump to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isFarUp = scrollHeight - scrollTop - clientHeight > 160;
    setShowScrollBottom(isFarUp);
  };

  // Refresh messages from server
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMessages(json.data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, []);

  // Supabase Realtime Subscription for messages table
  useEffect(() => {
    const supabaseClient = getSupabaseBrowserClient();
    if (!supabaseClient) {
      // Gentle polling fallback
      const pollInterval = setInterval(() => {
        fetchMessages();
      }, 5000);
      return () => clearInterval(pollInterval);
    }

    const channelId = `chat-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabaseClient
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as ChatMessageType;
          // Find sender member
          const sender = members.find((m) => m.id === newMsg.member_id);
          const fullMsg: ChatMessageType = {
            ...newMsg,
            members: sender
              ? {
                  id: sender.id,
                  name: sender.name,
                  email: sender.email,
                  avatar_url: sender.avatar_url,
                }
              : null,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, fullMsg];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLive(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsLive(false);
        }
      });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [fetchMessages, members]);

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessageType = {
      id: tempId,
      member_id: currentMemberId,
      content: trimmed,
      created_at: new Date().toISOString(),
      members: {
        id: currentMemberId,
        name: currentMemberName,
        email: '',
        avatar_url: members.find((m) => m.id === currentMemberId)?.avatar_url,
      },
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setShowScrollBottom(false);
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to send message');
      }

      // Replace optimistic message with actual data
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? json.data : m))
      );
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast.error('Could not send message. Please try again.');
      // Revert optimistic
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(trimmed);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-160px)] sm:h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex items-center justify-between gap-3">
        {/* Left: Room Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1F4E79] to-navy-700 text-white flex items-center justify-center shadow-md shadow-navy-700/15 flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                Team Chatroom
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy-50 text-navy-700 border border-navy-100">
                <Users className="w-3 h-3" />
                {members.length} members
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              Coordinate schedules & sync meetings
            </p>
          </div>
        </div>

        {/* Right: Presence Avatars + Live Badge */}
        <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0">
          {/* Member Presence Stack */}
          <div className="flex items-center -space-x-2 sm:-space-x-1.5 hover:space-x-1 transition-all duration-200">
            {members.map((member) => {
              const online = isOnline(member.id);
              const avatar = member.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`;
              return (
                <div
                  key={member.id}
                  className="relative group/avatar cursor-pointer"
                  title={`${member.name} (${online ? 'Active now' : 'Offline'})`}
                >
                  <img
                    src={avatar}
                    alt={member.name}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-white shadow-2xs transition-transform duration-150 group-hover/avatar:scale-110 ${
                      online ? 'ring-emerald-400' : 'opacity-80'
                    }`}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('dicebear')) {
                        target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`;
                      }
                    }}
                  />
                  {/* Status Pip */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                      online ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Live indicator badge */}
          <span
            className={`hidden xs:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
              isLive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="hidden sm:inline">{isLive ? 'Realtime Live' : 'Connecting'}</span>
          </span>

          {/* Manual Refresh */}
          <button
            onClick={fetchMessages}
            title="Refresh messages"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 bg-slate-50/50"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy-600 flex items-center justify-center mb-3 shadow-inner">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">No messages yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
              Start the discussion! Send a note or coordinate a meeting slot with your team.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isSelf = message.member_id?.toLowerCase() === currentMemberId?.toLowerCase();
            const senderMember = members.find(
              (m) => m.id.toLowerCase() === message.member_id?.toLowerCase()
            );

            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];

            // Date separator calculation
            const showDateHeader =
              !prevMsg || !isSameDay(prevMsg.created_at, message.created_at)
                ? getDateHeader(message.created_at)
                : null;

            // Grouping calculations
            const isFirstInGroup = !prevMsg || !isSameGroup(prevMsg, message);
            const isLastInGroup = !nextMsg || !isSameGroup(message, nextMsg);

            return (
              <ChatMessage
                key={message.id}
                message={message}
                isSelf={isSelf}
                senderMember={senderMember}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
                showDateHeader={showDateHeader}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => {
            scrollToBottom('smooth');
            setShowScrollBottom(false);
          }}
          className="absolute bottom-32 sm:bottom-28 right-5 px-3 py-1.5 rounded-full bg-[#1F4E79] hover:bg-navy-800 active:scale-95 text-white text-xs font-bold shadow-lg border border-white/20 transition-all duration-200 flex items-center gap-1.5 z-20 animate-fade-in-up"
        >
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          <span>Latest</span>
        </button>
      )}

      {/* Quick Scheduling Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 px-3 sm:px-5 bg-slate-100/60 border-t border-slate-200/80">
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Quick:
        </span>
        {QUICK_SUGGESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInputText(suggestion);
              inputRef.current?.focus();
            }}
            className="text-xs px-2.5 py-1 rounded-full bg-white hover:bg-navy-50 hover:text-navy-700 hover:border-navy-200 border border-slate-200 text-slate-600 transition-all duration-150 whitespace-nowrap shadow-2xs active:scale-95 flex-shrink-0"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Message Input Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-navy-600 focus-within:ring-2 focus-within:ring-navy-600/20 focus-within:bg-white transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              placeholder="Type a message to the team (Press Enter to send)..."
              className="w-full py-2.5 px-3.5 bg-transparent resize-none outline-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 max-h-28 overflow-y-auto"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-[#1F4E79] hover:bg-[#163a5c] active:scale-95 text-white font-bold rounded-2xl shadow-sm hover:shadow-md transition-all duration-150 ease-out disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 flex-shrink-0 h-[42px]"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Send</span>
          </button>
        </form>

        {/* Input Bar Hint & Character Count */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mt-1.5">
          <span className="hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px]">Shift + Enter</kbd> for newline
          </span>
          <span className="sm:hidden text-slate-400">Tap Send to share</span>
          {inputText.length > 0 && (
            <span
              className={`text-[10px] font-mono ml-auto ${
                inputText.length > 450 ? 'text-rose-500 font-bold' : 'text-slate-400'
              }`}
            >
              {inputText.length} / 500
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


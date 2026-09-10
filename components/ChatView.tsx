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
  ChevronDown,
  X,
  Hash,
  CheckCircle2,
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
  const [showTeamPopover, setShowTeamPopover] = useState(false);
  const [showQuickDrawer, setShowQuickDrawer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const teamPopoverRef = useRef<HTMLDivElement>(null);

  const { onlineMemberIds, isOnline } = usePresence();

  // Close team popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        teamPopoverRef.current &&
        !teamPopoverRef.current.contains(event.target as Node)
      ) {
        setShowTeamPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto scroll to latest message
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  useEffect(() => {
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
      setIsRefreshing(true);
      const res = await fetch('/api/chat');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMessages(json.data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  // Supabase Realtime Subscription for messages table
  useEffect(() => {
    const supabaseClient = getSupabaseBrowserClient();
    if (!supabaseClient) {
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

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? json.data : m))
      );
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast.error('Could not send message. Please try again.');
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

  const handleSelectQuickPrompt = (promptText: string) => {
    setInputText(promptText);
    setShowQuickDrawer(false);
    inputRef.current?.focus();
  };

  const onlineCount = members.filter((m) => isOnline(m.id)).length;

  return (
    <div className="relative flex flex-col h-[calc(100vh-140px)] min-h-[520px] max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* ─── 1. TOPBAR / HEADER ──────────────────────────────────── */}
      <header className="px-4 sm:px-6 py-3 border-b border-slate-200/90 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 z-20">
        {/* Left: Channel Information */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
            <Hash className="w-4 h-4 text-slate-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
                team-coordination
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                &middot; 4 members
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              Synchronize schedules & group meetings in real-time
            </p>
          </div>
        </div>

        {/* Right: Team Presence Pill + Popover & Refresh */}
        <div className="flex items-center gap-2 flex-shrink-0 relative" ref={teamPopoverRef}>
          {/* Interactive Presence Button */}
          <button
            type="button"
            onClick={() => setShowTeamPopover((prev) => !prev)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${
              showTeamPopover
                ? 'bg-slate-100 border-slate-300 text-slate-800 ring-2 ring-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
            }`}
            title="View team member online status"
          >
            {/* Overlapping mini avatars */}
            <div className="flex items-center -space-x-1.5">
              {members.slice(0, 3).map((m) => (
                <img
                  key={m.id}
                  src={m.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.id}`}
                  alt={m.name}
                  className="w-5 h-5 rounded-full object-cover ring-1.5 ring-white bg-slate-100"
                />
              ))}
            </div>

            <span className="flex items-center gap-1 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onlineCount}/4 Online</span>
            </span>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                showTeamPopover ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Presence Dropdown Popover */}
          {showTeamPopover && (
            <div className="absolute right-0 top-11 w-64 p-3 bg-white rounded-2xl shadow-xl border border-slate-200/90 animate-scale-in z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Team Presence</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  {onlineCount} Active
                </span>
              </div>
              <div className="space-y-1.5">
                {members.map((m) => {
                  const online = isOnline(m.id);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={m.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.id}`}
                            alt={m.name}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 bg-slate-100"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white ${
                              online ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{m.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{m.id}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          online
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-slate-400 bg-slate-100'
                        }`}
                      >
                        {online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Refresh Action */}
          <button
            onClick={fetchMessages}
            title="Refresh chat history"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            <RefreshCw
              className={`w-4 h-4 transition-transform duration-500 ${
                isRefreshing ? 'rotate-180 text-navy-700' : ''
              }`}
            />
          </button>
        </div>
      </header>

      {/* ─── 2. MESSAGE STREAM AREA ──────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-slate-50/60 overscroll-contain"
      >
        {messages.length === 0 ? (
          /* Empty State: Welcoming Card with Starter Quick Replies */
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1F4E79] to-navy-700 text-white flex items-center justify-center mb-3 shadow-md shadow-navy-700/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-base">
              Welcome to Team Coordination
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
              Start coordinating meetings with Mehedi, Omor, Rayan, and Mahjabin. Tap a quick prompt below to begin:
            </p>

            <div className="w-full space-y-2">
              {QUICK_SUGGESTIONS.slice(0, 4).map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectQuickPrompt(suggestion)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white hover:bg-navy-50/70 border border-slate-200/90 text-xs font-semibold text-slate-700 hover:text-navy-900 shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] flex items-center justify-between group"
                >
                  <span className="truncate">{suggestion}</span>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-navy-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Use &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isSelf = message.member_id?.toLowerCase() === currentMemberId?.toLowerCase();
            const senderMember = members.find(
              (m) => m.id.toLowerCase() === message.member_id?.toLowerCase()
            );

            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];

            const showDateHeader =
              !prevMsg || !isSameDay(prevMsg.created_at, message.created_at)
                ? getDateHeader(message.created_at)
                : null;

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
          className="absolute bottom-28 right-6 px-3.5 py-1.5 rounded-full bg-[#1F4E79] hover:bg-navy-800 active:scale-95 text-white text-xs font-bold shadow-lg border border-white/25 transition-all duration-200 flex items-center gap-1.5 z-30 animate-fade-in-up"
        >
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          <span>Latest</span>
        </button>
      )}

      {/* ─── 3. MODERN UNIFIED COMPOSER ──────────────────────────── */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 z-10">
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200 focus-within:border-navy-600 focus-within:ring-2 focus-within:ring-navy-600/15 focus-within:bg-white transition-all overflow-hidden shadow-2xs">
          {/* Optional Expandable Quick Suggestions Drawer */}
          {showQuickDrawer && (
            <div className="px-3 pt-2.5 pb-1 border-b border-slate-200/70 bg-slate-100/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar animate-fade-in-up">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 flex-shrink-0 mr-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Suggestions:
              </span>
              {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectQuickPrompt(suggestion)}
                  className="text-xs px-2.5 py-1 rounded-full bg-white hover:bg-navy-50 hover:text-navy-700 hover:border-navy-200 border border-slate-200 text-slate-600 transition-all whitespace-nowrap shadow-2xs active:scale-95 flex-shrink-0"
                >
                  {suggestion}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowQuickDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/70 ml-auto flex-shrink-0"
                title="Close suggestions"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Text Input Area */}
          <form onSubmit={handleSendMessage} className="p-2 sm:p-2.5">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              placeholder="Message #team-coordination..."
              className="w-full py-1.5 px-2 bg-transparent resize-none outline-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 min-h-[38px] max-h-28 overflow-y-auto"
            />

            {/* Composer Toolbar (Bottom Row) */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-1">
              {/* Left: Quick Replies launcher & keyboard hint */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickDrawer((prev) => !prev)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    showQuickDrawer
                      ? 'bg-amber-100/70 text-amber-800 border border-amber-300/80'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                  }`}
                  title="Toggle Quick Scheduling Replies"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-bold">Quick Replies</span>
                </button>

                <span className="hidden sm:inline text-[11px] text-slate-400">
                  &middot; <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[9px]">Enter</kbd> to send
                </span>
              </div>

              {/* Right: Character count & Send button */}
              <div className="flex items-center gap-2">
                {inputText.length > 0 && (
                  <span
                    className={`text-[10px] font-mono ${
                      inputText.length > 450 ? 'text-rose-500 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {inputText.length}/500
                  </span>
                )}

                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="px-3.5 py-1.5 bg-[#1F4E79] hover:bg-[#163a5c] active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-xs h-[34px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage as ChatMessageType, Member } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { usePresence } from '@/hooks/usePresence';
import ChatMessage from './ChatMessage';
import {
  Send,
  MessageSquare,
  RefreshCw,
  ArrowDown,
  ChevronDown,
  X,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatViewProps {
  initialMessages: ChatMessageType[];
  currentMemberId: string;
  currentMemberName: string;
  members: Member[];
}

const QUICK_SUGGESTIONS = [
  'Updated my availability matrix.',
  'How about 11:11 AM slot?',
  'That time window works.',
  'Agreed, confirmed for meeting.',
  'Can everyone review Saturday?',
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
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showTeamPopover, setShowTeamPopover] = useState(false);
  const [showQuickDrawer, setShowQuickDrawer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const teamPopoverRef = useRef<HTMLDivElement>(null);

  const { isOnline } = usePresence();

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
      .subscribe();

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
    <div className="relative flex flex-col h-[calc(100vh-140px)] min-h-[520px] max-w-4xl mx-auto bg-white border-2 border-black overflow-hidden">
      {/* ─── 1. TOPBAR / HEADER ──────────────────────────────────── */}
      <header className="px-4 sm:px-6 py-3 border-b-2 border-black bg-white flex items-center justify-between gap-3 z-20">
        {/* Left: Channel Information */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-mono font-bold text-sm flex-shrink-0 border border-black">
            <Hash className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base font-bold text-black uppercase tracking-wider truncate">
                Team Coordination
              </h2>
              <span className="hidden sm:inline-block font-mono text-[10px] uppercase text-[#525252]">
                &middot; 4 Operators
              </span>
            </div>
            <p className="font-mono text-[10px] text-[#737373] uppercase tracking-widest truncate">
              Deterministic Meeting Alignment Stream
            </p>
          </div>
        </div>

        {/* Right: Team Presence Pill + Popover & Refresh */}
        <div className="flex items-center gap-2 flex-shrink-0 relative" ref={teamPopoverRef}>
          {/* Interactive Presence Button */}
          <button
            type="button"
            onClick={() => setShowTeamPopover((prev) => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 border border-black font-mono text-xs uppercase tracking-wider bg-white hover:bg-[#F5F5F5] transition-invert"
            title="View team member online status"
          >
            {/* Square mini avatars */}
            <div className="flex items-center -space-x-1">
              {members.slice(0, 3).map((m) => (
                <img
                  key={m.id}
                  src={m.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.id}`}
                  alt={m.name}
                  className="w-4 h-4 object-cover border border-black bg-[#F5F5F5]"
                />
              ))}
            </div>

            <span className="text-[10px] font-bold">
              {onlineCount}/4 ONLINE
            </span>

            <ChevronDown
              className={`w-3 h-3 text-black transition-transform duration-150 ${
                showTeamPopover ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Presence Dropdown Popover */}
          {showTeamPopover && (
            <div className="absolute right-0 top-10 w-64 p-3 bg-white border-2 border-black z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-black">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">Roster Telemetry</span>
                <span className="font-mono text-[9px] font-bold text-black border border-black px-1.5 py-0.2 bg-[#F5F5F5]">
                  {onlineCount} ACTIVE
                </span>
              </div>
              <div className="space-y-1.5 font-mono">
                {members.map((m) => {
                  const online = isOnline(m.id);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-1.5 hover:bg-[#F5F5F5] transition-colors border border-transparent hover:border-black/20"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={m.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.id}`}
                            alt={m.name}
                            className="w-6 h-6 object-cover border border-black bg-[#F5F5F5]"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border border-white ${
                              online ? 'bg-black' : 'bg-[#A3A3A3]'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-black truncate">{m.name}</p>
                          <p className="text-[9px] text-[#737373] uppercase truncate">{m.id}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.2 border ${
                          online
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-[#737373] border-black/30'
                        }`}
                      >
                        {online ? 'ONLINE' : 'OFFLINE'}
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
            className="p-1.5 border border-black text-black hover:bg-black hover:text-white transition-invert"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            />
          </button>
        </div>
      </header>

      {/* ─── 2. MESSAGE STREAM AREA ──────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-[#FAFAFA] overscroll-contain"
      >
        {messages.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 max-w-md mx-auto">
            <div className="w-10 h-10 border border-black bg-black text-white flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-black uppercase tracking-tight">
              Team Channel Initialized
            </h3>
            <p className="font-body text-xs text-[#525252] mt-1 mb-6 leading-relaxed">
              Live discussion channel for Mehedi, Omor, Rayan, and Mahjabin. Select a quick starter message or type below:
            </p>

            <div className="w-full space-y-2 font-mono">
              {QUICK_SUGGESTIONS.slice(0, 4).map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectQuickPrompt(suggestion)}
                  className="w-full text-left px-3 py-2 bg-white hover:bg-black hover:text-white border border-black text-xs transition-invert flex items-center justify-between group"
                >
                  <span className="truncate">{suggestion}</span>
                  <span className="text-[10px] uppercase font-bold text-[#737373] group-hover:text-white">
                    SELECT &rarr;
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
          className="absolute bottom-24 right-6 px-3 py-1.5 bg-black hover:bg-[#262626] text-white text-xs font-mono uppercase tracking-wider border border-white transition-invert flex items-center gap-1.5 z-30 animate-fade-in"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>LATEST</span>
        </button>
      )}

      {/* ─── 3. MODERN UNIFIED COMPOSER ──────────────────────────── */}
      <div className="p-3 sm:p-4 bg-white border-t-2 border-black z-10">
        <div className="border border-black bg-white">
          {/* Optional Expandable Quick Suggestions Drawer */}
          {showQuickDrawer && (
            <div className="px-3 py-2 border-b border-black bg-[#F5F5F5] flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-xs">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#525252] flex-shrink-0 mr-1">
                PROMPTS:
              </span>
              {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectQuickPrompt(suggestion)}
                  className="px-2 py-1 bg-white hover:bg-black hover:text-white border border-black text-xs transition-invert whitespace-nowrap flex-shrink-0"
                >
                  {suggestion}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowQuickDrawer(false)}
                className="p-1 border border-black hover:bg-black hover:text-white ml-auto flex-shrink-0 transition-invert"
                title="Close suggestions"
              >
                <X className="w-3 h-3" />
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
              placeholder="Broadcast message to team..."
              className="w-full py-1 px-1 bg-transparent resize-none outline-none font-body text-xs sm:text-sm text-black placeholder:text-[#A3A3A3] min-h-[38px] max-h-28 overflow-y-auto"
            />

            {/* Composer Toolbar (Bottom Row) */}
            <div className="flex items-center justify-between pt-2 border-t border-black/20 mt-1 font-mono">
              {/* Left: Quick Replies launcher */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickDrawer((prev) => !prev)}
                  className="px-2 py-1 border border-black text-xs uppercase tracking-wider text-black hover:bg-black hover:text-white transition-invert flex items-center gap-1"
                  title="Toggle Quick Scheduling Replies"
                >
                  <span className="text-[10px] font-bold">QUICK PROMPTS</span>
                </button>

                <span className="hidden sm:inline text-[10px] text-[#737373] uppercase tracking-wider">
                  &middot; [ENTER] TO SEND
                </span>
              </div>

              {/* Right: Character count & Send button */}
              <div className="flex items-center gap-2">
                {inputText.length > 0 && (
                  <span className="text-[10px] font-mono text-[#737373]">
                    {inputText.length}/500
                  </span>
                )}

                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="px-4 py-1.5 bg-black hover:bg-[#262626] text-white font-mono text-xs uppercase tracking-widest transition-invert disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 border border-black"
                >
                  <Send className="w-3 h-3" />
                  <span>TRANSMIT</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}



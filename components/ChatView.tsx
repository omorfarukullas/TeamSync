'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage as ChatMessageType, Member } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import ChatMessage from './ChatMessage';
import { Send, MessageSquare, Sparkles, RefreshCw, Smile } from 'lucide-react';
import { toast } from 'sonner';

interface ChatViewProps {
  initialMessages: ChatMessageType[];
  currentMemberId: string;
  currentMemberName: string;
  members: Member[];
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to latest message
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

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
          console.log('New message received:', payload);
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
    <div className="flex flex-col h-[calc(100vh-160px)] sm:h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="px-5 py-3.5 sm:py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-navy-700 text-white flex items-center justify-center shadow-md shadow-navy-700/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              Team Chatroom
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              4 members &middot; Coordinate schedules & project meetings
            </p>
          </div>
        </div>

        {/* Live indicator & refresh */}
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isLive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{isLive ? 'Live Chat' : 'Connected'}</span>
          </span>

          <button
            onClick={fetchMessages}
            title="Refresh chat"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 space-y-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy-600 flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">No messages yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Start the discussion! Send a note to Mehedi, Omor, Rayan, and Mahjabin.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isSelf = message.member_id === currentMemberId;
            const senderMember = members.find((m) => m.id === message.member_id);

            return (
              <ChatMessage
                key={message.id}
                message={message}
                isSelf={isSelf}
                senderMember={senderMember}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-navy-600 focus-within:ring-2 focus-within:ring-navy-600/20 transition-all">
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

            {/* Character counter (when approaching limit) */}
            {inputText.length > 350 && (
              <div className="absolute right-3 bottom-1.5 text-[10px] font-bold text-slate-400">
                {inputText.length}/500
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-3 sm:px-4 bg-[#1F4E79] hover:bg-[#163a5c] text-white font-bold rounded-2xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

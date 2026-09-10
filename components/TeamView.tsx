'use client';

import { useState, useEffect, useCallback } from 'react';
import { Member, AvailabilityRecord } from '@/lib/types';
import { computeAllSlotScores, findBestSlots } from '@/lib/constants';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { usePresence } from '@/hooks/usePresence';
import MemberStatusBar from './MemberStatusBar';
import BestSlotBanner from './BestSlotBanner';
import TeamTable from './TeamTable';
import { Radio, RefreshCw, Sparkles, Wifi } from 'lucide-react';
import { toast } from 'sonner';

interface TeamViewProps {
  initialMembers: Member[];
  initialAvailability: AvailabilityRecord[];
  currentMemberId?: string;
}

export default function TeamView({
  initialMembers,
  initialAvailability,
  currentMemberId,
}: TeamViewProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [availability, setAvailability] = useState<AvailabilityRecord[]>(initialAvailability);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const { onlineMemberIds } = usePresence();

  // Fetch latest availability from API
  const refreshData = useCallback(async (showToast = false) => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/availability');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAvailability(json.data);
        setLastUpdated(new Date());
        if (showToast) {
          toast.success('Team availability updated!');
        }
      }
    } catch (err) {
      console.error('Error refreshing team data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Supabase Realtime Subscription
  useEffect(() => {
    const supabaseClient = getSupabaseBrowserClient();
    if (!supabaseClient) {
      // If Supabase credentials are not configured yet, poll gently every 10s
      const pollInterval = setInterval(() => {
        refreshData(false);
      }, 10000);
      return () => clearInterval(pollInterval);
    }

    const channelId = `avail-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabaseClient
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability',
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          refreshData(false);
          toast.info('Team availability updated in real-time!', { duration: 2500 });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLiveConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsLiveConnected(false);
        }
      });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [refreshData]);

  // Compute live scores for all 25 slots
  const slotScores = computeAllSlotScores(availability, members);
  const bestSlots = findBestSlots(slotScores);
  const bestScore = bestSlots.length > 0 ? bestSlots[0].score : 0;

  return (
    <div className="space-y-6">
      {/* Top Header with Live Indicator & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Team Availability Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Real-time aggregate schedule to determine optimal meeting time
          </p>
        </div>

        {/* Live Indicator Badge & Manual Refresh Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs border transition-all ${
              isLiveConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isLiveConnected ? 'bg-emerald-400' : 'bg-red-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isLiveConnected ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
            </span>
            <span>{isLiveConnected ? 'Live Realtime' : 'Live Sync'}</span>
          </div>

          <button
            onClick={() => refreshData(true)}
            disabled={isRefreshing}
            className="p-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 text-xs font-bold"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-navy-700' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* A. Member Status Bar (4 Avatars + Live Fill Count + Online Presence) */}
      <MemberStatusBar
        members={members}
        availability={availability}
        currentMemberId={currentMemberId}
        onlineMemberIds={onlineMemberIds}
      />

      {/* B. Best Common Meeting Slot Highlight Banner */}
      <BestSlotBanner
        bestSlots={bestSlots}
        totalMembersCount={members.length}
      />

      {/* C. Full 25-Row Comparison Table */}
      <TeamTable
        members={members}
        slotScores={slotScores}
        bestScore={bestScore}
      />
    </div>
  );
}

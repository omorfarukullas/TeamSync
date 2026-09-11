'use client';

import { useState, useEffect, useCallback } from 'react';
import { Member, AvailabilityRecord } from '@/lib/types';
import { computeAllSlotScores, findBestSlots } from '@/lib/constants';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { usePresence } from '@/hooks/usePresence';
import MemberStatusBar from './MemberStatusBar';
import BestSlotBanner from './BestSlotBanner';
import TeamTable from './TeamTable';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TeamViewProps {
  initialMembers: Member[];
  initialAvailability: AvailabilityRecord[];
  currentMemberId?: string;
  currentUserImage?: string;
}

export default function TeamView({
  initialMembers,
  initialAvailability,
  currentMemberId,
  currentUserImage,
}: TeamViewProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [availability, setAvailability] = useState<AvailabilityRecord[]>(initialAvailability);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setLastUpdated] = useState<Date>(new Date());
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const { onlineMemberIds } = usePresence();

  // Fetch latest availability and members from API
  const refreshData = useCallback(async (showToast = false) => {
    try {
      setIsRefreshing(true);
      const [availRes, memRes] = await Promise.all([
        fetch('/api/availability'),
        fetch('/api/members').catch(() => null),
      ]);
      const json = await availRes.json();
      if (json.success && Array.isArray(json.data)) {
        setAvailability(json.data);
        setLastUpdated(new Date());
        if (showToast) {
          toast.success('Team availability updated!');
        }
      }
      if (memRes && memRes.ok) {
        const memJson = await memRes.json();
        if (memJson.success && Array.isArray(memJson.data)) {
          const updated = memJson.data.map((m: Member) => {
            if (m.id === currentMemberId && currentUserImage) {
              return { ...m, avatar_url: currentUserImage };
            }
            return m;
          });
          setMembers(updated);
        }
      }
    } catch (err) {
      console.error('Error refreshing team data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [currentMemberId, currentUserImage]);

  // Supabase Realtime Subscription
  useEffect(() => {
    const supabaseClient = getSupabaseBrowserClient();
    if (!supabaseClient) {
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

  const slotScores = computeAllSlotScores(availability, members);
  const bestSlots = findBestSlots(slotScores);
  const bestScore = bestSlots.length > 0 ? bestSlots[0].score : 0;

  return (
    <div className="space-y-8">
      {/* Top Header with Live Indicator & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#525252] block mb-1">
            CONSENSUS MATRIX &middot; 4 COHORT MEMBERS
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-black uppercase">
            Team Availability Matrix
          </h1>
          <p className="font-body text-xs sm:text-sm text-[#525252] mt-1">
            Real-time aggregate schedule to identify optimal common meeting windows without calendar conflict.
          </p>
        </div>

        {/* Live Indicator Badge & Manual Refresh Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white border border-black text-xs font-bold uppercase tracking-wider">
            <span className={`w-2 h-2 ${isLiveConnected ? 'bg-white' : 'bg-[#737373]'}`} />
            <span>{isLiveConnected ? 'LIVE REALTIME' : 'POLLING SYNC'}</span>
          </div>

          <button
            onClick={() => refreshData(true)}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-white hover:bg-black hover:text-white text-black border border-black transition-invert disabled:opacity-50 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* A. Member Status Bar (4 Avatars + Live Fill Count + Online Presence) */}
      <MemberStatusBar
        members={members}
        availability={availability}
        currentMemberId={currentMemberId}
        currentUserImage={currentUserImage}
        onlineMemberIds={onlineMemberIds}
      />

      {/* B. Best Common Meeting Slot Highlight Banner */}
      <BestSlotBanner
        bestSlots={bestSlots}
        totalMembersCount={members.length}
      />

      {/* C. Full Comparison Table */}
      <TeamTable
        members={members}
        slotScores={slotScores}
        bestScore={bestScore}
        currentUserImage={currentUserImage}
        currentMemberId={currentMemberId}
        onlineMemberIds={onlineMemberIds}
      />
    </div>
  );
}


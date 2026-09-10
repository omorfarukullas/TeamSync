'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { PresenceRecord } from '@/lib/types';

const ONLINE_THRESHOLD_MS = 60 * 1000; // 60 seconds
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

export function usePresence() {
  const [presenceMap, setPresenceMap] = useState<Record<string, number>>({});
  const lastHeartbeatRef = useRef<number>(0);

  // Send heartbeat ping to server
  const sendHeartbeat = useCallback(async () => {
    try {
      lastHeartbeatRef.current = Date.now();
      const res = await fetch('/api/presence', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.memberId) {
        setPresenceMap((prev) => ({
          ...prev,
          [json.memberId]: Date.now(),
        }));
      }
    } catch (err) {
      console.error('Error sending presence heartbeat:', err);
    }
  }, []);

  // Fetch all presence records from server
  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch('/api/presence');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const newMap: Record<string, number> = {};
        json.data.forEach((rec: PresenceRecord) => {
          newMap[rec.member_id] = new Date(rec.last_seen).getTime();
        });
        setPresenceMap((prev) => ({ ...prev, ...newMap }));
      }
    } catch (err) {
      console.error('Error fetching presence:', err);
    }
  }, []);

  useEffect(() => {
    // 1. Initial heartbeat & fetch
    sendHeartbeat();
    fetchPresence();

    // 2. Periodic heartbeat every 30s
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    // 3. Periodic UI re-evaluation every 10s (to expire offline members gracefully)
    const evalInterval = setInterval(() => {
      setPresenceMap((prev) => ({ ...prev }));
    }, 10000);

    // 4. Supabase Realtime subscription for instant presence updates
    const supabaseClient = getSupabaseBrowserClient();
    let channel: any = null;

    if (supabaseClient) {
      const channelId = `presence-${Math.random().toString(36).substring(2, 9)}`;
      channel = supabaseClient
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'presence',
          },
          (payload) => {
            const record = payload.new as PresenceRecord;
            if (record && record.member_id) {
              setPresenceMap((prev) => ({
                ...prev,
                [record.member_id]: new Date(record.last_seen).getTime(),
              }));
            }
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(evalInterval);
      if (supabaseClient && channel) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, [sendHeartbeat, fetchPresence]);

  const now = Date.now();
  const onlineMemberIds = new Set<string>();

  Object.entries(presenceMap).forEach(([memberId, lastSeenTime]) => {
    if (now - lastSeenTime <= ONLINE_THRESHOLD_MS) {
      onlineMemberIds.add(memberId);
    }
  });

  const isOnline = (memberId: string) => onlineMemberIds.has(memberId);

  return {
    onlineMemberIds,
    isOnline,
    refreshPresence: fetchPresence,
  };
}

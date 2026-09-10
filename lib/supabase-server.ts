import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AvailabilityRecord, AvailabilityStatus, ChatMessage, Member } from './types';
import { DEFAULT_MEMBERS } from './constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let serverClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (serverClient) return serverClient;

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl.includes('your-project') ||
    serviceRoleKey.includes('your_supabase_')
  ) {
    return null;
  }

  try {
    serverClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    return serverClient;
  } catch (error) {
    console.error('Failed to initialize Supabase server client:', error);
    return null;
  }
}

/**
 * Fetch all members from database or return default seeded members
 */
export async function getMembers(): Promise<Member[]> {
  const client = getSupabaseServerClient();
  if (!client) return DEFAULT_MEMBERS;

  try {
    const { data, error } = await client
      .from('members')
      .select('*')
      .order('id');

    if (error || !data || data.length === 0) {
      return DEFAULT_MEMBERS;
    }
    return data as Member[];
  } catch (err) {
    console.error('Error fetching members:', err);
    return DEFAULT_MEMBERS;
  }
}

/**
 * Update member's avatar on first login if provided from Google OAuth
 */
export async function updateMemberAvatar(email: string, avatarUrl: string): Promise<void> {
  const client = getSupabaseServerClient();
  if (!client || !email || !avatarUrl) return;

  try {
    await client
      .from('members')
      .update({ avatar_url: avatarUrl })
      .eq('email', email);
  } catch (err) {
    console.error('Error updating member avatar:', err);
  }
}

/**
 * Fetch all availability records
 */
export async function getAllAvailability(): Promise<AvailabilityRecord[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('availability')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching availability:', error);
      return [];
    }
    return (data || []) as AvailabilityRecord[];
  } catch (err) {
    console.error('Error fetching availability:', err);
    return [];
  }
}

/**
 * Upsert single availability record
 */
export async function upsertAvailability(
  memberId: string,
  day: string,
  timeSlot: string,
  status: AvailabilityStatus,
  remarks?: string | null
): Promise<{ success: boolean; error?: string; data?: AvailabilityRecord }> {
  const client = getSupabaseServerClient();
  if (!client) {
    return {
      success: true,
      data: {
        member_id: memberId,
        day,
        time_slot: timeSlot,
        status,
        remarks: remarks || null,
        updated_at: new Date().toISOString(),
      },
    };
  }

  try {
    const { data, error } = await client
      .from('availability')
      .upsert(
        {
          member_id: memberId,
          day,
          time_slot: timeSlot,
          status,
          remarks: remarks ? remarks.slice(0, 100) : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'member_id,day,time_slot' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting availability:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as AvailabilityRecord };
  } catch (err: any) {
    console.error('Error upserting availability:', err);
    return { success: false, error: err?.message || 'Failed to save availability' };
  }
}

/**
 * Fetch recent chat messages
 */
export async function getChatMessages(limit = 100): Promise<ChatMessage[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('messages')
      .select('*, members(id, name, email, avatar_url)')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
    return (data || []) as ChatMessage[];
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    return [];
  }
}

/**
 * Insert a chat message
 */
export async function insertChatMessage(
  memberId: string,
  content: string
): Promise<{ success: boolean; data?: ChatMessage; error?: string }> {
  const client = getSupabaseServerClient();
  if (!client) {
    return {
      success: true,
      data: {
        id: `mock-${Date.now()}`,
        member_id: memberId,
        content: content.slice(0, 500),
        created_at: new Date().toISOString(),
      },
    };
  }

  try {
    const { data, error } = await client
      .from('messages')
      .insert({
        member_id: memberId,
        content: content.trim().slice(0, 500),
        created_at: new Date().toISOString(),
      })
      .select('*, members(id, name, email, avatar_url)')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ChatMessage };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send message' };
  }
}

export type AvailabilityStatus = 'available' | 'not_available' | 'maybe';

export interface Member {
  id: string; // 'mehedi' | 'omor' | 'rayan' | 'mahjabin'
  name: string;
  email: string;
  avatar_url?: string | null;
  created_at?: string;
}

export interface AvailabilityRecord {
  id?: string;
  member_id: string;
  day: string;
  time_slot: string;
  status: AvailabilityStatus;
  remarks?: string | null;
  updated_at?: string;
}

export interface SlotBreakdown {
  available: number;
  maybe: number;
  not_available: number;
  not_filled: number;
}

export interface SlotScore {
  day: string;
  time_slot: string;
  score: number;
  maxScore: number;
  breakdown: SlotBreakdown;
  members: Record<string, { status?: AvailabilityStatus; remarks?: string | null }>;
}

export interface ChatMessage {
  id: string;
  member_id: string;
  content: string;
  created_at: string;
  members?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  memberId: string;
}

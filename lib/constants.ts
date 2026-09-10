import { AvailabilityRecord, AvailabilityStatus, Member, SlotScore } from './types';

export const DAYS = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
] as const;

export type Day = typeof DAYS[number];

export const TIME_SLOTS = [
  '8:30–9:10 AM',
  '9:11–11:10 AM',
  '11:11 AM–12:30 PM',
  '12:31–1:50 PM',
  '1:51–3:10 PM',
  '3:11–4:30 PM',
] as const;

export type TimeSlot = typeof TIME_SLOTS[number];

export const TOTAL_SLOTS = DAYS.length * TIME_SLOTS.length; // 30 slots (5 days x 6 slots)

export const STATUS_CONFIG: Record<
  AvailabilityStatus,
  {
    label: string;
    emoji: string;
    points: number;
    bgClass: string;
    borderClass: string;
    textClass: string;
    hexBg: string;
    hexBorder: string;
    hexText: string;
  }
> = {
  available: {
    label: 'Available',
    emoji: '✅',
    points: 2,
    bgClass: 'bg-[#C6EFCE]',
    borderClass: 'border-[#70AD47]',
    textClass: 'text-[#375623]',
    hexBg: '#C6EFCE',
    hexBorder: '#70AD47',
    hexText: '#375623',
  },
  not_available: {
    label: 'Not Available',
    emoji: '❌',
    points: 0,
    bgClass: 'bg-[#FFC7CE]',
    borderClass: 'border-[#FF0000]',
    textClass: 'text-[#9C0006]',
    hexBg: '#FFC7CE',
    hexBorder: '#FF0000',
    hexText: '#9C0006',
  },
  maybe: {
    label: 'Maybe',
    emoji: '⚠️',
    points: 1,
    bgClass: 'bg-[#FFEB9C]',
    borderClass: 'border-[#FFAB00]',
    textClass: 'text-[#7D4E00]',
    hexBg: '#FFEB9C',
    hexBorder: '#FFAB00',
    hexText: '#7D4E00',
  },
};

export const DEFAULT_MEMBERS: Member[] = [
  { id: 'mehedi', name: 'Mehedi', email: 'abdmehedizs@gmail.com' },
  { id: 'omor', name: 'Omor', email: 'omor.farukh16@gmail.com' },
  { id: 'rayan', name: 'Rayan', email: 'rayan.rah@gmail.com' },
  { id: 'mahjabin', name: 'Mahjabin', email: 'mahjabinkhan220619@gmail.com' },
];

/**
 * Score a single status
 */
export function getStatusPoints(status?: AvailabilityStatus | null): number {
  if (!status) return 0;
  return STATUS_CONFIG[status]?.points ?? 0;
}

/**
 * Compute scores for all 25 slots across all members
 */
export function computeAllSlotScores(
  availability: AvailabilityRecord[],
  members: Member[] = DEFAULT_MEMBERS
): SlotScore[] {
  const result: SlotScore[] = [];

  for (const day of DAYS) {
    for (const time_slot of TIME_SLOTS) {
      let score = 0;
      let availableCount = 0;
      let maybeCount = 0;
      let notAvailableCount = 0;
      let notFilledCount = 0;
      const memberMap: Record<string, { status?: AvailabilityStatus; remarks?: string | null }> = {};

      for (const member of members) {
        const record = availability.find(
          (r) => r.member_id === member.id && r.day === day && r.time_slot === time_slot
        );

        if (record && record.status) {
          memberMap[member.id] = {
            status: record.status,
            remarks: record.remarks,
          };

          if (record.status === 'available') {
            score += 2;
            availableCount++;
          } else if (record.status === 'maybe') {
            score += 1;
            maybeCount++;
          } else if (record.status === 'not_available') {
            notAvailableCount++;
          }
        } else {
          memberMap[member.id] = { status: undefined, remarks: null };
          notFilledCount++;
        }
      }

      result.push({
        day,
        time_slot,
        score,
        maxScore: members.length * 2, // 4 members * 2 = 8
        breakdown: {
          available: availableCount,
          maybe: maybeCount,
          not_available: notAvailableCount,
          not_filled: notFilledCount,
        },
        members: memberMap,
      });
    }
  }

  return result;
}

/**
 * Find highest scoring slots
 */
export function findBestSlots(slotScores: SlotScore[]): SlotScore[] {
  if (!slotScores || slotScores.length === 0) return [];
  
  // Only consider slots with at least 1 point
  const maxScore = Math.max(...slotScores.map((s) => s.score));
  if (maxScore <= 0) return [];

  return slotScores.filter((s) => s.score === maxScore);
}

/**
 * Count how many slots a member has filled (any status counts)
 */
export function countMemberFilledSlots(
  memberId: string,
  availability: AvailabilityRecord[]
): number {
  return availability.filter(
    (r) => r.member_id === memberId && Boolean(r.status)
  ).length;
}

import { NextRequest, NextResponse } from 'next/server';
import { auth, getMemberByEmail } from '@/lib/auth';
import { getAllAvailability, upsertAvailability } from '@/lib/supabase-server';
import { AvailabilityStatus } from '@/lib/types';
import { DAYS, TIME_SLOTS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getAllAvailability();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API GET /availability error:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = getMemberByEmail(session.user.email);
    const memberId = (session.user as any).memberId || member.id;

    const body = await req.json();
    const { day, time_slot, status, remarks } = body;

    if (!day || !DAYS.includes(day)) {
      return NextResponse.json({ error: 'Invalid day' }, { status: 400 });
    }

    if (!time_slot || !TIME_SLOTS.includes(time_slot)) {
      return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });
    }

    if (!status || !['available', 'not_available', 'maybe'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const result = await upsertAvailability(
      memberId,
      day,
      time_slot,
      status as AvailabilityStatus,
      remarks
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('API POST /availability error:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

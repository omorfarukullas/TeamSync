import { NextRequest, NextResponse } from 'next/server';
import { auth, getMemberByEmail } from '@/lib/auth';
import { getPresenceRecords, upsertPresence } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const records = await getPresenceRecords();
    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error('API GET /presence error:', error);
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

    const result = await upsertPresence(memberId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update presence' }, { status: 500 });
    }

    return NextResponse.json({ success: true, memberId });
  } catch (error: any) {
    console.error('API POST /presence error:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

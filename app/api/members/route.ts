import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMembers } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const members = await getMembers();
    return NextResponse.json({ success: true, data: members });
  } catch (error: any) {
    console.error('API GET /members error:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

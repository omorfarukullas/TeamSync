import { auth, getMemberByEmail } from '@/lib/auth';
import { getAllAvailability, getMembers } from '@/lib/supabase-server';
import TeamView from '@/components/TeamView';

export const dynamic = 'force-dynamic';

export default async function TeamAvailabilityPage() {
  const session = await auth();
  const email = session?.user?.email || '';
  const currentMember = getMemberByEmail(email);
  const currentMemberId = (session?.user as any)?.memberId || currentMember.id;

  const [allAvailability, allMembers] = await Promise.all([
    getAllAvailability(),
    getMembers(),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <TeamView
        initialMembers={allMembers}
        initialAvailability={allAvailability}
        currentMemberId={currentMemberId}
      />
    </div>
  );
}

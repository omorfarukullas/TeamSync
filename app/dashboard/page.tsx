import { auth, getMemberByEmail } from '@/lib/auth';
import { getAllAvailability, getMembers } from '@/lib/supabase-server';
import AvailabilityTable from '@/components/AvailabilityTable';

export const dynamic = 'force-dynamic';

export default async function MyAvailabilityPage() {
  const session = await auth();
  const email = session?.user?.email || '';
  const currentMember = getMemberByEmail(email);
  const currentMemberId = (session?.user as any)?.memberId || currentMember.id;
  const currentMemberName = session?.user?.name || currentMember.name;

  const [allAvailability, allMembers] = await Promise.all([
    getAllAvailability(),
    getMembers(),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AvailabilityTable
        currentMemberId={currentMemberId}
        currentMemberName={currentMemberName}
        initialAvailability={allAvailability}
        allMembers={allMembers}
      />
    </div>
  );
}

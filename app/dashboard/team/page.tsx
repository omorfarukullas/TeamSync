import { auth, getMemberByEmail } from '@/lib/auth';
import { getAllAvailability, getMembers, updateMemberAvatar } from '@/lib/supabase-server';
import TeamView from '@/components/TeamView';

export const dynamic = 'force-dynamic';

export default async function TeamAvailabilityPage() {
  const session = await auth();
  const email = session?.user?.email || '';
  const currentMember = getMemberByEmail(email);
  const currentMemberId = (session?.user as any)?.memberId || currentMember.id;
  const currentUserImage = session?.user?.image || undefined;

  // Sync avatar to database
  if (email && currentUserImage) {
    updateMemberAvatar(email, currentUserImage).catch(() => {});
  }

  const [allAvailability, allMembers] = await Promise.all([
    getAllAvailability(),
    getMembers(),
  ]);

  // Ensure current user's Google avatar is immediately attached
  const membersWithAvatar = allMembers.map((m) => {
    if (m.id === currentMemberId && currentUserImage) {
      return { ...m, avatar_url: currentUserImage };
    }
    return m;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <TeamView
        initialMembers={membersWithAvatar}
        initialAvailability={allAvailability}
        currentMemberId={currentMemberId}
        currentUserImage={currentUserImage}
      />
    </div>
  );
}


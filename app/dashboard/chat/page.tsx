import { auth, getMemberByEmail } from '@/lib/auth';
import { getChatMessages, getMembers } from '@/lib/supabase-server';
import ChatView from '@/components/ChatView';

export const dynamic = 'force-dynamic';

export default async function TeamChatPage() {
  const session = await auth();
  const email = session?.user?.email || '';
  const currentMember = getMemberByEmail(email);
  const currentMemberId = (session?.user as any)?.memberId || currentMember.id;
  const currentMemberName = session?.user?.name || currentMember.name;

  const [messages, members] = await Promise.all([
    getChatMessages(100),
    getMembers(),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <ChatView
        initialMessages={messages}
        currentMemberId={currentMemberId}
        currentMemberName={currentMemberName}
        members={members}
      />
    </div>
  );
}

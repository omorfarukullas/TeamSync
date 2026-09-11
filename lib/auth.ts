import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DEFAULT_MEMBERS } from './constants';
import { updateMemberAvatar } from './supabase-server';

export function getAllowedEmails(): string[] {
  // Always include DEFAULT_MEMBERS as the authoritative base list
  const baseEmails = DEFAULT_MEMBERS.map((m) => m.email.toLowerCase().trim());
  const envEmails = process.env.ALLOWED_EMAILS;
  if (!envEmails) {
    return baseEmails;
  }
  // Merge env var additions with the base list (env var can add, not replace)
  const envList = envEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set([...baseEmails, ...envList]));
}

export function getMemberByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const found = DEFAULT_MEMBERS.find((m) => m.email.toLowerCase() === normalized);
  if (found) return found;

  // Fallback for custom allowed email: use email prefix
  const id = normalized.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  const name = id.charAt(0).toUpperCase() + id.slice(1);
  return { id, name, email: normalized };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // Development & testing fast-login provider so all 4 team members can be tested instantly
    Credentials({
      id: 'demo-login',
      name: 'Team Member Demo Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase()?.trim();
        if (!email) return null;

        const allowed = getAllowedEmails();
        if (!allowed.includes(email)) {
          return null;
        }

        const member = getMemberByEmail(email);
        return {
          id: member.id,
          name: member.name,
          email: member.email,
          image: `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`,
        };
      },
    }),
  ],
  pages: {
    signIn: '/',
    error: '/denied',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) {
        return false;
      }

      const email = user.email.toLowerCase().trim();
      const allowedEmails = getAllowedEmails();

      if (!allowedEmails.includes(email)) {
        return '/denied';
      }

      // Update avatar in Supabase if logging in via Google
      if (user.image) {
        updateMemberAvatar(email, user.image).catch(() => {});
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const member = getMemberByEmail(user.email);
        token.memberId = member.id;
        token.name = user.name || member.name;
        token.email = user.email;
        if (user.image) {
          token.picture = user.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        const email = (token.email as string) || session.user.email || '';
        const member = getMemberByEmail(email);
        (session.user as any).memberId = token.memberId || member.id;
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'teamsync_jwt_secret_dev_2026',
});

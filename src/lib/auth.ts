
'use server';

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Note: Database-related logic is commented out to allow prototyping without a DB connection.
// import { db } from './db';
// import { teamMemberships, teams, users } from '../../drizzle/schema';
// import { eq, and } from 'drizzle-orm';
// import { cookies } from 'next/headers';
// import { z } from 'zod';

/*
const invitationSchema = z.object({
    teamId: z.coerce.number().int().positive(),
    inviterId: z.string().uuid(),
});
*/

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        // Mock user authentication for prototyping
        const isMockUser = credentials.username === 'user' && credentials.password === 'password';

        if (isMockUser) {
          return {
            id: 'mock-user-id',
            name: 'کاربر تستی',
            email: 'user@example.com',
            username: 'user',
          };
        }
        
       return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  // Events are commented out as they depend on the database and invitation flow.
  /*
  events: {
    async signIn({ user, isNewUser }) {
      const cookieStore = cookies();
      const invitationCookie = cookieStore.get('invitation');
      
      if (invitationCookie) {
        try {
          const { teamId, inviterId } = invitationSchema.parse(JSON.parse(invitationCookie.value));
          
          const existingMembership = await db.query.teamMemberships.findFirst({
            where: and(eq(teamMemberships.userId, user.id), eq(teamMemberships.teamId, teamId)),
          });

          if (!existingMembership) {
            await db.insert(teamMemberships).values({
              teamId: teamId,
              userId: user.id,
              role: 'member',
              invitedBy: inviterId,
              invitationMedium: 'TEAMINVITATION',
            });
          }
          
          cookieStore.delete('invitation');
          
        } catch (error) {
          console.error('Error processing invitation on sign-in:', error);
        }
      }
    }
  }
  */
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

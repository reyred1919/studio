'use server';

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { teamMemberships, teams, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { z } from 'zod';

const invitationSchema = z.object({
    teamId: z.coerce.number().int().positive(),
    inviterId: z.string().uuid(),
});

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

        const user = await db.query.users.findFirst({
          where: eq(users.username, credentials.username),
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
        };
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
  events: {
    async signIn({ user, isNewUser }) {
      const cookieStore = cookies();
      const utm_source = cookieStore.get('utm_source')?.value;
      const utm_medium = cookieStore.get('utm_medium')?.value;
      const utm_campaign = cookieStore.get('utm_campaign')?.value;

      if (utm_campaign !== 'TEAMINVITATION' || !utm_source || !utm_medium) {
        return;
      }
      
      try {
        const team = await db.query.teams.findFirst({
          where: eq(teams.name, utm_medium)
        });

        if (!team) {
            console.error(`Team with name ${utm_medium} not found.`);
            return;
        }

        const validation = invitationSchema.safeParse({ teamId: team.id, inviterId: utm_source });

        if (!validation.success) {
            console.error('Invalid invitation data from cookies:', validation.error);
            return;
        }

        const { teamId, inviterId } = validation.data;

        // Check if the user is already a member
        const existingMembership = await db.query.teamMemberships.findFirst({
            where: and(
                eq(teamMemberships.userId, user.id),
                eq(teamMemberships.teamId, teamId)
            )
        });

        if (existingMembership) {
            console.log(`User ${user.id} is already a member of team ${teamId}.`);
            return; // Already a member, do nothing
        }

        // Add the new user to the team
        await db.insert(teamMemberships).values({
          userId: user.id,
          teamId: teamId,
          role: 'member',
          invitedBy: inviterId,
          invitationMedium: utm_campaign
        });

        console.log(`User ${user.id} successfully added to team ${teamId}.`);

      } catch (error) {
        console.error('Error processing team invitation during signIn:', error);
      } finally {
        // Clean up cookies after processing
        cookieStore.delete('utm_source');
        cookieStore.delete('utm_medium');
        cookieStore.delete('utm_campaign');
      }
    }
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);


'use server';

import { db } from '@/lib/db';
import {
  teams,
  teamMemberships,
  users,
  invitationLinks,
} from '../../drizzle/schema';
import { auth } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Team } from '@/types/okr';
import { redirect } from 'next/navigation';

const addTeamSchema = z.object({
  name: z.string().min(1, 'نام تیم الزامی است.'),
});

export async function addTeam(
  data: z.infer<typeof addTeamSchema>,
  ownerId: string
) {
  const session = await auth();
  if (!session?.user || session.user.id !== ownerId) {
    throw new Error('Unauthorized');
  }

  const newTeam = await db.transaction(async (tx) => {
    const [insertedTeam] = await tx
      .insert(teams)
      .values({ name: data.name, ownerId })
      .returning();

    await tx.insert(teamMemberships).values({
      teamId: insertedTeam.id,
      userId: ownerId,
      role: 'admin',
    });
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const invitationLink = `${baseUrl}/signup?utm_source=${ownerId}&utm_medium=${encodeURIComponent(insertedTeam.name)}&utm_campaign=TEAMINVITATION`;

    await tx.insert(invitationLinks).values({
        teamId: insertedTeam.id,
        creatorId: ownerId,
        link: invitationLink,
    });


    return { ...insertedTeam, invitationLink };
  });

  revalidatePath('/teams');
  return newTeam;
}

export async function getTeamsForUser(userId: string) {
    const userMemberships = await db.query.teamMemberships.findMany({
        where: eq(teamMemberships.userId, userId),
        with: {
            team: {
                with: {
                    owner: {
                        columns: {
                            id: true,
                            name: true,
                        }
                    },
                    invitationLink: true,
                    members: {
                        with: {
                            user: {
                                columns: {
                                    id: true,
                                    name: true,
                                    image: true,
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    return userMemberships.map(m => ({
        id: m.team.id,
        name: m.team.name,
        ownerId: m.team.ownerId,
        role: m.role,
        invitationLink: m.team.invitationLink?.link,
        members: m.team.members.map(mem => ({
            id: mem.user.id,
            name: mem.user.name || 'Unnamed',
            avatarUrl: mem.user.image,
        }))
    }));
}

const updateTeamSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'نام تیم الزامی است.'),
});

export async function updateTeam(teamData: z.infer<typeof updateTeamSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const [updatedTeam] = await db
    .update(teams)
    .set({ name: teamData.name })
    .where(and(eq(teams.id, teamData.id), eq(teams.ownerId, session.user.id)))
    .returning();

  if (!updatedTeam) {
    throw new Error('تیم یافت نشد یا شما مالک آن نیستید.');
  }
  
  revalidatePath('/teams');
  return updatedTeam;
}


export async function deleteTeam(teamId: number) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  
  // Verify user is the owner before deleting
  const team = await db.query.teams.findFirst({
    where: and(eq(teams.id, teamId), eq(teams.ownerId, session.user.id)),
  });

  if (!team) {
    throw new Error('تیم یافت نشد یا شما اجازه حذف آن را ندارید.');
  }

  await db.delete(teams).where(eq(teams.id, teamId));

  revalidatePath('/teams');
}

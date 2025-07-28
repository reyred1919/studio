
'use server';

// import { db } from '@/lib/db';
/*
import {
  teams,
  teamMemberships,
  users,
  invitationLinks,
} from '../../drizzle/schema';
import { auth } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';
*/
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Team, TeamWithMembership, Objective } from '@/types/okr';
import { redirect } from 'next/navigation';

import { suggestOkrsImprovements, type SuggestOkrsImprovementsInput, type SuggestOkrsImprovementsOutput } from '@/ai/flows/suggest-okr-improvements';

const addTeamSchema = z.object({
  name: z.string().min(1, 'نام تیم الزامی است.'),
});

const MOCK_TEAMS: TeamWithMembership[] = [
    {
        id: 1,
        name: 'تیم محصول',
        ownerId: 'mock-user-id',
        role: 'admin',
        invitationLink: 'http://localhost:3000/signup?utm_source=mock-user-id&utm_medium=تیم%20محصول&utm_campaign=TEAMINVITATION',
        members: [
            { id: 'mock-user-id', name: 'کاربر تستی', avatarUrl: 'https://placehold.co/40x40.png' },
            { id: 'member-2', name: 'همکار اول', avatarUrl: 'https://placehold.co/40x40.png' }
        ]
    },
    {
        id: 2,
        name: 'تیم بازاریابی',
        ownerId: 'another-user-id',
        role: 'member',
        invitationLink: 'http://localhost:3000/signup?utm_source=another-user-id&utm_medium=تیم%20بازاریابی&utm_campaign=TEAMINVITATION',
        members: [
            { id: 'another-user-id', name: 'مدیر بازاریابی', avatarUrl: 'https://placehold.co/40x40.png' },
            { id: 'mock-user-id', name: 'کاربر تستی', avatarUrl: 'https://placehold.co/40x40.png' }
        ]
    }
];

export async function addTeam(
  data: z.infer<typeof addTeamSchema>,
  ownerId: string
) {
  /*
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
  */
  console.log("Mock addTeam:", data, ownerId);
  const newTeam: Team = {
      id: Math.floor(Math.random() * 1000),
      name: data.name,
      ownerId: ownerId,
      invitationLink: 'http://localhost:3000/mock-link',
      members: [{id: ownerId, name: 'کاربر تستی', avatarUrl: 'https://placehold.co/40x40.png'}]
  };
  MOCK_TEAMS.push({ ...newTeam, role: 'admin' });
  revalidatePath('/teams');
  return newTeam;
}

export async function getTeamsForUser(userId: string) {
    console.log("Mock getTeamsForUser for:", userId);
    return Promise.resolve(MOCK_TEAMS);
    /*
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
    */
}

const updateTeamSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'نام تیم الزامی است.'),
});

export async function updateTeam(teamData: z.infer<typeof updateTeamSchema>) {
  /*
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
  */
  console.log("Mock updateTeam:", teamData);
  const teamIndex = MOCK_TEAMS.findIndex(t => t.id === teamData.id);
  if (teamIndex !== -1) {
      MOCK_TEAMS[teamIndex].name = teamData.name;
  }
  revalidatePath('/teams');
  return MOCK_TEAMS.find(t => t.id === teamData.id);
}


export async function deleteTeam(teamId: number) {
  /*
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
  */
  console.log("Mock deleteTeam:", teamId);
  const teamIndex = MOCK_TEAMS.findIndex(t => t.id === teamId);
  if (teamIndex !== -1) {
    MOCK_TEAMS.splice(teamIndex, 1);
  }
  revalidatePath('/teams');
}


export async function getOkrImprovementSuggestionsAction(
  objective: Objective
): Promise<SuggestOkrsImprovementsOutput> {
  try {
    const input: SuggestOkrsImprovementsInput = {
      objectiveDescription: objective.description,
      keyResults: objective.keyResults.map(kr => ({
        keyResultDescription: kr.description,
        progress: kr.progress,
        confidenceLevel: kr.confidenceLevel,
        initiatives: kr.initiatives.map(i => ({
          initiativeDescription: i.description,
          status: i.status,
        })),
      })),
    };
    
    const suggestions = await suggestOkrsImprovements(input);
    return suggestions;
  } catch (error) {
    console.error("Error in getOkrImprovementSuggestionsAction:", error);
    return { suggestions: ["An error occurred while fetching suggestions. Please try again later."] };
  }
}

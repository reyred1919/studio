
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

// Mock in-memory store for teams
let MOCK_TEAMS: TeamWithMembership[] = [
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
let nextTeamId = 3;


export async function addTeam(
  data: z.infer<typeof addTeamSchema>,
  ownerId: string
) {
  console.log("Mock addTeam:", data, ownerId);
  const newTeam: TeamWithMembership = {
      id: nextTeamId++,
      name: data.name,
      ownerId: ownerId,
      invitationLink: `http://localhost:3000/mock-link-${nextTeamId}`,
      members: [{id: ownerId, name: 'کاربر تستی', avatarUrl: 'https://placehold.co/40x40.png'}],
      role: 'admin'
  };
  MOCK_TEAMS.push(newTeam);
  revalidatePath('/teams');
  return newTeam;
}

export async function getTeamsForUser(userId: string) {
    console.log("Mock getTeamsForUser for:", userId);
    return Promise.resolve(MOCK_TEAMS);
}

const updateTeamSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'نام تیم الزامی است.'),
});

export async function updateTeam(teamData: z.infer<typeof updateTeamSchema>) {
  console.log("Mock updateTeam:", teamData);
  const teamIndex = MOCK_TEAMS.findIndex(t => t.id === teamData.id);
  let updatedTeam: TeamWithMembership | undefined = undefined;
  if (teamIndex !== -1) {
      MOCK_TEAMS[teamIndex].name = teamData.name;
      updatedTeam = MOCK_TEAMS[teamIndex];
  }
  revalidatePath('/teams');
  return updatedTeam;
}


export async function deleteTeam(teamId: number) {
  console.log("Mock deleteTeam:", teamId);
  const teamIndex = MOCK_TEAMS.findIndex(t => t.id === teamId);
  if (teamIndex > -1) {
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

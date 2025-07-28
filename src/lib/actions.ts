
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Team, TeamWithMembership, Objective, OkrCycle, ObjectiveFormData } from '@/types/okr';
import { suggestOkrsImprovements, type SuggestOkrsImprovementsInput, type SuggestOkrsImprovementsOutput } from '@/ai/flows/suggest-okr-improvements';
import { addMonths, startOfQuarter, endOfQuarter } from 'date-fns';

const addTeamSchema = z.object({
  name: z.string().min(1, 'نام تیم الزامی است.'),
});

// Mock Data
let MOCK_TEAMS: TeamWithMembership[] = [
    {
        id: 1, name: 'تیم محصول', ownerId: 'mock-user-id', role: 'admin',
        invitationLink: 'http://localhost:3000/invite/product-team',
        members: [
            { id: 'mock-user-id', name: 'کاربر تستی', avatarUrl: 'https://placehold.co/40x40.png' },
            { id: 'member-2', name: 'همکار اول', avatarUrl: 'https://placehold.co/40x40.png' }
        ]
    },
    {
        id: 2, name: 'تیم بازاریابی', ownerId: 'another-user-id', role: 'member',
        invitationLink: 'http://localhost:3000/invite/marketing-team',
        members: [
            { id: 'another-user-id', name: 'مدیر بازاریابی', avatarUrl: 'https://placehold.co/40x40.png' },
            { id: 'mock-user-id', name: 'کاربر تستی', avatarUrl: 'https://placehold.co/40x40.png' }
        ]
    }
];
let nextTeamId = 3;

let MOCK_OKR_CYCLES: OkrCycle[] = [
    { id: 1, name: 'سه ماهه اول ۲۰۲۴', startDate: startOfQuarter(new Date(2024, 0, 1)), endDate: endOfQuarter(new Date(2024, 0, 1)) },
    { id: 2, name: 'سه ماهه دوم ۲۰۲۴', startDate: startOfQuarter(new Date(2024, 3, 1)), endDate: endOfQuarter(new Date(2024, 3, 1)) },
    { id: 3, name: 'سه ماهه سوم ۲۰۲۴', startDate: startOfQuarter(new Date(2024, 6, 1)), endDate: endOfQuarter(new Date(2024, 6, 1)) },
];
let MOCK_ACTIVE_CYCLE_ID = 2;

let MOCK_OBJECTIVES: Objective[] = [
    { 
        id: 1, cycleId: 2, teamId: 1, description: 'افزایش رضایت مشتریان محصول',
        keyResults: [
            { id: 1, description: 'کاهش زمان پاسخگویی تیکت‌ها به زیر ۴ ساعت', progress: 50, confidenceLevel: 'متوسط', initiatives: [], assignees: [] },
            { id: 2, description: 'افزایش امتیاز NPS از ۸ به ۸.۵', progress: 70, confidenceLevel: 'زیاد', initiatives: [], assignees: [] },
        ]
    },
     { 
        id: 2, cycleId: 2, teamId: 2, description: 'افزایش آگاهی از برند در شبکه‌های اجتماعی',
        keyResults: [
            { id: 3, description: 'افزایش تعداد دنبال‌کنندگان اینستاگرام به ۵۰ هزار نفر', progress: 80, confidenceLevel: 'زیاد', initiatives: [], assignees: [] },
        ]
    },
    { 
        id: 3, cycleId: 1, description: 'هدف قدیمی برای سه ماهه اول',
        keyResults: [
            { id: 4, description: 'نتیجه کلیدی قدیمی', progress: 100, confidenceLevel: 'زیاد', initiatives: [], assignees: [] },
        ]
    }
];
let nextObjectiveId = 4;
let nextKeyResultId = 5;

// Teams Actions
export async function addTeam(data: z.infer<typeof addTeamSchema>, ownerId: string) {
  const newTeam: TeamWithMembership = {
      id: nextTeamId++, name: data.name, ownerId,
      invitationLink: `http://localhost:3000/mock-invite-${nextTeamId}`,
      members: [{id: ownerId, name: 'کاربر تستی', avatarUrl: 'https://placehold.co/40x40.png'}],
      role: 'admin'
  };
  MOCK_TEAMS.push(newTeam);
  revalidatePath('/teams');
  return newTeam;
}

export async function getTeams() {
    return Promise.resolve(MOCK_TEAMS);
}

export async function updateTeam(teamData: Team) {
  const teamIndex = MOCK_TEAMS.findIndex(t => t.id === teamData.id);
  if (teamIndex !== -1) {
      MOCK_TEAMS[teamIndex] = { ...MOCK_TEAMS[teamIndex], ...teamData };
  }
  revalidatePath('/teams');
}

export async function deleteTeam(teamId: number) {
  MOCK_TEAMS = MOCK_TEAMS.filter(t => t.id !== teamId);
  revalidatePath('/teams');
}

// OKR Cycle Actions
export async function getOkrCycles() {
    return Promise.resolve(MOCK_OKR_CYCLES);
}

export async function getActiveOkrCycle() {
    const activeCycle = MOCK_OKR_CYCLES.find(c => c.id === MOCK_ACTIVE_CYCLE_ID);
    return Promise.resolve(activeCycle || null);
}

export async function setActiveOkrCycle(cycleId: number) {
    MOCK_ACTIVE_CYCLE_ID = cycleId;
    revalidatePath('/dashboard');
    revalidatePath('/objectives');
}

// Objectives Actions
export async function getObjectives() {
    return Promise.resolve(MOCK_OBJECTIVES);
}

const generateId = () => Math.floor(Math.random() * 10000);

export async function addObjective(data: ObjectiveFormData) {
    const newObjective: Objective = {
      id: generateId(),
      description: data.description,
      teamId: data.teamId,
      cycleId: data.cycleId,
      keyResults: data.keyResults.map(kr => ({
        ...kr,
        id: generateId(),
        progress: 0,
        initiatives: kr.initiatives.map(init => ({
            ...init,
            id: generateId(),
            tasks: init.tasks.map(task => ({...task, id: generateId()}))
        }))
      })),
    };
    MOCK_OBJECTIVES.push(newObjective);
    revalidatePath('/objectives');
}

export async function updateObjective(data: Objective) {
    const objectiveIndex = MOCK_OBJECTIVES.findIndex(o => o.id === data.id);
    if(objectiveIndex !== -1) {
        MOCK_OBJECTIVES[objectiveIndex] = data;
    }
    revalidatePath('/objectives');
}

// Genkit AI Action
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
    if (!suggestions?.suggestions) {
       return { suggestions: ["در حال حاضر پیشنهاد خاصی وجود ندارد."] };
    }
    return suggestions;
  } catch (error) {
    console.error("Error in getOkrImprovementSuggestionsAction:", error);
    return { suggestions: ["در دریافت پیشنهادهای هوش مصنوعی خطایی روی داد. لطفاً دوباره تلاش کنید."] };
  }
}

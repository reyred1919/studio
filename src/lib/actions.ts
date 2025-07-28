
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Team, TeamWithMembership, Objective, OkrCycle, ObjectiveFormData, Initiative, KeyResult, InitiativeStatus, Risk } from '@/types/okr';
import { suggestOkrsImprovements, type SuggestOkrsImprovementsInput, type SuggestOkrsImprovementsOutput } from '@/ai/flows/suggest-okr-improvements';
import { startOfQuarter, endOfQuarter } from 'date-fns';

const addTeamSchema = z.object({
  name: z.string().min(1, 'نام تیم الزامی است.'),
});

// Mock Data - Simulating a database
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
            { 
                id: 1, 
                description: 'کاهش زمان پاسخگویی تیکت‌ها به زیر ۴ ساعت', 
                progress: 50, 
                confidenceLevel: 'متوسط', 
                assignees: [{ id: 'mock-user-id', name: 'کاربر تستی', avatarUrl: 'https://placehold.co/40x40.png' }],
                initiatives: [
                    { id: 1, description: 'استخدام ۲ کارشناس پشتیبانی جدید', status: 'تکمیل شده', tasks: [] },
                    { id: 2, description: 'راه اندازی سیستم چت آنلاین', status: 'در حال انجام', tasks: [
                        { id: 'task-1', description: 'انتخاب پلتفرم', completed: true },
                        { id: 'task-2', description: 'پیاده سازی فنی', completed: false },
                    ]}
                ],
                risks: [
                    { id: 1, description: 'کمبود نیروی متخصص برای پاسخگویی سریع', correctiveAction: 'برگزاری دوره آموزشی فشرده برای تیم پشتیبانی', status: 'در حال بررسی' }
                ]
            },
            { id: 2, description: 'افزایش امتیاز NPS از ۸ به ۸.۵', progress: 70, confidenceLevel: 'زیاد', initiatives: [], assignees: [], risks: [] },
        ]
    },
     { 
        id: 2, cycleId: 2, teamId: 2, description: 'افزایش آگاهی از برند در شبکه‌های اجتماعی',
        keyResults: [
            { id: 3, description: 'افزایش تعداد دنبال‌کنندگان اینستاگرام به ۵۰ هزار نفر', progress: 80, confidenceLevel: 'زیاد', initiatives: [], assignees: [], risks: [] },
        ]
    },
    { 
        id: 3, cycleId: 1, description: 'هدف قدیمی برای سه ماهه اول',
        keyResults: [
            { id: 4, description: 'نتیجه کلیدی قدیمی', progress: 100, confidenceLevel: 'زیاد', initiatives: [], assignees: [], risks: [] },
        ]
    }
];
let nextObjectiveId = 4;

const generateId = () => Math.floor(Math.random() * 10000);

// --- Teams Actions ---
export async function getTeams(): Promise<TeamWithMembership[]> {
    // In a real app, you'd filter by userId. Here, we return all teams for mocking.
    // This function assumes a single user context for prototyping.
    const MOCK_USER_ID = 'mock-user-id';
    const userTeams = MOCK_TEAMS.filter(team => team.members.some(m => m.id === MOCK_USER_ID));
    return Promise.resolve(userTeams);
}


export async function addTeam(data: { name: string }, ownerId: string) {
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

export async function updateTeam(teamData: Team) {
  const teamIndex = MOCK_TEAMS.findIndex(t => t.id === teamData.id);
  if (teamIndex !== -1) {
      MOCK_TEAMS[teamIndex] = { ...MOCK_TEAMS[teamIndex], ...teamData };
      revalidatePath('/teams');
  }
}

export async function deleteTeam(teamId: number) {
  const team = MOCK_TEAMS.find(t => t.id === teamId);
  if (!team) throw new Error("Team not found");
  
  // Also delete objectives associated with this team
  MOCK_OBJECTIVES = MOCK_OBJECTIVES.filter(obj => obj.teamId !== teamId);
  MOCK_TEAMS = MOCK_TEAMS.filter(t => t.id !== teamId);
  
  revalidatePath('/teams');
  revalidatePath('/objectives');
}


// --- OKR Cycle Actions ---
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

// --- Objectives & KR Actions ---
export async function getObjectives() {
    return Promise.resolve(MOCK_OBJECTIVES);
}

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
            tasks: init.tasks.map(task => ({...task, id: String(generateId())}))
        })),
        risks: kr.risks.map(risk => ({
            ...risk,
            id: generateId(),
        })),
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
    revalidatePath('/tasks');
}


// --- Initiative & Task Actions ---
function recalculateKrProgress(keyResult: KeyResult): number {
    if (keyResult.initiatives.length === 0) {
        // If no initiatives, progress is manually set (or stays as is). Let's assume 0 if not otherwise specified.
        return keyResult.progress; 
    }

    const totalInitiativeProgress = keyResult.initiatives.reduce((sum, init) => {
        const iTotalTasks = init.tasks.length;
        if (iTotalTasks === 0) {
            // Treat initiatives with no tasks based on their status
            return sum + (init.status === 'تکمیل شده' ? 100 : 0);
        }
        const iCompletedTasks = init.tasks.filter(t => t.completed).length;
        const iProgress = (iCompletedTasks / iTotalTasks) * 100;
        return sum + iProgress;
    }, 0);

    return Math.round(totalInitiativeProgress / keyResult.initiatives.length);
}

function updateInitiativeStatus(initiative: Initiative): InitiativeStatus {
    if (initiative.status === 'مسدود شده') {
        return 'مسدود شده'; // 'Blocked' status is manual and should persist unless changed by user.
    }
    const totalTasks = initiative.tasks.length;
    if (totalTasks === 0) {
        // If no tasks, status is manually set. Don't auto-change it unless it's completed.
        return initiative.status;
    }
    const completedTasks = initiative.tasks.filter(t => t.completed).length;

    if (completedTasks === totalTasks) {
        return 'تکمیل شده';
    }
    if (completedTasks > 0) {
        return 'در حال انجام';
    }
    return 'شروع نشده';
}


export async function updateInitiative(objectiveId: number, keyResultId: number, updatedInitiative: Initiative) {
    const objectiveIndex = MOCK_OBJECTIVES.findIndex(o => o.id === objectiveId);
    if (objectiveIndex === -1) return;

    const objective = MOCK_OBJECTIVES[objectiveIndex];
    const keyResultIndex = objective.keyResults.findIndex(kr => kr.id === keyResultId);
    if (keyResultIndex === -1) return;

    const keyResult = objective.keyResults[keyResultIndex];
    const initiativeIndex = keyResult.initiatives.findIndex(i => i.id === updatedInitiative.id);
    if (initiativeIndex === -1) return;

    // Update initiative and its status based on tasks
    const newStatus = updateInitiativeStatus(updatedInitiative);
    keyResult.initiatives[initiativeIndex] = { ...updatedInitiative, status: newStatus };

    // Recalculate KR progress
    keyResult.progress = recalculateKrProgress(keyResult);

    revalidatePath('/tasks');
    revalidatePath('/objectives'); // Also revalidate objectives page as KR progress changes
    revalidatePath('/dashboard');
}


// --- Genkit AI Action ---
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
    
    const result = await suggestOkrsImprovements(input);
    if (!result?.suggestions) {
       return { suggestions: ["در حال حاضر پیشنهاد خاصی وجود ندارد."] };
    }
    return result;
  } catch (error) {
    console.error("Error in getOkrImprovementSuggestionsAction:", error);
    return { suggestions: ["در دریافت پیشنهادهای هوش مصنوعی خطایی روی داد. لطفاً دوباره تلاش کنید."] };
  }
}

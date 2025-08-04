
'use server';

import { db } from '@/lib/db';
import { objectives, keyResults, initiatives, tasks, teams, members, users, okrCycles, calendarSettings as calendarSettingsTable, keyResultAssignees } from '@/lib/db/schema';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { Objective, Team, OkrCycle, ObjectiveFormData, TeamFormData, OkrCycleFormData, CalendarSettings, CalendarSettingsFormData } from '@/types/okr';
import { revalidatePath } from 'next/cache';

async function getUserId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Not authenticated');
    }
    return parseInt(session.user.id, 10);
}

// Helper function to get an objective with all its relations by ID for the current user
async function getObjectiveById(objectiveId: number): Promise<Objective> {
    const userId = await getUserId();
    const result = await db.query.objectives.findFirst({
        where: and(eq(objectives.id, objectiveId), eq(objectives.userId, userId)),
        with: {
            keyResults: {
                with: {
                    initiatives: { with: { tasks: true } },
                    keyResultAssignees: { with: { member: true } }
                }
            }
        }
    });

    if (!result) throw new Error("Objective not found");

    return {
        ...result,
        teamId: String(result.teamId),
        keyResults: result.keyResults.map(kr => ({
            ...kr,
            assignees: kr.keyResultAssignees.map(kra => ({
                id: kra.member.id,
                name: kra.member.name,
                avatarUrl: kra.member.avatarUrl,
            }))
        }))
    };
}


export async function getObjectives(): Promise<Objective[]> {
    const userId = await getUserId();
    const objectiveRecords = await db.query.objectives.findMany({
        where: eq(objectives.userId, userId),
        with: {
            keyResults: {
                with: {
                    initiatives: { with: { tasks: true } },
                    keyResultAssignees: { with: { member: true } }
                }
            }
        }
    });

    return objectiveRecords.map(obj => ({
        ...obj,
        teamId: String(obj.teamId),
        keyResults: obj.keyResults.map(kr => ({
            ...kr,
            assignees: kr.keyResultAssignees.map(kra => ({
                id: kra.member.id,
                name: kra.member.name,
                avatarUrl: kra.member.avatarUrl,
            }))
        }))
    }));
}


export async function saveObjective(data: ObjectiveFormData, objectiveId?: number): Promise<Objective> {
    const userId = await getUserId();

    const savedObjectiveId = await db.transaction(async (tx) => {
        let currentObjectiveId: number;

        if (objectiveId) {
            // UPDATE
            await tx.update(objectives)
                .set({ description: data.description, teamId: parseInt(data.teamId, 10) })
                .where(and(eq(objectives.id, objectiveId), eq(objectives.userId, userId)));
            currentObjectiveId = objectiveId;
        } else {
            // CREATE
            const [newObjective] = await tx.insert(objectives)
                .values({ description: data.description, userId, teamId: parseInt(data.teamId, 10) })
                .returning({ id: objectives.id });
            currentObjectiveId = newObjective.id;
        }

        const existingKeyResults = await tx.query.keyResults.findMany({
            where: eq(keyResults.objectiveId, currentObjectiveId),
            columns: { id: true }
        });
        const existingKrIds = existingKeyResults.map(kr => kr.id);
        const incomingKrIds = data.keyResults.filter(kr => kr.id).map(kr => kr.id as number);

        const krsToDelete = existingKrIds.filter(id => !incomingKrIds.includes(id));
        if (krsToDelete.length > 0) {
            await tx.delete(keyResults).where(inArray(keyResults.id, krsToDelete));
        }

        for (const krData of data.keyResults) {
            let currentKrId: number;
            const krRecord = {
                objectiveId: currentObjectiveId,
                description: krData.description,
                confidenceLevel: krData.confidenceLevel,
                progress: krData.progress || 0
            };

            if (krData.id && existingKrIds.includes(krData.id as number)) {
                await tx.update(keyResults).set(krRecord).where(eq(keyResults.id, krData.id as number));
                currentKrId = krData.id as number;
            } else {
                const [newKr] = await tx.insert(keyResults).values(krRecord).returning({ id: keyResults.id });
                currentKrId = newKr.id;
            }

            // Sync assignees
            await tx.delete(keyResultAssignees).where(eq(keyResultAssignees.keyResultId, currentKrId));
            if (krData.assignees && krData.assignees.length > 0) {
                await tx.insert(keyResultAssignees).values(krData.assignees.map(a => ({
                    keyResultId: currentKrId,
                    memberId: a.id as number
                })));
            }
            
            // Sync initiatives
            const existingInitiatives = await tx.query.initiatives.findMany({
                where: eq(initiatives.keyResultId, currentKrId),
                columns: { id: true }
            });
            const existingInitIds = existingInitiatives.map(i => i.id);
            const incomingInitIds = krData.initiatives.filter(i => i.id).map(i => i.id as number);
            const initsToDelete = existingInitIds.filter(id => !incomingInitIds.includes(id));

            if (initsToDelete.length > 0) {
                await tx.delete(initiatives).where(inArray(initiatives.id, initsToDelete));
            }
            
            for (const initiativeData of krData.initiatives) {
                let currentInitId: number;
                const initRecord = {
                    keyResultId: currentKrId,
                    description: initiativeData.description,
                    status: initiativeData.status
                };

                if (initiativeData.id && existingInitIds.includes(initiativeData.id as number)) {
                    await tx.update(initiatives).set(initRecord).where(eq(initiatives.id, initiativeData.id as number));
                    currentInitId = initiativeData.id as number;
                } else {
                    const [newInit] = await tx.insert(initiatives).values(initRecord).returning({ id: initiatives.id });
                    currentInitId = newInit.id;
                }

                // Sync tasks
                await tx.delete(tasks).where(eq(tasks.initiativeId, currentInitId));
                if (initiativeData.tasks && initiativeData.tasks.length > 0) {
                    await tx.insert(tasks).values(initiativeData.tasks.map(t => ({
                        initiativeId: currentInitId,
                        description: t.description,
                        completed: t.completed
                    })));
                }
            }
        }
        return currentObjectiveId;
    });

    revalidatePath('/objectives');
    revalidatePath('/dashboard');
    revalidatePath('/tasks');
    
    return getObjectiveById(savedObjectiveId);
}

export async function deleteObjective(objectiveId: number): Promise<void> {
    const userId = await getUserId();
    await db.delete(objectives).where(and(eq(objectives.id, objectiveId), eq(objectives.userId, userId)));
    revalidatePath('/objectives');
    revalidatePath('/dashboard');
    revalidatePath('/tasks');
}

export async function getTeams(): Promise<Team[]> {
    const userId = await getUserId();
    return db.query.teams.findMany({
        where: eq(teams.userId, userId),
        with: { members: true },
        orderBy: (teams, { asc }) => [asc(teams.createdAt)],
    });
}

export async function saveTeam(data: TeamFormData, teamId?: number): Promise<Team> {
    const userId = await getUserId();

    return db.transaction(async (tx) => {
        let currentTeamId: number;
        if (teamId) {
            await tx.update(teams)
                .set({ name: data.name })
                .where(and(eq(teams.id, teamId), eq(teams.userId, userId)));
            currentTeamId = teamId;
        } else {
            const [newTeam] = await tx.insert(teams).values({ name: data.name, userId }).returning();
            currentTeamId = newTeam.id;
        }

        await tx.delete(members).where(eq(members.teamId, currentTeamId));
        if (data.members && data.members.length > 0) {
            await tx.insert(members).values(data.members.map(m => ({
                teamId: currentTeamId,
                name: m.name,
                avatarUrl: m.avatarUrl || null,
            })));
        }
        
        const finalTeam = await tx.query.teams.findFirst({
            where: eq(teams.id, currentTeamId),
            with: { members: true }
        });

        if (!finalTeam) throw new Error("Failed to save or find team");
        
        revalidatePath('/teams');
        revalidatePath('/objectives');
        return finalTeam;
    });
}

export async function deleteTeam(teamId: number): Promise<{ success: boolean; message?: string }> {
    const userId = await getUserId();

    const assignedObjectivesCount = await db.select({ count: sql<number>`count(*)` }).from(objectives)
        .where(and(eq(objectives.teamId, teamId), eq(objectives.userId, userId)));
    
    if (assignedObjectivesCount[0].count > 0) {
        return { success: false, message: 'این تیم به یک یا چند هدف اختصاص داده شده و قابل حذف نیست.' };
    }

    await db.delete(teams).where(and(eq(teams.id, teamId), eq(teams.userId, userId)));
    revalidatePath('/teams');
    return { success: true };
}

export async function saveOkrCycle(data: OkrCycleFormData): Promise<void> {
    const userId = await getUserId();
    const existingCycle = await db.query.okrCycles.findFirst({ where: eq(okrCycles.userId, userId) });
    
    if (existingCycle) {
        await db.update(okrCycles).set(data).where(eq(okrCycles.userId, userId));
    } else {
        await db.insert(okrCycles).values({ ...data, userId });
    }
    revalidatePath('/objectives');
    revalidatePath('/dashboard');
    revalidatePath('/calendar');
}

export async function getOkrCycle(): Promise<OkrCycle | null> {
    const userId = await getUserId();
    const cycle = await db.query.okrCycles.findFirst({ where: eq(okrCycles.userId, userId) });
    if (!cycle) return null;
    return {
        startDate: new Date(cycle.startDate),
        endDate: new Date(cycle.endDate),
    };
}

export async function saveCalendarSettings(data: CalendarSettingsFormData): Promise<void> {
    const userId = await getUserId();
    const existingSettings = await db.query.calendarSettings.findFirst({ where: eq(calendarSettings.userId, userId) });
    
    const dataToSave = {
        ...data,
        evaluationDate: data.evaluationDate ? data.evaluationDate.toISOString().split('T')[0] : null
    };

    if (existingSettings) {
        await db.update(calendarSettingsTable).set(dataToSave).where(eq(calendarSettingsTable.userId, userId));
    } else {
        await db.insert(calendarSettingsTable).values({ ...dataToSave, userId });
    }
    revalidatePath('/calendar');
}

export async function getCalendarSettings(): Promise<CalendarSettings | null> {
    const userId = await getUserId();
    const settings = await db.query.calendarSettings.findFirst({ where: eq(calendarSettings.userId, userId) });

    if (!settings) return null;

    return {
        ...settings,
        evaluationDate: settings.evaluationDate ? new Date(settings.evaluationDate) : undefined
    };
}

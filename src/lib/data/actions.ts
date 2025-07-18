
'use server';

import { db } from '@/lib/db';
import { objectives, keyResults, initiatives, tasks, teams, members, users, okrCycles, calendarSettings as calendarSettingsTable } from '@/lib/db/schema';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { eq, and, sql, desc } from 'drizzle-orm';
import type { Objective, Team, OkrCycle, ObjectiveFormData, TeamFormData, OkrCycleFormData, KeyResult, CalendarSettings, CalendarSettingsFormData, Initiative } from '@/types/okr';
import { revalidatePath } from 'next/cache';

async function getUserId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Not authenticated');
    }
    return parseInt(session.user.id, 10);
}

export async function getObjectives(): Promise<Objective[]> {
    const userId = await getUserId();
    const objectiveRecords = await db.query.objectives.findMany({
        where: eq(objectives.userId, userId),
        with: {
            keyResults: {
                with: {
                    initiatives: {
                        with: {
                            tasks: true
                        }
                    },
                    keyResultAssignees: {
                        with: {
                            member: true,
                        }
                    }
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

    const savedObjective = await db.transaction(async (tx) => {
        let savedObjectiveId: number;
        
        if (objectiveId) {
            // UPDATE
            const [updatedObjective] = await tx.update(objectives)
                .set({ description: data.description, teamId: parseInt(data.teamId, 10) })
                .where(and(eq(objectives.id, objectiveId), eq(objectives.userId, userId)))
                .returning({ id: objectives.id });
            savedObjectiveId = updatedObjective.id;
        } else {
            // CREATE
            const [newObjective] = await tx.insert(objectives)
                .values({ description: data.description, userId, teamId: parseInt(data.teamId, 10) })
                .returning({ id: objectives.id });
            savedObjectiveId = newObjective.id;
        }

        const existingKeyResults = await tx.query.keyResults.findMany({
            where: eq(keyResults.objectiveId, savedObjectiveId),
            columns: { id: true }
        });
        const existingKrIds = new Set(existingKeyResults.map(kr => kr.id));
        const incomingKrIds = new Set(data.keyResults.filter(kr => kr.id).map(kr => kr.id));

        // Delete KRs that are no longer present
        const krsToDelete = Array.from(existingKrIds).filter(id => !incomingKrIds.has(id));
        if (krsToDelete.length > 0) {
            await tx.delete(keyResults).where(sql`${keyResults.id} IN ${krsToDelete}`);
        }

        // Upsert KRs
        for (const krData of data.keyResults) {
            let savedKrId: number;
            const krRecord = {
                objectiveId: savedObjectiveId,
                description: krData.description,
                confidenceLevel: krData.confidenceLevel,
                progress: krData.progress || 0
            };
            if (krData.id && existingKrIds.has(krData.id)) {
                // Update KR
                const [updatedKr] = await tx.update(keyResults).set(krRecord).where(eq(keyResults.id, krData.id)).returning({ id: keyResults.id });
                savedKrId = updatedKr.id;
            } else {
                // Insert KR
                const [newKr] = await tx.insert(keyResults).values(krRecord).returning({ id: keyResults.id });
                savedKrId = newKr.id;
            }
            
            // Handle assignees
            await tx.delete(keyResultAssignees).where(eq(keyResultAssignees.keyResultId, savedKrId));
            if (krData.assignees && krData.assignees.length > 0) {
                await tx.insert(keyResultAssignees).values(krData.assignees.map(assignee => ({
                    keyResultId: savedKrId,
                    memberId: typeof assignee.id === 'string' ? parseInt(assignee.id) : assignee.id as number
                })));
            }

            // Handle Initiatives
             const existingInitiatives = await tx.query.initiatives.findMany({
                where: eq(initiatives.keyResultId, savedKrId),
                columns: { id: true }
            });
            const existingInitiativeIds = new Set(existingInitiatives.map(i => i.id));
            const incomingInitiativeIds = new Set(krData.initiatives.filter(i => i.id).map(i => i.id));

            const initiativesToDelete = Array.from(existingInitiativeIds).filter(id => !incomingInitiativeIds.has(id));
            if(initiativesToDelete.length > 0){
                await tx.delete(initiatives).where(sql`${initiatives.id} IN ${initiativesToDelete}`);
            }

            for(const initiativeData of krData.initiatives){
                 let savedInitiativeId: number;
                 const initiativeRecord = {
                     keyResultId: savedKrId,
                     description: initiativeData.description,
                     status: initiativeData.status
                 };
                if(initiativeData.id && existingInitiativeIds.has(initiativeData.id)){
                    const [updatedInitiative] = await tx.update(initiatives).set(initiativeRecord).where(eq(initiatives.id, initiativeData.id)).returning({id: initiatives.id});
                    savedInitiativeId = updatedInitiative.id;
                } else {
                    const [newInitiative] = await tx.insert(initiatives).values(initiativeRecord).returning({id: initiatives.id});
                    savedInitiativeId = newInitiative.id;
                }

                // Handle tasks
                await tx.delete(tasks).where(eq(tasks.initiativeId, savedInitiativeId));
                if (initiativeData.tasks && initiativeData.tasks.length > 0) {
                   await tx.insert(tasks).values(initiativeData.tasks.map(taskData => ({
                       initiativeId: savedInitiativeId,
                       description: taskData.description,
                       completed: taskData.completed
                   })))
                }
            }
        }
        return savedObjectiveId;
    });

    revalidatePath('/objectives');
    revalidatePath('/dashboard');
    revalidatePath('/tasks');
    
    const finalObjective = await getObjectiveById(savedObjective);
    return finalObjective;
}

async function getObjectiveById(objectiveId: number): Promise<Objective> {
     const userId = await getUserId();
     const result = await db.query.objectives.findFirst({
        where: and(eq(objectives.id, objectiveId), eq(objectives.userId, userId)),
        with: {
            keyResults: {
                with: {
                    initiatives: {
                        with: {
                            tasks: true
                        }
                    },
                     keyResultAssignees: {
                        with: {
                            member: true,
                        }
                    }
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


export async function deleteObjective(objectiveId: number): Promise<void> {
    const userId = await getUserId();
    await db.delete(objectives).where(and(eq(objectives.id, objectiveId), eq(objectives.userId, userId)));
    revalidatePath('/objectives');
    revalidatePath('/dashboard');
    revalidatePath('/tasks');
}

export async function getTeams(): Promise<Team[]> {
    const userId = await getUserId();
    const teamRecords = await db.query.teams.findMany({
        where: eq(teams.userId, userId),
        with: {
            members: true
        }
    });
    return teamRecords;
}

export async function saveTeam(data: TeamFormData, teamId?: number): Promise<Team> {
    const userId = await getUserId();

    const savedTeam = await db.transaction(async (tx) => {
        if (teamId) {
            // Update existing team
            const [updatedTeam] = await tx.update(teams)
                .set({ name: data.name })
                .where(and(eq(teams.id, teamId), eq(teams.userId, userId)))
                .returning();
            
            // Delete old members and insert new ones
            await tx.delete(members).where(eq(members.teamId, teamId));
            const memberInsertions = data.members.filter(m=>m.name.trim()).map(m => ({ teamId, name: m.name, avatarUrl: m.avatarUrl || null }));
            const newMembers = memberInsertions.length > 0 ? await tx.insert(members).values(memberInsertions).returning() : [];
            
            return { ...updatedTeam, members: newMembers };
        } else {
            // Create new team
            const [newTeam] = await tx.insert(teams).values({ name: data.name, userId }).returning();
            const memberInsertions = data.members.filter(m=>m.name.trim()).map(m => ({ teamId: newTeam.id, name: m.name, avatarUrl: m.avatarUrl || null }));
            const newMembers = memberInsertions.length > 0 ? await tx.insert(members).values(memberInsertions).returning() : [];

            return { ...newTeam, members: newMembers };
        }
    });

    revalidatePath('/teams');
    revalidatePath('/objectives');
    return savedTeam;
}


export async function deleteTeam(teamId: number): Promise<{ success: boolean; message?: string }> {
    const userId = await getUserId();

    const assignedObjectives = await db.select({ count: sql<number>`count(*)` }).from(objectives)
        .where(and(eq(objectives.teamId, teamId), eq(objectives.userId, userId)));
    
    if (assignedObjectives[0].count > 0) {
        return { success: false, message: 'این تیم به یک یا چند هدف اختصاص داده شده و قابل حذف نیست.' };
    }

    await db.delete(teams).where(and(eq(teams.id, teamId), eq(teams.userId, userId)));
    revalidatePath('/teams');
    return { success: true };
}

export async function saveOkrCycle(data: OkrCycleFormData): Promise<void> {
    const userId = await getUserId();
    const [existingCycle] = await db.select().from(okrCycles).where(eq(okrCycles.userId, userId));
    
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
    const [cycle] = await db.select().from(okrCycles).where(eq(okrCycles.userId, userId)).limit(1);
    if (!cycle) return null;
    return {
        startDate: cycle.startDate,
        endDate: cycle.endDate,
    };
}


export async function saveCalendarSettings(data: CalendarSettingsFormData): Promise<void> {
    const userId = await getUserId();
    const [existingSettings] = await db.select().from(calendarSettingsTable).where(eq(calendarSettingsTable.userId, userId));
    
    if (existingSettings) {
        await db.update(calendarSettingsTable).set(data).where(eq(calendarSettingsTable.userId, userId));
    } else {
        await db.insert(calendarSettingsTable).values({ ...data, userId });
    }
    revalidatePath('/calendar');
}

export async function getCalendarSettings(): Promise<CalendarSettings | null> {
    const userId = await getUserId();
    const [settings] = await db.select().from(calendarSettingsTable).where(eq(calendarSettingsTable.userId, userId)).limit(1);
    return settings || null;
}

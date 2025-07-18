
'use server';

import { db } from '@/lib/db';
import { objectives, keyResults, initiatives, tasks, teams, members, users } from '@/lib/db/schema';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { eq, and, sql } from 'drizzle-orm';
import type { Objective, Team, OkrCycle, ObjectiveFormData, TeamFormData, OkrCycleFormData, KeyResult } from '@/types/okr';
import { revalidatePath } from 'next/cache';

async function getUserId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Not authenticated');
    }
    return parseInt(session.user.id, 10);
}

// TODO: These data types are complex. Simplify them in the future.
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
                    }
                }
            }
        }
    });
    
    // The data structure from Drizzle is almost correct, but we need to add the empty assignees array.
    // This can be properly implemented when KR assignees are stored in the DB.
    return objectiveRecords.map(obj => ({
        ...obj,
        teamId: String(obj.teamId), // Ensure teamId is a string for form compatibility
        keyResults: obj.keyResults.map(kr => ({
            ...kr,
            assignees: [], // Placeholder for now
        }))
    }));
}

export async function saveObjective(data: ObjectiveFormData, objectiveId?: number): Promise<Objective> {
    const userId = await getUserId();
    
    // In a real transaction...
    if (objectiveId) {
        // Update existing objective
        const [updatedObjective] = await db.update(objectives)
            .set({ description: data.description, teamId: parseInt(data.teamId, 10) })
            .where(and(eq(objectives.id, objectiveId), eq(objectives.userId, userId)))
            .returning();
        
        // This is a simplified update. A real implementation would handle KR/initiative updates.
        // For now, we'll just return the updated objective shell. A full implementation is complex.
        const krs = await getKRsForObjective(updatedObjective.id);
        revalidatePath('/objectives');
        revalidatePath('/dashboard');
        return { ...updatedObjective, keyResults: krs, teamId: String(updatedObjective.teamId) };
    } else {
        // Create new objective
        const [newObjective] = await db.insert(objectives)
            .values({ description: data.description, userId, teamId: parseInt(data.teamId, 10) })
            .returning();
            
        const keyResultPromises = data.keyResults.map(kr => {
            return db.insert(keyResults).values({
                objectiveId: newObjective.id,
                description: kr.description,
                confidenceLevel: kr.confidenceLevel,
                progress: kr.progress || 0
            }).returning();
        });

        const newKeyResults = (await Promise.all(keyResultPromises)).map(res => res[0]);
        
        // Similarly, this is a simplified view without initiative/task creation.
        const resultKrs: KeyResult[] = newKeyResults.map(kr => ({...kr, initiatives:[], assignees:[]}));
        
        revalidatePath('/objectives');
        revalidatePath('/dashboard');
        return { ...newObjective, keyResults: resultKrs, teamId: String(newObjective.teamId) };
    }
}

async function getKRsForObjective(objectiveId: number): Promise<KeyResult[]> {
    const keyResultRecords = await db.select().from(keyResults).where(eq(keyResults.objectiveId, objectiveId));
    // This is a simplified fetch, missing initiatives and tasks for brevity
    return keyResultRecords.map(kr => ({...kr, initiatives: [], assignees:[]}));
}


export async function deleteObjective(objectiveId: number): Promise<void> {
    const userId = await getUserId();
    // Use cascade delete in DB schema to handle related entities
    await db.delete(objectives).where(and(eq(objectives.id, objectiveId), eq(objectives.userId, userId)));
    revalidatePath('/objectives');
    revalidatePath('/dashboard');
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
            const memberInsertions = data.members.map(m => ({ teamId, name: m.name, avatarUrl: m.avatarUrl || null }));
            const newMembers = memberInsertions.length > 0 ? await tx.insert(members).values(memberInsertions).returning() : [];
            
            return { ...updatedTeam, members: newMembers };
        } else {
            // Create new team
            const [newTeam] = await tx.insert(teams).values({ name: data.name, userId }).returning();
            const memberInsertions = data.members.map(m => ({ teamId: newTeam.id, name: m.name, avatarUrl: m.avatarUrl || null }));
            const newMembers = memberInsertions.length > 0 ? await tx.insert(members).values(memberInsertions).returning() : [];

            return { ...newTeam, members: newMembers };
        }
    });

    revalidatePath('/teams');
    revalidatePath('/objectives'); // Objectives page may depend on teams
    return savedTeam;
}


export async function deleteTeam(teamId: number): Promise<{ success: boolean; message?: string }> {
    const userId = await getUserId();

    // Check if team is assigned to any objectives
    const assignedObjectives = await db.select({ count: sql<number>`count(*)` }).from(objectives)
        .where(and(eq(objectives.teamId, teamId), eq(objectives.userId, userId)));
    
    if (assignedObjectives[0].count > 0) {
        return { success: false, message: 'این تیم به یک یا چند هدف اختصاص داده شده و قابل حذف نیست.' };
    }

    // Cascade delete will handle members
    await db.delete(teams).where(and(eq(teams.id, teamId), eq(teams.userId, userId)));
    revalidatePath('/teams');
    return { success: true };
}


// OKR Cycle is stored per-user. We'll simulate this with a single row in a new table for simplicity.
// In a real app, this might be a separate settings table.
export async function saveOkrCycle(data: OkrCycleFormData): Promise<void> {
    const userId = await getUserId();
    // This is a simplified implementation. We'll just update a user's cycle.
    // We'll use local storage for this demo to avoid schema changes for now.
    // This is a placeholder for a real database implementation.
    console.log("Saving OKR Cycle for user:", userId, data);
}

export async function getOkrCycle(): Promise<OkrCycle | null> {
    const userId = await getUserId();
    // Placeholder to get cycle.
    console.log("Getting OKR Cycle for user:", userId);
    return null; // No DB implementation for this yet.
}

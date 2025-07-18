
'use server';

import { db } from '@/lib/db';
import { objectives, keyResults, initiatives, tasks, teams, members, users } from '@/lib/db/schema';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { eq, and } from 'drizzle-orm';
import type { Objective, Team, OkrCycle, ObjectiveFormData, TeamFormData, OkrCycleFormData, KeyResult } from '@/types/okr';

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
    const objectiveRecords = await db.select().from(objectives).where(eq(objectives.userId, userId));
    
    const results: Objective[] = [];
    for (const obj of objectiveRecords) {
        const keyResultRecords = await db.select().from(keyResults).where(eq(keyResults.objectiveId, obj.id));
        const krPromises = keyResultRecords.map(async (kr) => {
            const initiativeRecords = await db.select().from(initiatives).where(eq(initiatives.keyResultId, kr.id));
            const initPromises = initiativeRecords.map(async (init) => {
                const taskRecords = await db.select().from(tasks).where(eq(tasks.initiativeId, init.id));
                return { ...init, tasks: taskRecords };
            });
            const initiativesWithTasks = await Promise.all(initPromises);
            // This is a placeholder for assignees, as they are not yet stored per KR in the DB
            return { ...kr, initiatives: initiativesWithTasks, assignees: [] };
        });
        const krsWithDetails = await Promise.all(krPromises);
        results.push({ ...obj, keyResults: krsWithDetails, teamId: String(obj.teamId) }); // Assuming teamId is stored
    }
    return results;
}

export async function saveObjective(data: ObjectiveFormData, objectiveId?: number): Promise<Objective> {
    const userId = await getUserId();
    
    if (objectiveId) {
        // Update existing objective
        const [updatedObjective] = await db.update(objectives)
            .set({ description: data.description, teamId: parseInt(data.teamId) })
            .where(and(eq(objectives.id, objectiveId), eq(objectives.userId, userId)))
            .returning();
        
        // This is a simplified update. A real implementation would handle KR/initiative updates.
        // For now, we'll just return the updated objective shell. A full implementation is complex.
        const krs = await getKRsForObjective(updatedObjective.id);
        return { ...updatedObjective, keyResults: krs, teamId: String(updatedObjective.teamId) };
    } else {
        // Create new objective
        const [newObjective] = await db.insert(objectives)
            .values({ description: data.description, userId, teamId: parseInt(data.teamId) })
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
}

export async function getTeams(): Promise<Team[]> {
    const userId = await getUserId();
    const teamRecords = await db.select().from(teams).where(eq(teams.userId, userId));
    const results: Team[] = [];
    for (const team of teamRecords) {
        const memberRecords = await db.select().from(members).where(eq(members.teamId, team.id));
        results.push({ ...team, members: memberRecords });
    }
    return results;
}

export async function saveTeam(data: TeamFormData, teamId?: number): Promise<Team> {
    const userId = await getUserId();
    if (teamId) {
        const [updatedTeam] = await db.update(teams)
            .set({ name: data.name })
            .where(and(eq(teams.id, teamId), eq(teams.userId, userId)))
            .returning();
        // Simplified member update: delete old, insert new
        await db.delete(members).where(eq(members.teamId, teamId));
        const memberPromises = data.members.map(m => db.insert(members).values({ teamId, name: m.name, avatarUrl: m.avatarUrl }).returning());
        const newMembers = (await Promise.all(memberPromises)).map(res => res[0]);
        return { ...updatedTeam, members: newMembers };
    } else {
        const [newTeam] = await db.insert(teams).values({ name: data.name, userId }).returning();
        const memberPromises = data.members.map(m => db.insert(members).values({ teamId: newTeam.id, name: m.name, avatarUrl: m.avatarUrl }).returning());
        const newMembers = (await Promise.all(memberPromises)).map(res => res[0]);
        return { ...newTeam, members: newMembers };
    }
}

export async function deleteTeam(teamId: number): Promise<void> {
    const userId = await getUserId();
    // Cascade delete should handle members
    await db.delete(teams).where(and(eq(teams.id, teamId), eq(teams.userId, userId)));
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

import type { z } from 'zod';
import type { objectiveFormSchema, teamSchema, memberSchema, initiativeSchema, taskSchema, okrCycleFormSchema, calendarSettingsSchema, riskSchema } from '@/lib/schemas';
import { roleEnum } from '@/lib/db/schema';
import type { ConfidenceLevel, InitiativeStatus, RiskStatus } from './constants';

export type Role = z.infer<typeof roleEnum>;

export interface Member {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface Team {
  id: number;
  name: string;
  ownerId: string;
  invitationLink?: string | null;
  members: Member[];
}

export interface TeamWithMembership extends Team {
    role: Role;
}


export interface Task {
  id: string;
  description: string;
  completed: boolean;
}

export interface Initiative {
  id: number;
  description: string;
  status: InitiativeStatus;
  tasks: Task[];
}

export interface Risk {
    id: number;
    description: string;
    correctiveAction: string;
    status: RiskStatus;
}

export interface KeyResult {
  id: number;
  description: string;
  progress: number; // 0-100
  confidenceLevel: ConfidenceLevel;
  initiatives: Initiative[];
  risks: Risk[];
  assignees: Member[];
}

export interface Objective {
  id: number;
  description: string;
  keyResults: KeyResult[];
  teamId: number;
  cycleId: number;
}

export type ObjectiveFormData = z.infer<typeof objectiveFormSchema>;
export type TeamFormData = z.infer<typeof teamSchema>;
export type MemberFormData = z.infer<typeof memberSchema>;
export type InitiativeFormData = z.infer<typeof initiativeSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type RiskFormData = z.infer<typeof riskSchema>;

// Calendar specific types
export interface OkrCycle {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
}

export type OkrCycleFormData = z.infer<typeof okrCycleFormSchema>;

export interface CalendarSettings {
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  checkInDayOfWeek: number;
  evaluationDate?: Date;
}

export type CalendarSettingsFormData = z.infer<typeof calendarSettingsSchema>;


export interface ScheduledMeeting {
    id: string;
    date: Date;
    type: 'check-in' | 'evaluation';
    title: string;
    status: 'past' | 'today' | 'future';
}

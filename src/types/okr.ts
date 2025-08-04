
import type { z } from 'zod';
import type { objectiveFormSchema, teamSchema, memberSchema, initiativeSchema, taskSchema, okrCycleFormSchema, calendarSettingsSchema, riskSchema } from '@/lib/schemas';
import { roleEnum } from '@/lib/db/schema';
import type { ConfidenceLevel, InitiativeStatus, RiskStatus } from './constants';

export type Role = z.infer<typeof roleEnum>;

// DB-like types
export interface Member {
  id: number;
  teamId?: number;
  name: string;
<<<<<<< HEAD
  avatarUrl?: string | null;
=======
  avatarUrl: string | null;
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
}

export interface Team {
  id: number;
<<<<<<< HEAD
=======
  userId?: number;
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
  name: string;
  ownerId: string;
  invitationLink?: string | null;
  members: Member[];
  createdAt: Date;
}

export interface TeamWithMembership extends Team {
    role: Role;
}


export interface Task {
  id: number;
  initiativeId?: number;
  description: string;
  completed: boolean;
}

export interface Initiative {
  id: number;
<<<<<<< HEAD
=======
  keyResultId?: number;
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
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
<<<<<<< HEAD
=======
  objectiveId?: number;
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
  description: string;
  progress: number;
  confidenceLevel: ConfidenceLevel;
  initiatives: Initiative[];
  risks: Risk[];
  assignees: Member[];
}

export interface Objective {
  id: number;
<<<<<<< HEAD
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
=======
  userId?: number;
  description: string;
  keyResults: KeyResult[];
  teamId: string; // Keep as string for form compatibility, convert in actions
}

// Form data types
export type MemberFormData = z.infer<typeof memberSchema>;
export type TeamFormData = z.infer<typeof teamSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type InitiativeFormData = z.infer<typeof initiativeSchema>;
export type ObjectiveFormData = z.infer<typeof objectiveFormSchema>;


// Other types
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
export interface OkrCycle {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
}
<<<<<<< HEAD

export type OkrCycleFormData = z.infer<typeof okrCycleFormSchema>;
=======
export type OkrCycleFormData = z.infer<typeof okrCycleSchema>;
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719

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

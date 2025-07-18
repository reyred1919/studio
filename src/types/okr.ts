
import type { z } from 'zod';
import type { objectiveFormSchema, okrCycleSchema, calendarSettingsSchema, initiativeSchema, taskSchema, teamSchema, memberSchema } from '@/lib/schemas';
import type { ConfidenceLevel, InitiativeStatus, MeetingFrequencyValue, PersianWeekDayValue } from '@/lib/constants';

// DB-like types
export interface Member {
  id: number;
  teamId?: number;
  name: string;
  avatarUrl: string | null;
}

export interface Team {
  id: number;
  userId?: number;
  name: string;
  members: Member[];
  createdAt: Date;
}

export interface Task {
  id: number;
  initiativeId?: number;
  description: string;
  completed: boolean;
}

export interface Initiative {
  id: number;
  keyResultId?: number;
  description: string;
  status: InitiativeStatus;
  tasks: Task[];
}

export interface KeyResult {
  id: number;
  objectiveId?: number;
  description: string;
  progress: number;
  confidenceLevel: ConfidenceLevel;
  initiatives: Initiative[];
  assignees: Member[];
}

export interface Objective {
  id: number;
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
export interface OkrCycle {
  startDate: Date;
  endDate: Date;
}
export type OkrCycleFormData = z.infer<typeof okrCycleSchema>;


// Calendar specific types
export interface CalendarSettings {
  frequency: MeetingFrequencyValue;
  checkInDayOfWeek: PersianWeekDayValue;
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

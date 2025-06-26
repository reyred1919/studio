import type { z } from 'zod';
import type { objectiveFormSchema, okrCycleSchema, calendarSettingsSchema, initiativeSchema, taskSchema } from '@/lib/schemas';
import type { ConfidenceLevel, InitiativeStatus, MeetingFrequencyValue, PersianWeekDayValue } from '@/lib/constants';

export interface Task {
  id: string;
  description: string;
  completed: boolean;
}

export interface Initiative {
  id: string;
  description: string;
  status: InitiativeStatus;
  tasks: Task[];
}

export interface KeyResult {
  id: string;
  description: string;
  progress: number; // 0-100
  confidenceLevel: ConfidenceLevel;
  initiatives: Initiative[];
}

export interface Objective {
  id: string;
  description: string;
  keyResults: KeyResult[];
}

export interface OkrCycle {
  startDate: Date;
  endDate: Date;
}

export type ObjectiveFormData = z.infer<typeof objectiveFormSchema>;
export type OkrCycleFormData = z.infer<typeof okrCycleSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type InitiativeFormData = z.infer<typeof initiativeSchema>;


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

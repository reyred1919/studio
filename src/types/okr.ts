import type { z } from 'zod';
import type { objectiveFormSchema, okrCycleSchema, calendarSettingsSchema } from '@/lib/schemas';
import type { ConfidenceLevel, InitiativeStatus, MeetingFrequencyValue, PersianWeekDayValue } from '@/lib/constants';

export interface Initiative {
  id: string;
  description: string;
  status: InitiativeStatus;
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

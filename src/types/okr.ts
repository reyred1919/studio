import type { z } from 'zod';
import type { objectiveFormSchema } from '@/lib/schemas';
import type { ConfidenceLevel, InitiativeStatus } from '@/lib/constants';

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

export type ObjectiveFormData = z.infer<typeof objectiveFormSchema>;

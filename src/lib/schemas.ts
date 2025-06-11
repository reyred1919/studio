import { z } from 'zod';
import { CONFIDENCE_LEVELS, INITIATIVE_STATUSES, DEFAULT_KEY_RESULT } from './constants';

export const initiativeSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Initiative description is required").max(300, "Description too long"),
  status: z.enum(INITIATIVE_STATUSES),
});

export const keyResultSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Key Result description is required").max(300, "Description too long"),
  progress: z.number().min(0, "Progress must be between 0 and 100").max(100, "Progress must be between 0 and 100").default(0).optional(),
  confidenceLevel: z.enum(CONFIDENCE_LEVELS),
  initiatives: z.array(initiativeSchema).default([]),
});

export const objectiveFormSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Objective description is required").max(500, "Description too long"),
  keyResults: z.array(keyResultSchema)
    .min(1, "At least one Key Result is required")
    .default([DEFAULT_KEY_RESULT]),
});

export const checkInFormSchema = z.object({
  keyResults: z.array(z.object({
    id: z.string(),
    progress: z.number().min(0).max(100),
    confidenceLevel: z.enum(CONFIDENCE_LEVELS),
  }))
});

export type CheckInFormData = z.infer<typeof checkInFormSchema>;

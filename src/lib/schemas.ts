import { z } from 'zod';
import { CONFIDENCE_LEVELS, INITIATIVE_STATUSES, DEFAULT_KEY_RESULT } from './constants';

export const initiativeSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "شرح اقدام الزامی است").max(300, "شرح اقدام بیش از حد طولانی است"),
  status: z.enum(INITIATIVE_STATUSES),
});

export const keyResultSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "شرح نتیجه کلیدی الزامی است").max(300, "شرح نتیجه کلیدی بیش از حد طولانی است"),
  progress: z.number().min(0, "پیشرفت باید بین ۰ و ۱۰۰ باشد").max(100, "پیشرفت باید بین ۰ و ۱۰۰ باشد").default(0).optional(),
  confidenceLevel: z.enum(CONFIDENCE_LEVELS),
  initiatives: z.array(initiativeSchema).default([]),
});

export const objectiveFormSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "شرح هدف الزامی است").max(500, "شرح هدف بیش از حد طولانی است"),
  keyResults: z.array(keyResultSchema)
    .min(1, "حداقل یک نتیجه کلیدی الزامی است")
    .default([{...DEFAULT_KEY_RESULT, confidenceLevel: DEFAULT_KEY_RESULT.confidenceLevel || 'متوسط'}]),
});

export const checkInFormSchema = z.object({
  keyResults: z.array(z.object({
    id: z.string(),
    progress: z.number().min(0).max(100),
    confidenceLevel: z.enum(CONFIDENCE_LEVELS),
  }))
});

export type CheckInFormData = z.infer<typeof checkInFormSchema>;

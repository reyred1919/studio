import { z } from 'zod';
import { CONFIDENCE_LEVELS, INITIATIVE_STATUSES } from './constants';

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
    .min(2, "حداقل دو نتیجه کلیدی الزامی است")
    .max(5, "حداکثر پنج نتیجه کلیدی مجاز است"),
});

export const checkInFormSchema = z.object({
  keyResults: z.array(z.object({
    id: z.string(),
    progress: z.number().min(0).max(100),
    confidenceLevel: z.enum(CONFIDENCE_LEVELS),
  }))
});

export type CheckInFormData = z.infer<typeof checkInFormSchema>;

export const okrCycleSchema = z.object({
  startDate: z.date({ required_error: "تاریخ شروع الزامی است.", invalid_type_error: "تاریخ شروع نامعتبر است." }),
  endDate: z.date({ required_error: "تاریخ پایان الزامی است.", invalid_type_error: "تاریخ پایان نامعتبر است." }),
}).refine(data => data.endDate >= data.startDate, {
  message: "تاریخ پایان باید بعد یا مساوی تاریخ شروع باشد.",
  path: ["endDate"],
});

export type OkrCycleFormData = z.infer<typeof okrCycleSchema>;

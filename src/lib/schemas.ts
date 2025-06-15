import { z } from 'zod';
import { CONFIDENCE_LEVELS, INITIATIVE_STATUSES, MEETING_FREQUENCIES, PERSIAN_WEEK_DAYS } from './constants';

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

const meetingFrequencyValues = MEETING_FREQUENCIES.map(f => f.value) as [string, ...string[]];
// Create an array of string values for PERSIAN_WEEK_DAYS for z.enum
const persianWeekDayStringValues = PERSIAN_WEEK_DAYS.map(d => String(d.value)) as [string, ...string[]];


export const calendarSettingsSchema = z.object({
  frequency: z.enum(meetingFrequencyValues, {
    required_error: "فرکانس جلسات الزامی است.",
  }),
  checkInDayOfWeek: z.enum(persianWeekDayStringValues, { 
    required_error: "روز جلسات هفتگی الزامی است.",
    invalid_type_error: "روز انتخاب شده برای جلسات نامعتبر است." 
  }).transform(val => Number(val)), // Transform the validated string to a number
  evaluationDate: z.date({
    required_error: "تاریخ جلسه ارزیابی الزامی است.",
    invalid_type_error: "تاریخ جلسه ارزیابی نامعتبر است."
  }).optional(),
});

export type CalendarSettingsFormData = z.infer<typeof calendarSettingsSchema>;

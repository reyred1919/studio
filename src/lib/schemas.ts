
import { z } from 'zod';
import { CONFIDENCE_LEVELS, INITIATIVE_STATUSES, MEETING_FREQUENCIES, PERSIAN_WEEK_DAYS } from './constants';

export const memberSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, "نام عضو الزامی است.").max(100, "نام عضو بیش از حد طولانی است."),
  avatarUrl: z.string().url("آدرس آواتار نامعتبر است.").optional().or(z.literal('')),
});

export const teamSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "نام تیم الزامی است.").max(100, "نام تیم بیش از حد طولانی است."),
  members: z.array(memberSchema).min(1, "تیم باید حداقل یک عضو داشته باشد."),
});

export const taskSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, "شرح وظیفه الزامی است.").max(200, "شرح وظیفه بیش از حد طولانی است."),
  completed: z.boolean().default(false),
});

export const initiativeSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, "شرح اقدام الزامی است").max(300, "شرح اقدام بیش از حد طولانی است"),
  status: z.enum(INITIATIVE_STATUSES),
  tasks: z.array(taskSchema).default([]),
});

export const keyResultSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, "شرح نتیجه کلیدی الزامی است").max(300, "شرح نتیجه کلیدی بیش از حد طولانی است"),
  progress: z.number().min(0).max(100).default(0).optional(),
  confidenceLevel: z.enum(CONFIDENCE_LEVELS),
  initiatives: z.array(initiativeSchema).default([]),
  assignees: z.array(memberSchema).optional().default([]),
});

export const objectiveFormSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, "شرح هدف الزامی است").max(500, "شرح هدف بیش از حد طولانی است"),
  teamId: z.string({ required_error: "انتخاب تیم مسئول الزامی است." }).min(1, "انتخاب تیم مسئول الزامی است."),
  keyResults: z.array(keyResultSchema)
    .min(1, "حداقل یک نتیجه کلیدی الزامی است")
    .max(7, "حداکثر هفت نتیجه کلیدی مجاز است"),
});

export const checkInFormSchema = z.object({
  keyResults: z.array(z.object({
    id: z.number(),
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
const persianWeekDayValues = PERSIAN_WEEK_DAYS.map(d => d.value) as [number, ...number[]];


export const calendarSettingsSchema = z.object({
  frequency: z.enum(meetingFrequencyValues, {
    required_error: "فرکانس جلسات الزامی است.",
  }),
  checkInDayOfWeek: z.number({ 
    required_error: "روز جلسات هفتگی الزامی است.",
    invalid_type_error: "روز انتخاب شده برای جلسات نامعتبر است." 
  }).refine(val => persianWeekDayValues.includes(val)),
  evaluationDate: z.date({
    required_error: "تاریخ جلسه ارزیابی الزامی است.",
    invalid_type_error: "تاریخ جلسه ارزیابی نامعتبر است."
  }).optional(),
});

export type CalendarSettingsFormData = z.infer<typeof calendarSettingsSchema>;

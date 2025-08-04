
import { z } from 'zod';
import { CONFIDENCE_LEVELS, INITIATIVE_STATUSES, RISK_STATUSES } from './constants';
import { roleEnum } from './db/schema';

export const memberSchema = z.object({
<<<<<<< HEAD
  id: z.string(),
=======
  id: z.union([z.string(), z.number()]).optional(),
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
  name: z.string().min(1, "نام عضو الزامی است.").max(100, "نام عضو بیش از حد طولانی است."),
  avatarUrl: z.string().url("آدرس آواتار نامعتبر است.").optional().or(z.literal('')),
});

export const teamSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "نام تیم الزامی است.").max(100, "نام تیم بیش از حد طولانی است."),
  ownerId: z.string().optional(),
  invitationLink: z.string().url().optional().nullable(),
  members: z.array(memberSchema).optional().default([]),
});

export const taskSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, "شرح وظیفه الزامی است.").max(200, "شرح وظیفه بیش از حد طولانی است."),
  completed: z.boolean().default(false),
});

export const initiativeSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, "شرح اقدام الزامی است").max(300, "شرح اقدام بیش از حد طولانی است"),
  status: z.enum(INITIATIVE_STATUSES, { required_error: "وضعیت اقدام الزامی است." }),
  tasks: z.array(taskSchema).default([]),
});

export const riskSchema = z.object({
    id: z.number().optional(),
    description: z.string().min(1, "شرح ریسک الزامی است.").max(300, "شرح ریسک بیش از حد طولانی است."),
    correctiveAction: z.string().min(1, "اقدام اصلاحی الزامی است.").max(300, "شرح اقدام اصلاحی بیش از حد طولانی است."),
    status: z.enum(RISK_STATUSES, { required_error: "وضعیت ریسک الزامی است." }),
});

export const keyResultSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, "شرح نتیجه کلیدی الزامی است").max(300, "شرح نتیجه کلیدی بیش از حد طولانی است"),
<<<<<<< HEAD
  progress: z.number().min(0, "پیشرفت باید بین ۰ و ۱۰۰ باشد").max(100, "پیشرفت باید بین ۰ و ۱۰۰ باشد").default(0).optional(),
  confidenceLevel: z.enum(CONFIDENCE_LEVELS, { required_error: "سطح اطمینان الزامی است." }),
=======
  progress: z.number().min(0).max(100).default(0).optional(),
  confidenceLevel: z.enum(CONFIDENCE_LEVELS),
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
  initiatives: z.array(initiativeSchema).default([]),
  risks: z.array(riskSchema).default([]),
  assignees: z.array(memberSchema).optional().default([]),
});

export const objectiveFormSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, "شرح هدف الزامی است").max(500, "شرح هدف بیش از حد طولانی است"),
  teamId: z.coerce.number({ required_error: "انتخاب تیم مسئول الزامی است.", invalid_type_error: "تیم نامعتبر است." }),
  cycleId: z.number(),
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

export const okrCycleFormSchema = z.object({
    activeCycleId: z.coerce.number({ required_error: "انتخاب چرخه الزامی است." }),
});

<<<<<<< HEAD
export type OkrCycleFormData = z.infer<typeof okrCycleFormSchema>;

export const calendarSettingsSchema = z.object({
    frequency: z.enum(['weekly', 'bi-weekly', 'monthly'], { required_error: "فرکانس جلسات الزامی است." }),
    checkInDayOfWeek: z.coerce.number().min(0).max(6, "روز هفته نامعتبر است."),
    evaluationDate: z.date({ required_error: "تاریخ ارزیابی الزامی است." }).optional(),
=======
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
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
});


import { z } from 'zod';
import { CONFIDENCE_LEVELS, INITIATIVE_STATUSES, MEETING_FREQUENCIES } from './constants';
import { roleEnum } from './db/schema';

export const memberSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "نام عضو الزامی است.").max(100, "نام عضو بیش از حد طولانی است."),
  avatarUrl: z.string().url("آدرس آواتار نامعتبر است.").optional().or(z.literal('')),
});

export const teamSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "نام تیم الزامی است.").max(100, "نام تیم بیش از حد طولانی است."),
  ownerId: z.string().optional(),
  invitationLink: z.string().url().optional().nullable(),
  members: z.array(memberSchema).optional().default([]), // Members are handled by join table now
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

export const keyResultSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, "شرح نتیجه کلیدی الزامی است").max(300, "شرح نتیجه کلیدی بیش از حد طولانی است"),
  progress: z.number().min(0, "پیشرفت باید بین ۰ و ۱۰۰ باشد").max(100, "پیشرفت باید بین ۰ و ۱۰۰ باشد").default(0).optional(),
  confidenceLevel: z.enum(CONFIDENCE_LEVELS, { required_error: "سطح اطمینان الزامی است." }),
  initiatives: z.array(initiativeSchema).default([]),
  assignees: z.array(memberSchema).optional().default([]),
});

export const objectiveFormSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, "شرح هدف الزامی است").max(500, "شرح هدف بیش از حد طولانی است"),
  teamId: z.number({ required_error: "انتخاب تیم مسئول الزامی است." }),
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
    startDate: z.date({ required_error: "تاریخ شروع الزامی است." }),
    endDate: z.date({ required_error: "تاریخ پایان الزامی است." }),
}).refine(data => data.endDate > data.startDate, {
    message: "تاریخ پایان باید بعد از تاریخ شروع باشد.",
    path: ["root"], // You can also use "endDate" to show it under that field
});

const meetingFrequencies = MEETING_FREQUENCIES.map(f => f.value) as [string, ...string[]];

export const calendarSettingsSchema = z.object({
    frequency: z.enum(meetingFrequencies, { required_error: "فرکانس جلسات الزامی است." }),
    checkInDayOfWeek: z.coerce.number().min(0).max(6, "روز هفته نامعتبر است."),
    evaluationDate: z.date({ required_error: "تاریخ ارزیابی الزامی است." }).optional(),
});

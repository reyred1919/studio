export const CONFIDENCE_LEVELS = ['زیاد', 'متوسط', 'کم', 'در معرض خطر'] as const;
export type ConfidenceLevel = typeof CONFIDENCE_LEVELS[number];

export const INITIATIVE_STATUSES = ['شروع نشده', 'در حال انجام', 'تکمیل شده', 'مسدود شده'] as const;
export type InitiativeStatus = typeof INITIATIVE_STATUSES[number];

export const DEFAULT_KEY_RESULT = { 
  description: '', 
  progress: 0, 
  confidenceLevel: 'متوسط' as ConfidenceLevel, 
  initiatives: [] 
};

export const MEETING_FREQUENCIES = [
  { label: 'هفتگی', value: 'weekly' },
  { label: 'دو هفته یکبار', value: 'bi-weekly' },
  { label: 'ماهی یکبار', value: 'monthly' },
] as const;
export type MeetingFrequencyValue = typeof MEETING_FREQUENCIES[number]['value'];

export const PERSIAN_WEEK_DAYS = [
  { label: 'شنبه', value: 6 },     // Corresponds to getDay() === 6 for Saturday
  { label: 'یکشنبه', value: 0 },   // Corresponds to getDay() === 0 for Sunday
  { label: 'دوشنبه', value: 1 },   // Corresponds to getDay() === 1 for Monday
  { label: 'سه‌شنبه', value: 2 },  // Corresponds to getDay() === 2 for Tuesday
  { label: 'چهارشنبه', value: 3 }, // Corresponds to getDay() === 3 for Wednesday
  { label: 'پنج‌شنبه', value: 4 }, // Corresponds to getDay() === 4 for Thursday
  // جمعه معمولاً روز جلسه نیست
] as const;
export type PersianWeekDayValue = typeof PERSIAN_WEEK_DAYS[number]['value'];

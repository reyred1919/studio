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

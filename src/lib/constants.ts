export const CONFIDENCE_LEVELS = ['High', 'Medium', 'Low', 'At Risk'] as const;
export type ConfidenceLevel = typeof CONFIDENCE_LEVELS[number];

export const INITIATIVE_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Blocked'] as const;
export type InitiativeStatus = typeof INITIATIVE_STATUSES[number];

export const DEFAULT_KEY_RESULT = { 
  description: '', 
  progress: 0, 
  confidenceLevel: 'Medium' as ConfidenceLevel, 
  initiatives: [] 
};

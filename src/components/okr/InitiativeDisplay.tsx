import type { Initiative } from '@/types/okr';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import type { InitiativeStatus } from '@/lib/constants';

interface InitiativeDisplayProps {
  initiative: Initiative;
}

const statusStyles: Record<InitiativeStatus, string> = {
  'Not Started': 'bg-gray-100 text-gray-600 border-gray-300',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-300',
  'Completed': 'bg-green-100 text-green-700 border-green-300',
  'Blocked': 'bg-red-100 text-red-700 border-red-300',
};


export function InitiativeDisplay({ initiative }: InitiativeDisplayProps) {
  const badgeClass = statusStyles[initiative.status] || statusStyles['Not Started'];
  return (
    <div className="flex items-center justify-between p-2.5 bg-background rounded-md border">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        <p className="text-sm text-foreground">{initiative.description}</p>
      </div>
      <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 ${badgeClass}`}>{initiative.status}</Badge>
    </div>
  );
}

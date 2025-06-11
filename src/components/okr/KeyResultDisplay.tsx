import type { KeyResult } from '@/types/okr';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { InitiativeDisplay } from './InitiativeDisplay';
import { ListChecks, Zap, Smile, Meh, Frown, AlertTriangle, ChevronDown } from 'lucide-react';
import type { ConfidenceLevel } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface KeyResultDisplayProps {
  keyResult: KeyResult;
}

const confidenceMeta: Record<ConfidenceLevel, { icon: React.ElementType, indicatorClass: string, textClass: string, label: string }> = {
  'زیاد': { icon: Smile, indicatorClass: 'bg-green-500', textClass: 'text-green-600', label: 'زیاد' },
  'متوسط': { icon: Meh, indicatorClass: 'bg-yellow-500', textClass: 'text-yellow-600', label: 'متوسط' },
  'کم': { icon: Frown, indicatorClass: 'bg-orange-500', textClass: 'text-orange-600', label: 'کم' },
  'در معرض خطر': { icon: AlertTriangle, indicatorClass: 'bg-red-500', textClass: 'text-red-600', label: 'در معرض خطر' },
};

export function KeyResultDisplay({ keyResult }: KeyResultDisplayProps) {
  const confidence = confidenceMeta[keyResult.confidenceLevel];
  const ConfidenceIcon = confidence.icon;

  return (
    <Card className="mb-0 shadow-none border-none_ bg-transparent_">
      <CardHeader className="pb-2 pt-1 px-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary flex-shrink-0" />
            <CardTitle className="text-base font-medium text-foreground">{keyResult.description}</CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
             <ConfidenceIcon className={`w-5 h-5 ${confidence.textClass}`} />
            <Badge variant="outline" className={`text-xs ${confidence.textClass} border-current`}>{confidence.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 px-1">
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>پیشرفت</span>
            <span>{keyResult.progress}%</span>
          </div>
          <Progress value={keyResult.progress} className="h-2.5 rounded-full" indicatorClassName={`${confidence.indicatorClass} rounded-full`} />
        </div>
        
        {keyResult.initiatives.length > 0 && (
          <Accordion type="single" collapsible className="w-full -mx-1">
            <AccordionItem value="initiatives" className="border-none">
              <AccordionTrigger className="text-xs font-medium py-1.5 px-1 hover:no-underline hover:bg-secondary/50 rounded-md [&[data-state=open]>svg]:text-accent">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                  {keyResult.initiatives.length} اقدام
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-0 pl-1 pr-1">
                <div className="space-y-1.5">
                  {keyResult.initiatives.map(initiative => (
                    <InitiativeDisplay key={initiative.id} initiative={initiative} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

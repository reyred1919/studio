import type { Objective } from '@/types/okr';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyResultDisplay } from './KeyResultDisplay';
import { Target, Edit3, CalendarCheck2, ChevronDown, ChevronUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import React from 'react';

interface ObjectiveCardProps {
  objective: Objective;
  onEdit: (objective: Objective) => void;
  onCheckIn: (objective: Objective) => void;
}

export function ObjectiveCard({ objective, onEdit, onCheckIn }: ObjectiveCardProps) {
  const [openKeyResult, setOpenKeyResult] = React.useState<string | undefined>(objective.keyResults.length > 0 ? `kr-0` : undefined);
  
  return (
    <Card className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden">
      <CardHeader className="bg-card_ p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-grow min-w-0">
            <Target className="w-10 h-10 text-primary flex-shrink-0" />
            <div className="flex-grow min-w-0">
              <CardTitle className="text-xl font-headline font-semibold text-primary break-words">{objective.description}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                {objective.keyResults.length} Key Result(s)
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-col sm:flex-row">
            <Button variant="outline" size="sm" onClick={() => onEdit(objective)} className="w-full sm:w-auto">
              <Edit3 className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button variant="default" size="sm" onClick={() => onCheckIn(objective)} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
              <CalendarCheck2 className="w-4 h-4 mr-2" /> Check-In
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 bg-background/50_">
        {objective.keyResults.length > 0 ? (
           <Accordion type="single" collapsible className="w-full space-y-3" value={openKeyResult} onValueChange={setOpenKeyResult}>
            {objective.keyResults.map((kr, index) => (
              <AccordionItem value={`kr-${index}`} key={kr.id} className="border bg-card rounded-lg shadow-sm overflow-hidden">
                <AccordionTrigger className="p-4 hover:no-underline focus:no-underline hover:bg-secondary/30 data-[state=open]:bg-secondary/30">
                  <div className="flex justify-between items-center w-full">
                    <span className="font-medium text-left text-foreground text-sm sm:text-base flex-grow break-words pr-2">{kr.description}</span>
                    <div className="flex items-center flex-shrink-0">
                      <span className="text-sm text-muted-foreground mr-2">{kr.progress}%</span>
                      <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 accordion-chevron" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 border-t bg-card_">
                   <KeyResultDisplay keyResult={kr} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-md">
            No key results defined for this objective yet. Click 'Edit' to add some.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

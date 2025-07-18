
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import type { Objective, Initiative, Task, ObjectiveFormData } from '@/types/okr';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ListChecks, GanttChartSquare, Settings, AlertCircle, Loader2 } from 'lucide-react';
import type { InitiativeStatus } from '@/lib/constants';
import { getObjectives, saveObjective } from '@/lib/data/actions';
import { useToast } from '@/hooks/use-toast';

const ManageInitiativeDialog = dynamic(() => import('@/components/tasks/ManageInitiativeDialog').then(mod => mod.ManageInitiativeDialog), {
  loading: () => <p>در حال بارگذاری...</p>,
});

const statusStyles: Record<InitiativeStatus, string> = {
  'شروع نشده': 'bg-gray-100 text-gray-600 border-gray-300',
  'در حال انجام': 'bg-blue-100 text-blue-700 border-blue-300',
  'تکمیل شده': 'bg-green-100 text-green-700 border-green-300',
  'مسدود شده': 'bg-red-100 text-red-700 border-red-300',
};

// Represents a flattened initiative for easy rendering
interface InitiativeViewModel {
  initiative: Initiative;
  objectiveId: number;
  objectiveDescription: string;
  keyResultId: number;
  keyResultDescription: string;
  shortCode: string;
}

export function TasksView() {
  const { data: session, status } = useSession();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingInitiative, setEditingInitiative] = useState<InitiativeViewModel | null>(null);
  const [isManageInitiativeDialogOpen, setIsManageInitiativeDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'authenticated') {
        setIsLoading(true);
        getObjectives()
            .then(setObjectives)
            .catch(() => toast({ variant: "destructive", title: "خطا در بارگذاری داده‌ها" }))
            .finally(() => setIsLoading(false));
    }
     if (status === 'unauthenticated') {
        setIsLoading(false);
    }
  }, [status, toast]);


  const initiativeViewModels = useMemo((): InitiativeViewModel[] => {
    const flatList: InitiativeViewModel[] = [];
    objectives.forEach((obj, objIndex) => {
      obj.keyResults.forEach((kr, krIndex) => {
        kr.initiatives.forEach(init => {
          flatList.push({
            initiative: init,
            objectiveId: obj.id,
            objectiveDescription: obj.description,
            keyResultId: kr.id,
            keyResultDescription: kr.description,
            shortCode: `O${objIndex + 1}-KR${krIndex + 1}`,
          });
        });
      });
    });
    return flatList;
  }, [objectives]);

  const handleManageClick = (model: InitiativeViewModel) => {
    setEditingInitiative(model);
    setIsManageInitiativeDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingInitiative(null);
    setIsManageInitiativeDialogOpen(false);
  };

  const handleSaveInitiative = useCallback(async (updatedInitiative: Initiative) => {
    if (!editingInitiative) return;

    const { objectiveId, keyResultId } = editingInitiative;
    const originalObjective = objectives.find(o => o.id === objectiveId);
    if (!originalObjective) return;

    // 1. Recalculate progress and status for the initiative being saved
    const finalInitiative = { ...updatedInitiative };
    if (finalInitiative.status !== 'مسدود شده') {
      const totalTasks = finalInitiative.tasks.length;
      const completedTasks = finalInitiative.tasks.filter(t => t.completed).length;
      
      if (completedTasks === totalTasks && totalTasks > 0) finalInitiative.status = 'تکمیل شده';
      else if (completedTasks > 0) finalInitiative.status = 'در حال انجام';
      else finalInitiative.status = 'شروع نشده';
    }

    // 2. Create the new objectives array with updated KR progress
    const newKeyResults = originalObjective.keyResults.map(kr => {
      if (kr.id !== keyResultId) return kr;
      
      const initiativesForKr = kr.initiatives.map(init =>
        init.id === finalInitiative.id ? finalInitiative : init
      );

      let avgKrProgress = 0;
      if (initiativesForKr.length > 0) {
        const totalInitiativeProgress = initiativesForKr.reduce((sum, init) => {
          const iTotalTasks = init.tasks.length;
          const iCompletedTasks = init.tasks.filter(t => t.completed).length;
          const iProgress = iTotalTasks > 0 ? (iCompletedTasks / iTotalTasks) * 100 : 0;
          return sum + iProgress;
        }, 0);
        avgKrProgress = totalInitiativeProgress / initiativesForKr.length;
      }

      return { ...kr, progress: Math.round(avgKrProgress), initiatives: initiativesForKr };
    });
    
    const updatedObjective = { ...originalObjective, keyResults: newKeyResults };

    // 3. Save the entire updated objective to the backend
    try {
        const objectiveToSave: ObjectiveFormData = {
            ...updatedObjective,
            teamId: String(updatedObjective.teamId), 
            keyResults: updatedObjective.keyResults.map(kr => ({
                ...kr,
                initiatives: kr.initiatives.map(i => ({...i, tasks: i.tasks || []})),
                assignees: kr.assignees || [], 
            })),
        };
        const savedObjective = await saveObjective(objectiveToSave, objectiveId);
        setObjectives(prev => prev.map(obj => obj.id === savedObjective.id ? savedObjective : obj));
        toast({ title: "اقدام به‌روزرسانی شد" });
    } catch(e) {
        toast({ variant: 'destructive', title: "خطا در ذخیره اقدام" });
    } finally {
        handleCloseDialog();
    }
  }, [editingInitiative, objectives, toast]);


  if (isLoading || status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-16 h-16 text-primary mb-6 animate-spin" />
        <h1 className="text-2xl font-semibold text-muted-foreground">در حال بارگذاری وظایف...</h1>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold font-headline text-foreground flex items-center gap-2">
            <ListChecks className="w-7 h-7 text-primary"/>
            مدیریت وظایف و اقدامات
        </h1>
      </div>
      
      {initiativeViewModels.length === 0 ? (
        <Card className="mt-8 text-center py-12">
            <CardHeader>
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
                <CardTitle>هیچ اقدامی یافت نشد</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    برای شروع، لطفاً از صفحه مدیریت اهداف، برای نتایج کلیدی خود اقدام تعریف کنید.
                </p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {initiativeViewModels.map(model => {
            const totalTasks = model.initiative.tasks.length;
            const completedTasks = model.initiative.tasks.filter(t => t.completed).length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const badgeClass = statusStyles[model.initiative.status] || statusStyles['شروع نشده'];

            return (
              <Card key={model.initiative.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-medium text-foreground pr-2 break-words">
                      {model.initiative.description}
                    </CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary" className="text-xs whitespace-nowrap cursor-help">{model.shortCode}</Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">هدف:</span> {model.objectiveDescription}
                            <br/>
                            <span className="font-semibold text-foreground">نتیجه کلیدی:</span> {model.keyResultDescription}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-muted-foreground">پیشرفت وظایف</span>
                            <span className="text-sm font-semibold">{completedTasks} / {totalTasks}</span>
                        </div>
                        <Progress value={progress} className="h-2.5 rounded-full" />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-muted/50 p-3 mt-4">
                  <Badge variant="outline" className={`text-xs font-medium px-2 py-1 ${badgeClass}`}>
                    {model.initiative.status}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => handleManageClick(model)}>
                    <Settings className="w-4 h-4 ml-2" />
                    مدیریت
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {isManageInitiativeDialogOpen && editingInitiative && (
        <ManageInitiativeDialog
          isOpen={isManageInitiativeDialogOpen}
          onClose={handleCloseDialog}
          initiative={editingInitiative.initiative}
          onSave={handleSaveInitiative}
        />
      )}
    </>
  );
}


'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Objective, Initiative, Task } from '@/types/okr';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ListChecks, GanttChartSquare, Settings, AlertCircle } from 'lucide-react';
import { ManageInitiativeDialog } from '@/components/tasks/ManageInitiativeDialog';
import type { InitiativeStatus } from '@/lib/constants';

const statusStyles: Record<InitiativeStatus, string> = {
  'شروع نشده': 'bg-gray-100 text-gray-600 border-gray-300',
  'در حال انجام': 'bg-blue-100 text-blue-700 border-blue-300',
  'تکمیل شده': 'bg-green-100 text-green-700 border-green-300',
  'مسدود شده': 'bg-red-100 text-red-700 border-red-300',
};

// Represents a flattened initiative for easy rendering
interface InitiativeViewModel {
  initiative: Initiative;
  objectiveId: string;
  keyResultId: string;
  shortCode: string;
}

const initialObjectivesData: Objective[] = [];

export default function TasksPage() {
  const [objectives, setObjectives] = useState<Objective[]>(initialObjectivesData);
  const [isMounted, setIsMounted] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<InitiativeViewModel | null>(null);
  const [isManageInitiativeDialogOpen, setIsManageInitiativeDialogOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    let loadedObjectives: Objective[] = [];
    const storedObjectives = localStorage.getItem('okrTrackerData_objectives_fa');
    if (storedObjectives) {
      try {
        const parsedObjectives = JSON.parse(storedObjectives);
        if (Array.isArray(parsedObjectives) && parsedObjectives.every(obj => obj.id && obj.description)) {
          loadedObjectives = parsedObjectives;
        }
      } catch (error) {
        console.error("Failed to parse objectives from localStorage", error);
      }
    }
    
    // Data migration: ensure all initiatives have a tasks array
    const objectivesWithTasks = loadedObjectives.map(obj => ({
      ...obj,
      keyResults: obj.keyResults.map(kr => ({
        ...kr,
        initiatives: kr.initiatives.map(init => ({
          ...init,
          tasks: init.tasks || [],
        })),
      })),
    }));
    setObjectives(objectivesWithTasks);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('okrTrackerData_objectives_fa', JSON.stringify(objectives));
    }
  }, [objectives, isMounted]);

  const initiativeViewModels = useMemo((): InitiativeViewModel[] => {
    const flatList: InitiativeViewModel[] = [];
    objectives.forEach((obj, objIndex) => {
      obj.keyResults.forEach((kr, krIndex) => {
        kr.initiatives.forEach(init => {
          flatList.push({
            initiative: init,
            objectiveId: obj.id,
            keyResultId: kr.id,
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

  const handleSaveInitiative = useCallback((updatedInitiative: Initiative) => {
    if (!editingInitiative) return;

    const { objectiveId, keyResultId } = editingInitiative;

    // 1. Recalculate progress and status for the initiative being saved
    const totalTasks = updatedInitiative.tasks.length;
    const completedTasks = updatedInitiative.tasks.filter(t => t.completed).length;
    const initiativeProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const finalInitiative = { ...updatedInitiative };

    // Update status based on progress, but don't override 'Blocked'
    if (finalInitiative.status !== 'مسدود شده') {
      if (initiativeProgress === 100) {
        finalInitiative.status = 'تکمیل شده';
      } else if (initiativeProgress > 0) {
        finalInitiative.status = 'در حال انجام';
      } else {
        finalInitiative.status = 'شروع نشده';
      }
    }

    // 2. Create the new objectives array with updated KR progress
    const newObjectives = objectives.map(obj => {
      if (obj.id !== objectiveId) {
        return obj;
      }

      // This is the target objective, find the KR and update it
      const newKeyResults = obj.keyResults.map(kr => {
        if (kr.id !== keyResultId) {
          return kr;
        }

        // This is the target KR. Recalculate its progress.
        const initiativesForKr = kr.initiatives.map(init =>
          init.id === finalInitiative.id ? finalInitiative : init
        );

        if (initiativesForKr.length === 0) {
          return {
            ...kr,
            progress: 0,
            initiatives: initiativesForKr,
          };
        }

        const totalInitiativeProgress = initiativesForKr.reduce((sum, init) => {
          const iTotalTasks = init.tasks.length;
          const iCompletedTasks = init.tasks.filter(t => t.completed).length;
          const iProgress = iTotalTasks > 0 ? (iCompletedTasks / iTotalTasks) * 100 : 0;
          return sum + iProgress;
        }, 0);

        const avgKrProgress = totalInitiativeProgress / initiativesForKr.length;

        return {
          ...kr,
          progress: Math.round(avgKrProgress), // round to nearest integer
          initiatives: initiativesForKr,
        };
      });

      return {
        ...obj,
        keyResults: newKeyResults,
      };
    });

    setObjectives(newObjectives);
    handleCloseDialog();
  }, [editingInitiative, objectives]);


  if (!isMounted) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <GanttChartSquare className="w-16 h-16 text-primary mb-6 animate-pulse" />
          <h1 className="text-2xl font-semibold text-muted-foreground">در حال بارگذاری وظایف...</h1>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
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
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            const badgeClass = statusStyles[model.initiative.status] || statusStyles['شروع نشده'];

            return (
              <Card key={model.initiative.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-medium text-foreground pr-2 break-words">
                      {model.initiative.description}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">{model.shortCode}</Badge>
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

      {editingInitiative && (
        <ManageInitiativeDialog
          isOpen={isManageInitiativeDialogOpen}
          onClose={handleCloseDialog}
          initiative={editingInitiative.initiative}
          onSave={handleSaveInitiative}
        />
      )}
    </PageContainer>
  );
}

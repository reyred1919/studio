
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Objective, ObjectiveFormData, OkrCycle, OkrCycleFormData } from '@/types/okr';
import { ObjectiveCard } from '@/components/okr/ObjectiveCard';
import { EmptyState } from '@/components/okr/EmptyState';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Plus, Settings2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ManageObjectiveDialog = dynamic(() => import('@/components/okr/ManageObjectiveDialog').then(mod => mod.ManageObjectiveDialog), {
  loading: () => <p>در حال بارگذاری...</p>,
});
const CheckInModal = dynamic(() => import('@/components/okr/CheckInModal').then(mod => mod.CheckInModal), {
  loading: () => <p>در حال بارگذاری...</p>,
});
const ManageOkrCycleDialog = dynamic(() => import('@/components/okr/ManageOkrCycleDialog').then(mod => mod.ManageOkrCycleDialog), {
  loading: () => <p>در حال بارگذاری...</p>,
});


const generateId = () => crypto.randomUUID();

export default function OkrDashboardClient() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [isManageObjectiveDialogOpen, setIsManageObjectiveDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [currentObjectiveForCheckIn, setCurrentObjectiveForCheckIn] = useState<Objective | null>(null);
  const [okrCycle, setOkrCycle] = useState<OkrCycle | null>(null);
  const [isManageCycleDialogOpen, setIsManageCycleDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);


  useEffect(() => {
    let loadedObjectives: Objective[] = [];
    const storedObjectives = localStorage.getItem('okrTrackerData_objectives_fa');
    if (storedObjectives) {
      try {
        const parsedObjectives = JSON.parse(storedObjectives);
        if (Array.isArray(parsedObjectives) && parsedObjectives.every(obj => obj.id && obj.description)) {
           loadedObjectives = parsedObjectives;
        }
      } catch (error) {
        console.error("Failed to parse Persian objectives from localStorage", error);
      }
    }
    
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

    const storedCycle = localStorage.getItem('okrTrackerData_cycle_fa');
    if (storedCycle) {
      try {
        const parsedCycle = JSON.parse(storedCycle) as { startDate: string; endDate: string };
        if (parsedCycle.startDate && parsedCycle.endDate) {
          setOkrCycle({
            startDate: new Date(parsedCycle.startDate),
            endDate: new Date(parsedCycle.endDate),
          });
        }
      } catch (error) {
        console.error("Failed to parse OKR cycle from localStorage", error);
      }
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) { 
      if (objectives.length > 0) {
        localStorage.setItem('okrTrackerData_objectives_fa', JSON.stringify(objectives));
      } else {
        localStorage.removeItem('okrTrackerData_objectives_fa');
      }
    }
  }, [objectives, isMounted]);

  useEffect(() => {
    if (isMounted) {
      if (okrCycle) {
        localStorage.setItem('okrTrackerData_cycle_fa', JSON.stringify({
          startDate: okrCycle.startDate.toISOString(),
          endDate: okrCycle.endDate.toISOString(),
        }));
      } else {
        localStorage.removeItem('okrTrackerData_cycle_fa');
      }
    }
  }, [okrCycle, isMounted]);

  const handleAddObjectiveClick = () => {
    setEditingObjective(null);
    setIsManageObjectiveDialogOpen(true);
  };

  const handleEditObjective = (objective: Objective) => {
    setEditingObjective(objective);
    setIsManageObjectiveDialogOpen(true);
  };

  const handleManageObjectiveSubmit = (data: ObjectiveFormData) => {
    const processedObjective: Objective = {
      id: data.id || editingObjective?.id || generateId(), 
      description: data.description,
      keyResults: data.keyResults.map(kr => ({
        id: kr.id || generateId(),
        description: kr.description,
        progress: kr.progress ?? 0, 
        confidenceLevel: kr.confidenceLevel,
        initiatives: kr.initiatives.map(init => ({
          id: init.id || generateId(),
          description: init.description,
          status: init.status,
          tasks: init.tasks || [],
        })),
      })),
    };

    if (editingObjective || data.id) { 
      setObjectives(prev => prev.map(obj => obj.id === processedObjective.id ? processedObjective : obj));
      toast({ title: "هدف به‌روزرسانی شد", description: `هدف «${processedObjective.description}» با موفقیت به‌روزرسانی شد.` });
    } else { 
      setObjectives(prev => [...prev, processedObjective]);
      toast({ title: "هدف اضافه شد", description: `هدف «${processedObjective.description}» با موفقیت اضافه شد.` });
    }
    setEditingObjective(null); 
    setIsManageObjectiveDialogOpen(false);
  };
  
  const handleOpenCheckInModal = (objective: Objective) => {
    setCurrentObjectiveForCheckIn(objective);
    setIsCheckInModalOpen(true);
  };

  const handleUpdateObjectiveAfterCheckIn = (updatedObjective: Objective) => {
     setObjectives(prev => prev.map(obj => obj.id === updatedObjective.id ? updatedObjective : obj));
  };

  const handleManageCycleSubmit = (data: OkrCycleFormData) => {
    setOkrCycle({ startDate: data.startDate, endDate: data.endDate });
  };

  if (!isMounted) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-10 w-36" />
            </div>
        </div>
        <div className="space-y-8">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold font-headline text-foreground">مدیریت اهداف OKR</h2>
        <div className="flex gap-2">
          <Button onClick={() => setIsManageCycleDialogOpen(true)} variant="outline">
            <Settings2 className="w-4 h-4 ml-2" />
            تنظیم چرخه OKR
          </Button>
          <Button onClick={handleAddObjectiveClick} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 ml-2" />
            افزودن هدف
          </Button>
        </div>
      </div>

      {objectives.length === 0 ? (
        <EmptyState onAddObjective={handleAddObjectiveClick} />
      ) : (
        <div className="space-y-8">
          {objectives.map(obj => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              onEdit={handleEditObjective}
              onCheckIn={handleOpenCheckInModal}
            />
          ))}
        </div>
      )}
      
      {isManageObjectiveDialogOpen && <ManageObjectiveDialog
        isOpen={isManageObjectiveDialogOpen}
        onClose={() => { setIsManageObjectiveDialogOpen(false); setEditingObjective(null); }}
        onSubmit={handleManageObjectiveSubmit}
        initialData={editingObjective}
      />}

      {isCheckInModalOpen && currentObjectiveForCheckIn && (
        <CheckInModal
          isOpen={isCheckInModalOpen}
          onClose={() => setIsCheckInModalOpen(false)}
          objective={currentObjectiveForCheckIn}
          onUpdateObjective={handleUpdateObjectiveAfterCheckIn}
        />
      )}

      {isManageCycleDialogOpen && <ManageOkrCycleDialog
        isOpen={isManageCycleDialogOpen}
        onClose={() => setIsManageCycleDialogOpen(false)}
        onSubmit={handleManageCycleSubmit}
        initialData={okrCycle}
      />}
    </>
  );
}


'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Objective, ObjectiveFormData, OkrCycle, OkrCycleFormData, Team } from '@/types/okr';
import { ObjectiveCard } from '@/components/okr/ObjectiveCard';
import { EmptyState } from '@/components/okr/EmptyState';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Plus, Settings2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { addObjective, getActiveOkrCycle, getObjectives, getOkrCycles, getTeams, setActiveOkrCycle, updateObjective } from '@/lib/actions';

const ManageObjectiveDialog = dynamic(() => import('@/components/okr/ManageObjectiveDialog').then(mod => mod.ManageObjectiveDialog), {
  loading: () => <p>در حال بارگذاری...</p>,
});
const CheckInModal = dynamic(() => import('@/components/okr/CheckInModal').then(mod => mod.CheckInModal), {
  loading: () => <p>در حال بارگذاری...</p>,
});
const ManageOkrCycleDialog = dynamic(() => import('@/components/okr/ManageOkrCycleDialog').then(mod => mod.ManageOkrCycleDialog), {
  loading: () => <p>در حال بارگذاری...</p>,
});

export function ObjectivesClient() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isManageObjectiveDialogOpen, setIsManageObjectiveDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [currentObjectiveForCheckIn, setCurrentObjectiveForCheckIn] = useState<Objective | null>(null);
  const [activeCycle, setActiveCycle] = useState<OkrCycle | null>(null);
  const [allCycles, setAllCycles] = useState<OkrCycle[]>([]);
  const [isManageCycleDialogOpen, setIsManageCycleDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const fetchData = useCallback(async () => {
    setIsMounted(false);
    const [objectivesData, teamsData, cyclesData, activeCycleData] = await Promise.all([
      getObjectives(),
      getTeams(),
      getOkrCycles(),
      getActiveOkrCycle(),
    ]);

    setObjectives(objectivesData);
    setTeams(teamsData);
    setAllCycles(cyclesData);
    if(activeCycleData) {
        setActiveCycle({
            ...activeCycleData,
            startDate: new Date(activeCycleData.startDate),
            endDate: new Date(activeCycleData.endDate),
        });
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleAddObjectiveClick = () => {
    if (!activeCycle) {
        toast({
            title: "چرخه OKR انتخاب نشده است",
            description: "لطفا ابتدا یک چرخه فعال را از طریق دکمه 'تنظیم چرخه OKR' انتخاب کنید.",
            variant: "destructive"
        });
        return;
    }
    setEditingObjective(null);
    setIsManageObjectiveDialogOpen(true);
  };

  const handleEditObjective = (objective: Objective) => {
    setEditingObjective(objective);
    setIsManageObjectiveDialogOpen(true);
  };

  const handleManageObjectiveSubmit = async (data: ObjectiveFormData) => {
    if (editingObjective || data.id) { 
      await updateObjective(data as Objective);
      toast({ title: "هدف به‌روزرسانی شد", description: `هدف «${data.description}» با موفقیت به‌روزرسانی شد.` });
    } else { 
      await addObjective(data);
      toast({ title: "هدف اضافه شد", description: `هدف «${data.description}» با موفقیت اضافه شد.` });
    }
    setEditingObjective(null); 
    setIsManageObjectiveDialogOpen(false);
    fetchData(); // Refresh data
  };
  
  const handleOpenCheckInModal = (objective: Objective) => {
    setCurrentObjectiveForCheckIn(objective);
    setIsCheckInModalOpen(true);
  };

  const handleUpdateObjectiveAfterCheckIn = async (updatedObjective: Objective) => {
     await updateObjective(updatedObjective);
     fetchData(); // Refresh data
  };

  const handleManageCycleSubmit = async (data: OkrCycleFormData) => {
    if(data.activeCycleId) {
        await setActiveOkrCycle(data.activeCycleId);
        fetchData(); // Refresh data to get new active cycle and filtered objectives
    }
  };
  
  const teamsMap = new Map(teams.map(team => [team.id, team.name]));
  
  const filteredObjectives = activeCycle 
    ? objectives.filter(obj => obj.cycleId === activeCycle.id)
    : [];

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
        <div>
            <h2 className="text-2xl font-semibold font-headline text-foreground">مدیریت اهداف OKR</h2>
            {activeCycle && <p className="text-muted-foreground text-sm mt-1">چرخه فعال: <span className="font-semibold text-primary">{activeCycle.name}</span></p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsManageCycleDialogOpen(true)} variant="outline">
            <Settings2 className="w-4 h-4 ml-2" />
            تنظیم چرخه OKR
          </Button>
          <Button onClick={handleAddObjectiveClick} className="bg-primary hover:bg-primary/90" disabled={teams.length === 0 || !activeCycle}>
            <Plus className="w-4 h-4 ml-2" />
            افزودن هدف
          </Button>
        </div>
      </div>

       {teams.length === 0 ? (
         <div className="text-center py-10 px-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-lg">
          <h3 className="text-xl font-semibold text-amber-800">ابتدا یک تیم بسازید</h3>
          <p className="text-amber-700 mt-2">برای افزودن اهداف، ابتدا باید حداقل یک تیم در بخش «مدیریت تیم‌ها» تعریف کنید.</p>
        </div>
      ) : !activeCycle ? (
        <div className="text-center py-10 px-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg">
          <h3 className="text-xl font-semibold text-blue-800">یک چرخه OKR انتخاب کنید</h3>
          <p className="text-blue-700 mt-2">برای مشاهده و افزودن اهداف، لطفاً یک چرخه فعال را از طریق دکمه «تنظیم چرخه OKR» انتخاب کنید.</p>
        </div>
      ) : filteredObjectives.length === 0 ? (
        <EmptyState onAddObjective={handleAddObjectiveClick} />
      ) : (
        <div className="space-y-8 mt-6">
          {filteredObjectives.map(obj => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              teamName={obj.teamId ? teamsMap.get(obj.teamId) : undefined}
              onEdit={handleEditObjective}
              onCheckIn={handleOpenCheckInModal}
            />
          ))}
        </div>
      )}
      
      {isManageObjectiveDialogOpen && activeCycle && <ManageObjectiveDialog
        isOpen={isManageObjectiveDialogOpen}
        onClose={() => { setIsManageObjectiveDialogOpen(false); setEditingObjective(null); }}
        onSubmit={handleManageObjectiveSubmit}
        initialData={editingObjective}
        teams={teams}
        cycleId={activeCycle.id}
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
        initialData={activeCycle}
        okrCycles={allCycles}
      />}
    </>
  );
}

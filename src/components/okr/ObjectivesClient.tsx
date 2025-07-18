
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import type { Objective, ObjectiveFormData, OkrCycle, OkrCycleFormData, Team } from '@/types/okr';
import { ObjectiveCard } from '@/components/okr/ObjectiveCard';
import { EmptyState } from '@/components/okr/EmptyState';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Plus, Settings2, Loader2 } from 'lucide-react';
import { getObjectives, saveObjective, deleteObjective, getTeams, saveOkrCycle, getOkrCycle } from '@/lib/data/actions';

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
  const { data: session, status } = useSession();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isManageObjectiveDialogOpen, setIsManageObjectiveDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [currentObjectiveForCheckIn, setCurrentObjectiveForCheckIn] = useState<Objective | null>(null);
  const [okrCycle, setOkrCycle] = useState<OkrCycle | null>(null);
  const [isManageCycleDialogOpen, setIsManageCycleDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      const loadData = async () => {
        setIsLoadingData(true);
        try {
          const [objectivesData, teamsData, cycleData] = await Promise.all([
            getObjectives(),
            getTeams(),
            getOkrCycle(),
          ]);
          setObjectives(objectivesData);
          setTeams(teamsData);
          if (cycleData) {
            setOkrCycle({
                startDate: new Date(cycleData.startDate),
                endDate: new Date(cycleData.endDate),
            });
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'خطا در بارگذاری داده‌ها' });
          console.error(error);
        } finally {
          setIsLoadingData(false);
        }
      };
      loadData();
    }
     if (status === 'unauthenticated') {
      setIsLoadingData(false);
    }
  }, [status, toast]);

  const handleAddObjectiveClick = () => {
    setEditingObjective(null);
    setIsManageObjectiveDialogOpen(true);
  };

  const handleEditObjective = (objective: Objective) => {
    setEditingObjective(objective);
    setIsManageObjectiveDialogOpen(true);
  };

  const handleManageObjectiveSubmit = async (data: ObjectiveFormData) => {
    try {
      const savedObjective = await saveObjective(data, editingObjective?.id);
      if (editingObjective) {
        setObjectives(prev => prev.map(obj => obj.id === savedObjective.id ? savedObjective : obj));
        toast({ title: "هدف به‌روزرسانی شد" });
      } else {
        setObjectives(prev => [...prev, savedObjective]);
        toast({ title: "هدف اضافه شد" });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطا در ذخیره هدف' });
    }
    setEditingObjective(null);
    setIsManageObjectiveDialogOpen(false);
  };
  
  const handleOpenCheckInModal = (objective: Objective) => {
    setCurrentObjectiveForCheckIn(objective);
    setIsCheckInModalOpen(true);
  };

  const handleUpdateObjectiveAfterCheckIn = async (updatedObjectiveData: ObjectiveFormData) => {
     try {
        const savedObjective = await saveObjective(updatedObjectiveData, updatedObjectiveData.id);
        setObjectives(prev => prev.map(obj => obj.id === savedObjective.id ? savedObjective : obj));
     } catch (error) {
        toast({ variant: 'destructive', title: 'خطا در به‌روزرسانی هدف' });
     }
  };

  const handleManageCycleSubmit = async (data: OkrCycleFormData) => {
     try {
        await saveOkrCycle(data);
        setOkrCycle({ startDate: data.startDate, endDate: data.endDate });
        toast({ title: "چرخه OKR به‌روزرسانی شد" });
     } catch (error) {
        toast({ variant: 'destructive', title: 'خطا در ذخیره چرخه' });
     }
  };
  
  const teamsMap = new Map(teams.map(team => [team.id, team]));

  if (status === 'loading' || isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-16 h-16 text-primary mb-6 animate-spin" />
        <h1 className="text-2xl font-semibold text-muted-foreground">در حال بارگذاری اطلاعات...</h1>
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
          <Button onClick={handleAddObjectiveClick} className="bg-primary hover:bg-primary/90" disabled={teams.length === 0}>
            <Plus className="w-4 h-4 ml-2" />
            افزودن هدف
          </Button>
        </div>
      </div>

       {teams.length === 0 && (
         <div className="text-center py-10 px-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-lg">
          <h3 className="text-xl font-semibold text-amber-800">ابتدا یک تیم بسازید</h3>
          <p className="text-amber-700 mt-2">برای افزودن اهداف، ابتدا باید حداقل یک تیم در بخش «مدیریت تیم‌ها» تعریف کنید.</p>
        </div>
      )}

      {objectives.length === 0 && teams.length > 0 ? (
        <EmptyState onAddObjective={handleAddObjectiveClick} />
      ) : (
        <div className="space-y-8 mt-6">
          {objectives.map(obj => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              team={obj.teamId ? teamsMap.get(parseInt(obj.teamId)) : undefined}
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
        teams={teams}
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

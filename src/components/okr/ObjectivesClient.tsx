
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import type { Objective, ObjectiveFormData, OkrCycle, OkrCycleFormData, Team } from '@/types/okr';
import { ObjectiveCard } from '@/components/okr/ObjectiveCard';
import { EmptyState } from '@/components/okr/EmptyState';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
<<<<<<< HEAD
import { Plus, Settings2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { addObjective, getActiveOkrCycle, getObjectives, getOkrCycles, getTeams, setActiveOkrCycle, updateObjective } from '@/lib/actions';
=======
import { Plus, Settings2, Loader2 } from 'lucide-react';
import { getObjectives, saveObjective, deleteObjective, getTeams, saveOkrCycle, getOkrCycle } from '@/lib/data/actions';
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719

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
  const [activeCycle, setActiveCycle] = useState<OkrCycle | null>(null);
  const [allCycles, setAllCycles] = useState<OkrCycle[]>([]);
  const [isManageCycleDialogOpen, setIsManageCycleDialogOpen] = useState(false);
  const { toast } = useToast();
<<<<<<< HEAD
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

=======
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
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719

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
<<<<<<< HEAD
    if (editingObjective || data.id) { 
      await updateObjective(data as Objective);
      toast({ title: "هدف به‌روزرسانی شد", description: `هدف «${data.description}» با موفقیت به‌روزرسانی شد.` });
    } else { 
      await addObjective(data);
      toast({ title: "هدف اضافه شد", description: `هدف «${data.description}» با موفقیت اضافه شد.` });
=======
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
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
    }
    setEditingObjective(null);
    setIsManageObjectiveDialogOpen(false);
    fetchData(); // Refresh data
  };
  
  const handleOpenCheckInModal = (objective: Objective) => {
    setCurrentObjectiveForCheckIn(objective);
    setIsCheckInModalOpen(true);
  };

<<<<<<< HEAD
  const handleUpdateObjectiveAfterCheckIn = async (updatedObjective: Objective) => {
     await updateObjective(updatedObjective);
     fetchData(); // Refresh data
  };

  const handleManageCycleSubmit = async (data: OkrCycleFormData) => {
    if(data.activeCycleId) {
        await setActiveOkrCycle(data.activeCycleId);
        fetchData(); // Refresh data to get new active cycle and filtered objectives
    }
=======
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
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
  };
  
  const teamsMap = new Map(teams.map(team => [team.id, team.name]));
  
  const filteredObjectives = activeCycle 
    ? objectives.filter(obj => obj.cycleId === activeCycle.id)
    : [];

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
<<<<<<< HEAD
              teamName={obj.teamId ? teamsMap.get(obj.teamId) : undefined}
=======
              team={obj.teamId ? teamsMap.get(parseInt(obj.teamId)) : undefined}
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
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

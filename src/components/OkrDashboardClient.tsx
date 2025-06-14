
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Objective, ObjectiveFormData, KeyResult, Initiative, OkrCycle, OkrCycleFormData } from '@/types/okr';
import type { ConfidenceLevel } from '@/lib/constants';
import { ObjectiveCard } from '@/components/okr/ObjectiveCard';
import { ManageObjectiveDialog } from '@/components/okr/ManageObjectiveDialog';
import { ManageOkrCycleDialog } from '@/components/okr/ManageOkrCycleDialog';
import { CheckInModal } from '@/components/okr/CheckInModal';
import { EmptyState } from '@/components/okr/EmptyState';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, AlertTriangle, Smile, Plus, CheckCircle2, Activity, XOctagon, Clock, Settings2 } from 'lucide-react';
import { differenceInCalendarDays, format } from 'date-fns';
import { faIR } from 'date-fns/locale';

const generateId = () => crypto.randomUUID();

const initialObjectivesData: Objective[] = [
  {
    id: 'obj1_sample',
    description: 'بهبود قابلیت کشف محصول و پذیرش کاربر برای فصل سوم',
    keyResults: [
      {
        id: 'kr1_1_sample',
        description: 'افزایش ۲۵٪ ثبت‌نام‌های ارگانیک از طریق بازاریابی محتوا',
        progress: 30,
        confidenceLevel: 'متوسط',
        initiatives: [
          { id: 'init1_1_1_sample', description: 'انتشار ۴ پست وبلاگ جدید با کیفیت بالا', status: 'در حال انجام' },
          { id: 'init1_1_2_sample', description: 'بهینه‌سازی ۱۰ مقاله موجود برای SEO', status: 'شروع نشده' },
        ],
      },
      {
        id: 'kr1_2_sample',
        description: 'بهبود نرخ فعال‌سازی کاربران جدید از ۴۰٪ به ۶۰٪',
        progress: 15,
        confidenceLevel: 'کم',
        initiatives: [
          { id: 'init1_2_1_sample', description: 'طراحی مجدد جریان ورود کاربر', status: 'در حال انجام' },
          { id: 'init1_2_2_sample', description: 'پیاده‌سازی تورهای راهنمای درون برنامه‌ای', status: 'مسدود شده' },
        ],
      },
    ],
  },
  {
    id: 'obj2_sample',
    description: 'تقویت بهره‌وری عملیاتی و کاهش هزینه‌های سربار تا فصل چهارم',
    keyResults: [
      {
        id: 'kr2_1_sample',
        description: 'کاهش ۱۵٪ میانگین زمان حل تیکت (از ۴ ساعت به ۳.۴ ساعت)',
        progress: 60,
        confidenceLevel: 'زیاد',
        initiatives: [
          { id: 'init2_1_1_sample', description: 'پیاده‌سازی پایگاه دانش داخلی جدید برای کارشناسان پشتیبانی', status: 'تکمیل شده' },
          { id: 'init2_1_2_sample', description: 'آموزش تیم پشتیبانی در مورد عیب‌یابی پیشرفته', status: 'در حال انجام' },
        ],
      },
    ],
  }
];


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
    setIsMounted(true);
    const storedObjectives = localStorage.getItem('okrTrackerData_objectives_fa');
    if (storedObjectives) {
      try {
        const parsedObjectives = JSON.parse(storedObjectives);
        if (Array.isArray(parsedObjectives) && parsedObjectives.every(obj => obj.id && obj.description)) {
           setObjectives(parsedObjectives);
        } else {
           setObjectives(initialObjectivesData);
        }
      } catch (error) {
        console.error("Failed to parse Persian objectives from localStorage", error);
        setObjectives(initialObjectivesData); 
      }
    } else {
       setObjectives(initialObjectivesData);
    }

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
  }, []);

  useEffect(() => {
    if (isMounted && objectives.length > 0) { 
        localStorage.setItem('okrTrackerData_objectives_fa', JSON.stringify(objectives));
    } else if (isMounted && objectives.length === 0) {
        localStorage.removeItem('okrTrackerData_objectives_fa');
    }
  }, [objectives, isMounted]);

  useEffect(() => {
    if (isMounted && okrCycle) {
      localStorage.setItem('okrTrackerData_cycle_fa', JSON.stringify({
        startDate: okrCycle.startDate.toISOString(),
        endDate: okrCycle.endDate.toISOString(),
      }));
    } else if (isMounted && !okrCycle) {
      localStorage.removeItem('okrTrackerData_cycle_fa');
    }
  }, [okrCycle, isMounted]);

  const summaryStats = useMemo(() => {
    let totalProgressSum = 0;
    let totalKeyResultsCount = 0;
    let completedKeyResults = 0;
    let initiativesInProgress = 0;
    let initiativesBlocked = 0;

    const krsByConfidence: Record<ConfidenceLevel, number> = {
      'زیاد': 0, 'متوسط': 0, 'کم': 0, 'در معرض خطر': 0,
    };

    objectives.forEach(obj => {
      obj.keyResults.forEach(kr => {
        totalProgressSum += kr.progress;
        totalKeyResultsCount++;
        if (kr.progress === 100) completedKeyResults++;
        if (krsByConfidence[kr.confidenceLevel] !== undefined) krsByConfidence[kr.confidenceLevel]++;
        kr.initiatives.forEach(init => {
          if (init.status === 'در حال انجام') initiativesInProgress++;
          else if (init.status === 'مسدود شده') initiativesBlocked++;
        });
      });
    });

    const averageProgress = totalKeyResultsCount > 0 ? totalProgressSum / totalKeyResultsCount : 0;

    let remainingDays: number | null = null;
    let cycleElapsedPercentage: number = 0;
    if (okrCycle && okrCycle.startDate && okrCycle.endDate) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const cycleEndDate = new Date(okrCycle.endDate);
      cycleEndDate.setHours(0,0,0,0);
      const cycleStartDate = new Date(okrCycle.startDate);
      cycleStartDate.setHours(0,0,0,0);

      remainingDays = differenceInCalendarDays(cycleEndDate, today);
      if (remainingDays < 0) remainingDays = 0;

      const totalCycleDuration = differenceInCalendarDays(cycleEndDate, cycleStartDate);
      if (totalCycleDuration > 0) {
        const elapsedCycleDuration = differenceInCalendarDays(today, cycleStartDate);
        cycleElapsedPercentage = Math.min(100, Math.max(0, (elapsedCycleDuration / totalCycleDuration) * 100));
      } else if (today >= cycleEndDate) {
        cycleElapsedPercentage = 100;
      }
    }

    return {
      totalObjectives: objectives.length,
      averageProgress: parseFloat(averageProgress.toFixed(1)),
      krsByConfidence,
      completedKeyResults,
      initiativesInProgress,
      initiativesBlocked,
      remainingDays,
      cycleElapsedPercentage,
      cycleDates: okrCycle ? { 
        start: format(okrCycle.startDate, "d MMMM yyyy", { locale: faIR }), 
        end: format(okrCycle.endDate, "d MMMM yyyy", { locale: faIR }) 
      } : null
    };
  }, [objectives, okrCycle]);


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

  return (
    <>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold font-headline text-foreground">داشبورد OKR</h2>
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

      {isMounted && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">اهداف کل</CardTitle>
              <Target className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalObjectives}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">میانگین پیشرفت</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.averageProgress}%</div>
              {objectives.length > 0 && <Progress value={summaryStats.averageProgress} className="h-2 mt-2 rounded-full" indicatorClassName="rounded-full" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">روزهای باقیمانده چرخه</CardTitle>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryStats.remainingDays !== null ? `${summaryStats.remainingDays} روز` : 'تنظیم نشده'}
              </div>
              {summaryStats.remainingDays !== null && okrCycle && (
                <>
                  <Progress value={summaryStats.cycleElapsedPercentage} className="h-2 mt-2 rounded-full" indicatorClassName="rounded-full" />
                  {summaryStats.cycleDates && <p className="text-xs text-muted-foreground mt-1 text-center">{summaryStats.cycleDates.start} - {summaryStats.cycleDates.end}</p>}
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">نتایج کلیدی با اطمینان زیاد</CardTitle>
              <Smile className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.krsByConfidence['زیاد']}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">نتایج کلیدی در معرض خطر</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.krsByConfidence['در معرض خطر']}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">نتایج کلیدی تکمیل‌شده</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.completedKeyResults}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">اقدامات در حال انجام</CardTitle>
              <Activity className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.initiativesInProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">اقدامات مسدود شده</CardTitle>
              <XOctagon className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.initiativesBlocked}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {objectives.length === 0 && isMounted ? (
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
      
      <ManageObjectiveDialog
        isOpen={isManageObjectiveDialogOpen}
        onClose={() => { setIsManageObjectiveDialogOpen(false); setEditingObjective(null); }}
        onSubmit={handleManageObjectiveSubmit}
        initialData={editingObjective}
      />

      {currentObjectiveForCheckIn && (
        <CheckInModal
          isOpen={isCheckInModalOpen}
          onClose={() => setIsCheckInModalOpen(false)}
          objective={currentObjectiveForCheckIn}
          onUpdateObjective={handleUpdateObjectiveAfterCheckIn}
        />
      )}

      <ManageOkrCycleDialog
        isOpen={isManageCycleDialogOpen}
        onClose={() => setIsManageCycleDialogOpen(false)}
        onSubmit={handleManageCycleSubmit}
        initialData={okrCycle}
      />
    </>
  );
}

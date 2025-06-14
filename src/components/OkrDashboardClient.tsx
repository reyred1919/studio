'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Objective, ObjectiveFormData, KeyResult } from '@/types/okr';
import type { ConfidenceLevel } from '@/lib/constants';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { ObjectiveCard } from '@/components/okr/ObjectiveCard';
import { ManageObjectiveDialog } from '@/components/okr/ManageObjectiveDialog';
import { CheckInModal } from '@/components/okr/CheckInModal';
import { EmptyState } from '@/components/okr/EmptyState';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, AlertTriangle, Smile } from 'lucide-react';

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
           console.warn("Stored Persian objectives have unexpected structure, resetting to initial.", parsedObjectives);
           setObjectives(initialObjectivesData);
        }
      } catch (error) {
        console.error("Failed to parse Persian objectives from localStorage", error);
        setObjectives(initialObjectivesData); 
      }
    } else {
       setObjectives(initialObjectivesData);
    }
  }, []);

  useEffect(() => {
    if (isMounted && objectives.length > 0) { 
        localStorage.setItem('okrTrackerData_objectives_fa', JSON.stringify(objectives));
    } else if (isMounted && objectives.length === 0) {
        localStorage.removeItem('okrTrackerData_objectives_fa');
    }
  }, [objectives, isMounted]);

  const summaryStats = useMemo(() => {
    if (!objectives || objectives.length === 0) {
      return {
        totalObjectives: 0,
        averageProgress: 0,
        krsByConfidence: {
          'زیاد': 0,
          'متوسط': 0,
          'کم': 0,
          'در معرض خطر': 0,
        } as Record<ConfidenceLevel, number>,
      };
    }

    let totalProgressSum = 0;
    let totalKeyResultsCount = 0;
    const krsByConfidence: Record<ConfidenceLevel, number> = {
      'زیاد': 0,
      'متوسط': 0,
      'کم': 0,
      'در معرض خطر': 0,
    };

    objectives.forEach(obj => {
      obj.keyResults.forEach(kr => {
        totalProgressSum += kr.progress;
        totalKeyResultsCount++;
        if (krsByConfidence[kr.confidenceLevel] !== undefined) {
            krsByConfidence[kr.confidenceLevel]++;
        }
      });
    });

    const averageProgress = totalKeyResultsCount > 0 ? totalProgressSum / totalKeyResultsCount : 0;

    return {
      totalObjectives: objectives.length,
      averageProgress: parseFloat(averageProgress.toFixed(1)), // Round to one decimal place
      krsByConfidence: krsByConfidence,
    };
  }, [objectives]);


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


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader onAddObjective={handleAddObjectiveClick} />
      <main className="flex-grow">
        <PageContainer>
          {isMounted && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 pt-2">
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
                  <CardTitle className="text-sm font-medium">نتایج کلیدی در معرض خطر</CardTitle>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryStats.krsByConfidence['در معرض خطر']}</div>
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
        </PageContainer>
      </main>

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
       <footer className="py-8 text-center text-sm text-muted-foreground border-t mt-12">
         ردیاب OKR &copy; {new Date().getFullYear()} - روی آنچه مهم است تمرکز کنید.
      </footer>
    </div>
  );
}

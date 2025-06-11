'use client';

import React, { useState, useEffect } from 'react';
import type { Objective, ObjectiveFormData } from '@/types/okr';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { ObjectiveCard } from '@/components/okr/ObjectiveCard';
import { ManageObjectiveDialog } from '@/components/okr/ManageObjectiveDialog';
import { CheckInModal } from '@/components/okr/CheckInModal';
import { EmptyState } from '@/components/okr/EmptyState';
import { useToast } from "@/hooks/use-toast";

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
    const storedObjectives = localStorage.getItem('okrTrackerData_objectives_fa'); // Use a different key for Persian
    if (storedObjectives) {
      try {
        const parsedObjectives = JSON.parse(storedObjectives);
        // Basic validation to ensure structure compatibility if needed
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
        localStorage.removeItem('okrTrackerData_objectives_fa'); // Clear if no objectives
    }
  }, [objectives, isMounted]);


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
          {objectives.length === 0 ? (
            <EmptyState onAddObjective={handleAddObjectiveClick} />
          ) : (
            <div className="space-y-8 pt-2">
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

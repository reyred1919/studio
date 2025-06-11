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
    description: 'Enhance Product discoverability and user adoption for Q3',
    keyResults: [
      {
        id: 'kr1_1_sample',
        description: 'Increase organic sign-ups from content marketing by 25%',
        progress: 30,
        confidenceLevel: 'Medium',
        initiatives: [
          { id: 'init1_1_1_sample', description: 'Publish 4 new high-quality blog posts', status: 'In Progress' },
          { id: 'init1_1_2_sample', description: 'Optimize 10 existing articles for SEO', status: 'Not Started' },
        ],
      },
      {
        id: 'kr1_2_sample',
        description: 'Improve new user activation rate from 40% to 60%',
        progress: 15,
        confidenceLevel: 'Low',
        initiatives: [
          { id: 'init1_2_1_sample', description: 'Redesign onboarding flow', status: 'In Progress' },
          { id: 'init1_2_2_sample', description: 'Implement in-app guided tours', status: 'Blocked' },
        ],
      },
    ],
  },
  {
    id: 'obj2_sample',
    description: 'Strengthen operational efficiency and reduce overheads by Q4',
    keyResults: [
      {
        id: 'kr2_1_sample',
        description: 'Reduce average ticket resolution time by 15% (from 4h to 3.4h)',
        progress: 60,
        confidenceLevel: 'High',
        initiatives: [
          { id: 'init2_1_1_sample', description: 'Implement new internal KB for support agents', status: 'Completed' },
          { id: 'init2_1_2_sample', description: 'Train support team on advanced troubleshooting', status: 'In Progress' },
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
    const storedObjectives = localStorage.getItem('okrTrackerData_objectives');
    if (storedObjectives) {
      try {
        const parsedObjectives = JSON.parse(storedObjectives);
        setObjectives(parsedObjectives);
      } catch (error) {
        console.error("Failed to parse objectives from localStorage", error);
        setObjectives(initialObjectivesData); 
      }
    } else {
       setObjectives(initialObjectivesData);
    }
  }, []);

  useEffect(() => {
    if (isMounted) { // Only run after initial mount to prevent overwriting on SSR/first load
        localStorage.setItem('okrTrackerData_objectives', JSON.stringify(objectives));
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
      id: data.id || editingObjective?.id || generateId(), // Use existing ID if editing, else generate new
      description: data.description,
      keyResults: data.keyResults.map(kr => ({
        id: kr.id || generateId(),
        description: kr.description,
        progress: kr.progress ?? 0, // Ensure progress is a number
        confidenceLevel: kr.confidenceLevel,
        initiatives: kr.initiatives.map(init => ({
          id: init.id || generateId(),
          description: init.description,
          status: init.status,
        })),
      })),
    };

    if (editingObjective || data.id) { // If editing an existing objective
      setObjectives(prev => prev.map(obj => obj.id === processedObjective.id ? processedObjective : obj));
      toast({ title: "Objective Updated", description: `"${processedObjective.description}" has been successfully updated.` });
    } else { // If adding a new objective
      setObjectives(prev => [...prev, processedObjective]);
      toast({ title: "Objective Added", description: `"${processedObjective.description}" has been successfully added.` });
    }
    setEditingObjective(null); // Clear editing state
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
         OKR Tracker &copy; {new Date().getFullYear()} - Focus on What Matters.
      </footer>
    </div>
  );
}

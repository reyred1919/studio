import type React from 'react';
import { Button } from '@/components/ui/button';
import { Target, Plus } from 'lucide-react';

interface AppHeaderProps {
  onAddObjective: () => void;
}

export function AppHeader({ onAddObjective }: AppHeaderProps) {
  return (
    <header className="bg-card border-b sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-headline font-semibold text-foreground">OKR Tracker</h1>
        </div>
        <Button onClick={onAddObjective} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Objective
        </Button>
      </div>
    </header>
  );
}

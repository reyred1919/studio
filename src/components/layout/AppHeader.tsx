import type React from 'react';
import { Target } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AppHeader() {
  return (
    <header className="bg-card border-b sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="text-foreground data-[state=open]:bg-accent/20" />
          <div className="flex items-center gap-2">
            <Target className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-headline font-semibold text-foreground">ردیاب OKR</h1>
          </div>
        </div>
        {/* The "Add Objective" button will be moved to OkrDashboardClient */}
      </div>
    </header>
  );
}

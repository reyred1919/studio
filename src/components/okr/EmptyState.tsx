import { Button } from "@/components/ui/button";
import { Target, Plus } from "lucide-react";
import Image from "next/image";

interface EmptyStateProps {
  onAddObjective: () => void;
}

export function EmptyState({ onAddObjective }: EmptyStateProps) {
  return (
    <div className="text-center py-16 flex flex-col items-center bg-card rounded-lg shadow-md mt-8">
      <Image 
        src="https://placehold.co/300x200.png" 
        alt="Team working on goals" 
        width={300} 
        height={200} 
        className="mb-8 rounded-md shadow-lg"
        data-ai-hint="team goals" 
      />
      <Target className="w-16 h-16 text-primary mx-auto mb-4" />
      <h2 className="text-2xl font-semibold mb-2 font-headline text-foreground">No Objectives Yet</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Start tracking your goals by adding your first objective. Clearly defined objectives and key results are the first step towards success.
      </p>
      <Button onClick={onAddObjective} size="lg" className="bg-primary hover:bg-primary/90">
        <Plus className="w-5 h-5 mr-2" />
        Add Your First Objective
      </Button>
    </div>
  );
}

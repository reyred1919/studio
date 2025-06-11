import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, Sparkles } from 'lucide-react';
import type { Objective } from '@/types/okr';
import { getOkrImprovementSuggestionsAction } from '@/lib/actions';
import { CONFIDENCE_LEVELS, type ConfidenceLevel } from '@/lib/constants';
import { checkInFormSchema, type CheckInFormData } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  objective: Objective | null;
  onUpdateObjective: (updatedObjective: Objective) => void;
}

export function CheckInModal({ isOpen, onClose, objective, onUpdateObjective }: CheckInModalProps) {
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);
  const { toast } = useToast();

  const { control, handleSubmit, reset, watch } = useForm<CheckInFormData>({
    resolver: zodResolver(checkInFormSchema),
    defaultValues: { keyResults: [] },
  });

  useEffect(() => {
    if (objective && isOpen) {
      const initialKrs = objective.keyResults.map(kr => ({
        id: kr.id,
        progress: kr.progress,
        confidenceLevel: kr.confidenceLevel,
      }));
      reset({ keyResults: initialKrs });
      setAiSuggestions([]); 
    }
  }, [objective, reset, isOpen]);
  
  if (!objective) return null;

  const processCheckIn = (data: CheckInFormData) => {
    const updatedKeyResults = objective.keyResults.map(originalKr => {
      const updatedKrData = data.keyResults.find(ukr => ukr.id === originalKr.id);
      return updatedKrData ? { ...originalKr, progress: updatedKrData.progress, confidenceLevel: updatedKrData.confidenceLevel } : originalKr;
    });
    onUpdateObjective({ ...objective, keyResults: updatedKeyResults });
    toast({ title: "Check-in saved!", description: "Your OKR progress has been updated." });
  };

  const handleGetAiSuggestions = async () => {
    setIsLoadingAiSuggestions(true);
    setAiSuggestions([]);
    
    const currentFormData = watch();
    const currentObjectiveState: Objective = {
      ...objective,
      keyResults: objective.keyResults.map(originalKr => {
        const updatedKrData = currentFormData.keyResults.find(ukr => ukr.id === originalKr.id);
        return updatedKrData ? { ...originalKr, progress: updatedKrData.progress, confidenceLevel: updatedKrData.confidenceLevel } : originalKr;
      }),
    };

    try {
      const result = await getOkrImprovementSuggestionsAction(currentObjectiveState);
      if (result.suggestions && result.suggestions.length > 0 && !(result.suggestions.length === 1 && result.suggestions[0].startsWith("Error:"))) {
        setAiSuggestions(result.suggestions);
        toast({ title: "AI Suggestions Ready!", description: "Review the suggestions to improve your OKRs.", duration: 5000 });
      } else if (result.suggestions && result.suggestions.length === 1 && result.suggestions[0].startsWith("Error:")) {
         setAiSuggestions([result.suggestions[0]]);
         toast({ variant: "destructive", title: "AI Suggestion Error", description: result.suggestions[0], duration: 5000});
      }
       else {
        setAiSuggestions(["No specific suggestions at this time. Keep up the great work!"]);
        toast({ title: "AI Suggestions", description: "No specific suggestions at this time.", duration: 3000 });
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      const errorMessage = "There was an error fetching suggestions. Please try again.";
      setAiSuggestions([errorMessage]);
      toast({ variant: "destructive", title: "Error", description: errorMessage, duration: 5000 });
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Objective Check-In</DialogTitle>
          <DialogDescription>
            For: <span className="font-medium text-foreground">{objective.description}</span> <br/>
            Update progress and confidence for your key results. Then, get AI-powered suggestions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processCheckIn)}>
          <ScrollArea className="max-h-[calc(70vh-200px)] p-1 pr-4">
            <div className="space-y-6 py-2">
              {watch('keyResults').map((kr, index) => {
                const originalKr = objective.keyResults.find(k => k.id === kr.id);
                if (!originalKr) return null;
                return (
                  <div key={kr.id} className="p-4 border rounded-lg bg-card shadow-sm">
                    <h4 className="font-medium mb-3 text-foreground">{originalKr.description}</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`krProgress-${index}`} className="text-sm">Progress: {watch(`keyResults.${index}.progress`)}%</Label>
                        <Controller
                          name={`keyResults.${index}.progress`}
                          control={control}
                          render={({ field: controllerField }) => (
                            <Slider
                              id={`krProgress-${index}`}
                              min={0} max={100} step={1}
                              value={[controllerField.value]}
                              onValueChange={(value) => controllerField.onChange(value[0])}
                              className="mt-1.5"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`krConfidence-${index}`} className="text-sm">Confidence Level</Label>
                        <Controller
                          name={`keyResults.${index}.confidenceLevel`}
                          control={control}
                          render={({ field: controllerField }) => (
                            <Select
                              onValueChange={controllerField.onChange}
                              value={controllerField.value}
                            >
                              <SelectTrigger id={`krConfidence-${index}`} className="mt-1.5">
                                <SelectValue placeholder="Select confidence" />
                              </SelectTrigger>
                              <SelectContent>
                                {CONFIDENCE_LEVELS.map(level => (
                                  <SelectItem key={level} value={level}>{level}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {aiSuggestions.length > 0 && (
            <Alert className="mt-6 bg-accent/10 border-accent/40 text-accent-foreground shadow">
              <Sparkles className="h-5 w-5 text-accent" />
              <AlertTitle className="font-headline text-accent">AI-Powered Suggestions</AlertTitle>
              <AlertDescription className="text-accent-foreground/90">
                <ul className="list-disc pl-5 space-y-1.5 mt-2 text-sm">
                  {aiSuggestions.map((suggestion, i) => <li key={i}>{suggestion}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        
          <DialogFooter className="mt-8 pt-6 border-t gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
            <Button type="submit" variant="outline">Save Check-In</Button>
            <Button type="button" onClick={handleGetAiSuggestions} disabled={isLoadingAiSuggestions} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isLoadingAiSuggestions ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-4 w-4" />
              )}
              Get AI Suggestions
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

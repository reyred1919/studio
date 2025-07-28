
import React, { useEffect, useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { OkrCycle } from '@/types/okr';
import { okrCycleFormSchema, type OkrCycleFormData } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

interface ManageOkrCycleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OkrCycleFormData) => void;
  initialData?: OkrCycle | null;
  okrCycles: OkrCycle[];
}

export function ManageOkrCycleDialog({ isOpen, onClose, onSubmit, initialData, okrCycles }: ManageOkrCycleDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { control, handleSubmit, reset } = useForm<OkrCycleFormData>({
    resolver: zodResolver(okrCycleFormSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        activeCycleId: initialData?.id,
      });
    }
  }, [isOpen, initialData, reset]);

  const processSubmit = async (data: OkrCycleFormData) => {
    setIsSubmitting(true);
    await onSubmit(data);
    toast({ title: "چرخه OKR فعال به‌روزرسانی شد", description: "داده‌های نمایش داده شده در برنامه به‌روز خواهند شد." });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">انتخاب چرخه فعال OKR</DialogTitle>
          <DialogDescription>
            چرخه OKR مورد نظر خود را برای نمایش و مدیریت اهداف انتخاب کنید. تمام داده‌ها بر اساس این چرخه فیلتر خواهند شد.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)}>
          <div className="space-y-4 py-4">
            <Controller
              name="activeCycleId"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={String(field.value)}
                  className="grid grid-cols-1 gap-2"
                >
                  {okrCycles.map((cycle) => (
                    <Label 
                      key={cycle.id} 
                      htmlFor={`cycle-${cycle.id}`} 
                      className="flex items-center space-x-2 space-x-reverse p-3 border rounded-md hover:bg-muted/50 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary"
                    >
                      <RadioGroupItem value={String(cycle.id)} id={`cycle-${cycle.id}`} />
                      <span>{cycle.name}</span>
                    </Label>
                  ))}
                </RadioGroup>
              )}
            />
          </div>
          <DialogFooter className="mt-6 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">انصراف</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ذخیره
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


import React, { useEffect } from 'react';
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
import { DatePicker } from '@/components/ui/date-picker'; 
import type { OkrCycle, OkrCycleFormData } from '@/types/okr';
import { okrCycleSchema } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";

interface ManageOkrCycleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OkrCycleFormData) => void;
  initialData?: OkrCycle | null;
}

export function ManageOkrCycleDialog({ isOpen, onClose, onSubmit, initialData }: ManageOkrCycleDialogProps) {
  const { toast } = useToast();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<OkrCycleFormData>({
    resolver: zodResolver(okrCycleSchema),
    defaultValues: {
      startDate: initialData?.startDate,
      endDate: initialData?.endDate,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        startDate: initialData?.startDate,
        endDate: initialData?.endDate,
      });
    }
  }, [isOpen, initialData, reset]);

  const processSubmit = (data: OkrCycleFormData) => {
    onSubmit(data);
    toast({ title: "چرخه OKR به‌روزرسانی شد", description: "تاریخ شروع و پایان چرخه با موفقیت ذخیره شد." });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">تنظیم چرخه OKR</DialogTitle>
          <DialogDescription>
            تاریخ شروع و پایان برای چرخه فعلی OKRهای خود را مشخص کنید.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)}>
          <div className="space-y-6 py-4">
            <div>
              <Label htmlFor="startDate">تاریخ شروع</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    date={field.value}
                    setDate={field.onChange}
                    placeholderText="انتخاب تاریخ شروع"
                    className="mt-1"
                  />
                )}
              />
              {errors.startDate && <p className="text-destructive text-sm mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="endDate">تاریخ پایان</Label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    date={field.value}
                    setDate={field.onChange}
                    placeholderText="انتخاب تاریخ پایان"
                    className="mt-1"
                  />
                )}
              />
              {errors.endDate && <p className="text-destructive text-sm mt-1">{errors.endDate.message}</p>}
            </div>
             {errors.root && <p className="text-destructive text-sm mt-1">{errors.root.message}</p>}
          </div>
          <DialogFooter className="mt-6 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">انصراف</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90">ذخیره چرخه</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

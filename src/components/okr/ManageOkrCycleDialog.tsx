
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
import { addMonths } from 'date-fns';

interface ManageOkrCycleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OkrCycleFormData) => void;
  initialData?: OkrCycle | null;
}

export function ManageOkrCycleDialog({ isOpen, onClose, onSubmit, initialData }: ManageOkrCycleDialogProps) {
  const { toast } = useToast();
  const { control, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<OkrCycleFormData>({
    resolver: zodResolver(okrCycleSchema),
    defaultValues: {
      startDate: initialData?.startDate,
      endDate: initialData?.endDate,
    },
  });

  const startDate = watch("startDate");

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

  const setCycleEndDate = (months: number) => {
    if (startDate) {
      const newEndDate = addMonths(startDate, months);
      setValue("endDate", newEndDate, { shouldValidate: true });
    } else {
      toast({
        title: "تاریخ شروع انتخاب نشده",
        description: "لطفاً ابتدا تاریخ شروع را برای محاسبه خودکار تاریخ پایان انتخاب کنید.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">تنظیم چرخه OKR</DialogTitle>
          <DialogDescription>
            تاریخ شروع و پایان برای چرخه فعلی OKRهای خود را مشخص کنید. می‌توانید از گزینه‌های سریع ۳ یا ۴ ماهه استفاده کنید یا تاریخ پایان را دستی انتخاب نمایید.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="startDate">تاریخ شروع</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    date={field.value}
                    setDate={(date) => {
                        field.onChange(date);
                        // Optional: Clear end date or re-calculate if a quick selection was made?
                        // For now, let user manually adjust or click quick select again.
                    }}
                    placeholderText="انتخاب تاریخ شروع"
                    className="mt-1"
                  />
                )}
              />
              {errors.startDate && <p className="text-destructive text-sm mt-1">{errors.startDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">انتخاب سریع مدت چرخه</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCycleEndDate(3)} disabled={!startDate} className="flex-1">
                  ۳ ماهه
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setCycleEndDate(4)} disabled={!startDate} className="flex-1">
                  ۴ ماهه
                </Button>
              </div>
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
                    disabled={(date) => startDate ? date < startDate : false}
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


import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { initiativeSchema } from '@/lib/schemas';
import type { Initiative, InitiativeFormData } from '@/types/okr';
import { INITIATIVE_STATUSES } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, PlusCircle } from 'lucide-react';

interface ManageInitiativeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initiative: Initiative;
  onSave: (updatedInitiative: Initiative) => void;
}

const generateId = () => crypto.randomUUID();

export function ManageInitiativeDialog({ isOpen, onClose, initiative, onSave }: ManageInitiativeDialogProps) {
  const form = useForm<InitiativeFormData>({
    resolver: zodResolver(initiativeSchema),
    defaultValues: initiative,
  });

  const { control, register, handleSubmit, reset, formState: { errors } } = form;

  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({
    control,
    name: 'tasks',
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        ...initiative,
        tasks: initiative.tasks || [],
      });
    }
  }, [isOpen, initiative, reset]);

  const processSubmit = (data: InitiativeFormData) => {
    const updatedData: Initiative = {
      ...initiative,
      ...data,
      tasks: data.tasks.map(t => ({...t, id: t.id || generateId()}))
    };
    onSave(updatedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">مدیریت اقدام و وظایف</DialogTitle>
          <DialogDescription>
            شرح و وضعیت اقدام را ویرایش کرده و وظایف زیرمجموعه آن را مدیریت کنید.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)}>
            <div className="space-y-6 pt-4 pr-1">
              <div>
                <Label htmlFor="initiative-description" className="font-semibold">شرح اقدام</Label>
                <Textarea
                  id="initiative-description"
                  {...register('description')}
                  className="mt-1"
                  rows={3}
                />
                {errors.description && <p className="text-destructive text-sm mt-1">{errors.description.message}</p>}
              </div>

              <div>
                <Label htmlFor="initiative-status" className="font-semibold">وضعیت اقدام</Label>
                <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="initiative-status" className="mt-1">
                                <SelectValue placeholder="انتخاب وضعیت" />
                            </SelectTrigger>
                            <SelectContent>
                                {INITIATIVE_STATUSES.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.status && <p className="text-destructive text-sm mt-1">{errors.status.message}</p>}
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">وظایف (Tasks)</h4>
                <div className="space-y-3">
                  {taskFields.map((task, index) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                        <Controller
                            name={`tasks.${index}.completed`}
                            control={control}
                            render={({ field }) => (
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    id={`task-completed-${index}`}
                                />
                            )}
                        />
                      <div className="flex-grow">
                        <Input
                          {...register(`tasks.${index}.description`)}
                          placeholder={`شرح وظیفه #${index + 1}`}
                          className={`bg-card text-sm ${form.watch(`tasks.${index}.completed`) ? 'line-through text-muted-foreground' : ''}`}
                        />
                        {errors.tasks?.[index]?.description && <p className="text-destructive text-xs mt-1">{errors.tasks[index]?.description?.message}</p>}
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeTask(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                 {errors.tasks?.root && <p className="text-destructive text-sm mt-1">{errors.tasks.root.message}</p>}
                <Button type="button" variant="outline" className="w-full mt-4" onClick={() => appendTask({ description: '', completed: false })}>
                    <PlusCircle className="w-4 h-4 ml-2"/>
                    افزودن وظیفه
                </Button>
              </div>
            </div>
          
          <DialogFooter className="mt-8 pt-6 border-t sticky bottom-0 bg-background py-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">انصراف</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90">ذخیره تغییرات</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

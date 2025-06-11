import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, PlusCircle } from 'lucide-react';
import type { Objective, ObjectiveFormData } from '@/types/okr';
import { objectiveFormSchema } from '@/lib/schemas';
import { CONFIDENCE_LEVELS, INITIATIVE_STATUSES, DEFAULT_KEY_RESULT } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ManageObjectiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ObjectiveFormData) => void;
  initialData?: Objective | null;
}

export function ManageObjectiveDialog({ isOpen, onClose, onSubmit, initialData }: ManageObjectiveDialogProps) {
  const form = useForm<ObjectiveFormData>({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: initialData 
      ? { ...initialData, keyResults: initialData.keyResults.length > 0 ? initialData.keyResults.map(kr => ({...kr, progress: kr.progress ?? 0})) : [DEFAULT_KEY_RESULT] }
      : { description: '', keyResults: [DEFAULT_KEY_RESULT] },
  });

  const { fields: krFields, append: appendKr, remove: removeKr } = useFieldArray({
    control: form.control,
    name: 'keyResults',
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset(initialData 
        ? { ...initialData, keyResults: initialData.keyResults.length > 0 ? initialData.keyResults.map(kr => ({...kr, progress: kr.progress ?? 0})) : [DEFAULT_KEY_RESULT] }
        : { description: '', keyResults: [DEFAULT_KEY_RESULT] }
      );
    }
  }, [isOpen, initialData, form.reset]);

  const processSubmit = (data: ObjectiveFormData) => {
    onSubmit(data);
    onClose(); // Ensure dialog closes on successful submit
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline">{initialData ? 'Edit Objective' : 'Add New Objective'}</DialogTitle>
          <DialogDescription>
            Define your objective and its measurable key results and initiatives.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(processSubmit)}>
          <ScrollArea className="max-h-[calc(80vh-150px)] p-1 pr-5">
            <div className="space-y-6 py-2 px-1">
              <div>
                <Label htmlFor="objectiveDescription" className="font-semibold text-base">Objective Description</Label>
                <Textarea
                  id="objectiveDescription"
                  {...form.register('description')}
                  className="mt-1"
                  rows={3}
                  placeholder="e.g., Revolutionize customer support experience"
                />
                {form.formState.errors.description && <p className="text-destructive text-sm mt-1">{form.formState.errors.description.message}</p>}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Key Results</h3>
                {krFields.map((krItem, krIndex) => (
                  <Card key={krItem.id} className="mb-4 p-4 border rounded-lg shadow-sm bg-card">
                    <CardContent className="p-0 space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor={`keyResults.${krIndex}.description`} className="font-medium text-foreground">
                          Key Result #{krIndex + 1}
                        </Label>
                        {krFields.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeKr(krIndex)} className="text-destructive hover:bg-destructive/10 h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Textarea
                        id={`keyResults.${krIndex}.description`}
                        {...form.register(`keyResults.${krIndex}.description`)}
                        placeholder="e.g., Reduce average response time by 20%"
                        rows={2}
                      />
                      {form.formState.errors.keyResults?.[krIndex]?.description && <p className="text-destructive text-sm">{form.formState.errors.keyResults[krIndex]?.description?.message}</p>}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`keyResults.${krIndex}.progress`}>Progress (%)</Label>
                           <Controller
                              name={`keyResults.${krIndex}.progress`}
                              control={form.control}
                              render={({ field }) => (
                                <Input 
                                  type="number"
                                  value={field.value ?? 0}
                                  onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} 
                                  placeholder="0-100"
                                  className="mt-1"
                                  min="0" max="100"
                                />
                              )}
                            />
                          {form.formState.errors.keyResults?.[krIndex]?.progress && <p className="text-destructive text-sm">{form.formState.errors.keyResults[krIndex]?.progress?.message}</p>}
                        </div>
                        <div>
                          <Label htmlFor={`keyResults.${krIndex}.confidenceLevel`}>Confidence Level</Label>
                          <Controller
                            name={`keyResults.${krIndex}.confidenceLevel`}
                            control={form.control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="mt-1">
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
                          {form.formState.errors.keyResults?.[krIndex]?.confidenceLevel && <p className="text-destructive text-sm">{form.formState.errors.keyResults[krIndex]?.confidenceLevel?.message}</p>}
                        </div>
                      </div>

                      <InitiativesArrayField control={form.control} krIndex={krIndex} register={form.register} errors={form.formState.errors} />
                    </CardContent>
                  </Card>
                ))}
                 {form.formState.errors.keyResults?.root && <p className="text-destructive text-sm mt-1">{form.formState.errors.keyResults.root.message}</p>}
                 {form.formState.errors.keyResults?.message && <p className="text-destructive text-sm mt-1">{form.formState.errors.keyResults.message}</p>}
                <Button type="button" variant="outline" onClick={() => appendKr(DEFAULT_KEY_RESULT)} className="mt-2 w-full">
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Key Result
                </Button>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-8 pt-6 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90">Save Objective</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InitiativesArrayField({ control, krIndex, register, errors }: any) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `keyResults.${krIndex}.initiatives`,
  });

  return (
    <div className="mt-4 pt-4 border-t border-border/60 border-dashed">
      <h4 className="text-md font-medium mb-3 text-foreground">Initiatives</h4>
      {fields.map((item, initiativeIndex) => (
        <div key={item.id} className="p-3 mb-3 border rounded-md bg-muted/30 space-y-2 shadow-sm">
          <div className="flex justify-between items-center">
             <Label htmlFor={`keyResults.${krIndex}.initiatives.${initiativeIndex}.description`} className="text-sm font-normal text-muted-foreground">
              Initiative #{initiativeIndex + 1}
            </Label>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(initiativeIndex)} className="text-destructive hover:bg-destructive/10 h-7 w-7">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Input
            id={`keyResults.${krIndex}.initiatives.${initiativeIndex}.description`}
            {...register(`keyResults.${krIndex}.initiatives.${initiativeIndex}.description`)}
            placeholder="e.g., Implement new chatbot flow"
            className="text-sm bg-card"
          />
          {errors.keyResults?.[krIndex]?.initiatives?.[initiativeIndex]?.description && <p className="text-destructive text-xs mt-1">{errors.keyResults[krIndex]?.initiatives[initiativeIndex]?.description?.message}</p>}
          
          <Controller
            name={`keyResults.${krIndex}.initiatives.${initiativeIndex}.status`}
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="text-sm h-9 bg-card">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {INITIATIVE_STATUSES.map(status => (
                    <SelectItem key={status} value={status} className="text-sm">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.keyResults?.[krIndex]?.initiatives?.[initiativeIndex]?.status && <p className="text-destructive text-xs mt-1">{errors.keyResults[krIndex]?.initiatives[initiativeIndex]?.status?.message}</p>}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', status: 'Not Started' })} className="mt-1 w-full">
        <PlusCircle className="w-4 h-4 mr-2" /> Add Initiative
      </Button>
    </div>
  );
}

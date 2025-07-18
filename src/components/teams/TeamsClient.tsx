
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Team, TeamFormData } from '@/types/okr';
import { teamSchema } from '@/lib/schemas';
import { Plus, Trash2, Edit, Users, User, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSession } from 'next-auth/react';
import { getTeams, saveTeam, deleteTeam } from '@/lib/data/actions';

const generateId = () => String(Date.now() + Math.random());

// ManageTeamDialog Component
function ManageTeamDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (team: TeamFormData) => void;
  initialData?: Team | null;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      members: [{ id: generateId(), name: '', avatarUrl: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members',
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
            name: initialData.name,
            members: initialData.members.length > 0 ? initialData.members.map(m => ({...m, id: String(m.id)})) : [{ id: generateId(), name: '', avatarUrl: `https://placehold.co/40x40.png?text=?` }]
        });
      } else {
        reset({
          name: '',
          members: [{ id: generateId(), name: '', avatarUrl: `https://placehold.co/40x40.png?text=?` }],
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = (data: TeamFormData) => {
    const teamToSave: TeamFormData = {
      ...data,
      members: data.members.filter(m => m.name.trim()),
    };
    onSave(teamToSave);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'ویرایش تیم' : 'ایجاد تیم جدید'}</DialogTitle>
          <DialogDescription>نام تیم و اعضای آن را مشخص کنید.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="team-name">نام تیم</Label>
              <Input id="team-name" {...register('name')} className="mt-1" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>اعضای تیم</Label>
              <div className="space-y-3 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/50">
                    <User className="h-5 w-5 text-muted-foreground mt-2.5" />
                    <div className="flex-grow space-y-1">
                        <Input
                        {...register(`members.${index}.name`)}
                        placeholder="نام عضو"
                        />
                         {errors.members?.[index]?.name && <p className="text-xs text-destructive">{errors.members[index]?.name?.message}</p>}
                         <Input
                          {...register(`members.${index}.avatarUrl`)}
                          placeholder="آدرس تصویر آواتار (اختیاری)"
                          className="text-xs"
                        />
                         {errors.members?.[index]?.avatarUrl && <p className="text-xs text-destructive">{errors.members[index]?.avatarUrl?.message}</p>}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)} disabled={fields.length < 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                 {errors.members && typeof errors.members.message === 'string' && <p className="text-sm text-destructive mt-1">{errors.members.message}</p>}
              </div>
              <Button type="button" variant="outline" className="w-full mt-3" onClick={() => append({ id: generateId(), name: '', avatarUrl: '' })}>
                <Plus className="h-4 w-4 ml-2" /> افزودن عضو
              </Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">لغو</Button>
            </DialogClose>
            <Button type="submit">ذخیره</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main TeamsClient Component
export function TeamsClient() {
  const { status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManageTeamDialogOpen, setIsManageTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(true);
      getTeams()
        .then(setTeams)
        .catch(() => toast({ variant: 'destructive', title: 'خطا در بارگذاری تیم‌ها' }))
        .finally(() => setIsLoading(false));
    }
     if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status, toast]);

  const handleAddTeam = () => {
    setEditingTeam(null);
    setIsManageTeamDialogOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setIsManageTeamDialogOpen(true);
  };
  
  const handleDeleteTeam = async (teamId: number) => {
    try {
      const result = await deleteTeam(teamId);
      if (result.success) {
        setTeams(prev => prev.filter(t => t.id !== teamId));
        toast({ title: "تیم حذف شد" });
      } else {
        toast({ variant: 'destructive', title: 'خطا', description: result.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطا در حذف تیم' });
    }
  };

  const handleSaveTeam = async (data: TeamFormData) => {
    try {
      const savedTeam = await saveTeam(data, editingTeam?.id);
      if(editingTeam) {
        setTeams(prev => prev.map(t => t.id === savedTeam.id ? savedTeam : t));
      } else {
        setTeams(prev => [...prev, savedTeam]);
      }
      toast({ title: "تیم ذخیره شد" });
    } catch (error) {
       toast({ variant: 'destructive', title: 'خطا در ذخیره تیم' });
    }
  };

  if (isLoading || status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-16 h-16 text-primary mb-6 animate-spin" />
        <h1 className="text-2xl font-semibold text-muted-foreground">در حال بارگذاری تیم‌ها...</h1>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
            <h1 className="text-2xl font-semibold text-muted-foreground">برای مشاهده تیم‌ها لطفاً وارد شوید.</h1>
        </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold font-headline text-foreground">مدیریت تیم‌ها</h2>
        <Button onClick={handleAddTeam}>
          <Plus className="h-4 w-4 ml-2" /> ایجاد تیم جدید
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center bg-card rounded-lg shadow-md mt-8">
            <Users className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">هنوز تیمی ایجاد نشده است</h2>
            <p className="text-muted-foreground mb-6">با ایجاد اولین تیم خود، مدیریت همکاری را شروع کنید.</p>
            <Button onClick={handleAddTeam} size="lg">
                <Plus className="w-5 h-5 ml-2" /> ایجاد اولین تیم
            </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {teams.map(team => (
            <Card key={team.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    {team.name}
                  </span>
                   <div className="flex items-center gap-2">
                     <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditTeam(team)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">ویرایش</span>
                     </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">حذف</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>آیا از حذف این تیم مطمئن هستید؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            این عمل غیرقابل بازگشت است. تمام اعضای این تیم نیز حذف خواهند شد.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>لغو</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTeam(team.id)}>
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                   </div>
                </CardTitle>
                <CardDescription>{team.members.length} عضو</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 {team.members.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                        {team.members.map(member => (
                            <div key={member.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} data-ai-hint="چهره پروفایل" />
                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-secondary-foreground">{member.name}</span>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">این تیم هنوز عضوی ندارد.</p>
                 )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isManageTeamDialogOpen && (
        <ManageTeamDialog
          isOpen={isManageTeamDialogOpen}
          onClose={() => setIsManageTeamDialogOpen(false)}
          onSave={handleSaveTeam}
          initialData={editingTeam}
        />
      )}
    </>
  );
}

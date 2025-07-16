
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
import type { Team } from '@/types/okr';
import { teamSchema } from '@/lib/schemas';
import { Plus, Trash2, Edit, Users, User } from 'lucide-react';
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
import { Skeleton } from '../ui/skeleton';

const generateId = () => crypto.randomUUID();

// ManageTeamDialog Component
function ManageTeamDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (team: Team) => void;
  initialData?: Team | null;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Team>({
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
            ...initialData,
            members: initialData.members.length > 0 ? initialData.members : [{ id: generateId(), name: '', avatarUrl: `https://placehold.co/40x40.png?text=?` }]
        });
      } else {
        reset({
          name: '',
          members: [{ id: generateId(), name: '', avatarUrl: `https://placehold.co/40x40.png?text=?` }],
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = (data: Team) => {
    const teamToSave: Team = {
      ...data,
      id: initialData?.id || generateId(),
      members: data.members.map(m => ({
          ...m,
          id: m.id || generateId(),
          avatarUrl: m.avatarUrl || `https://placehold.co/40x40.png?text=${m.name.charAt(0) || '?'}`,
      })).filter(m => m.name.trim()), // Filter out members with empty names
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
  const [teams, setTeams] = useState<Team[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isManageTeamDialogOpen, setIsManageTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedTeams = localStorage.getItem('okrTrackerData_teams_fa');
    if (storedTeams) {
      try {
        const parsedTeams = JSON.parse(storedTeams);
        if (Array.isArray(parsedTeams)) {
          setTeams(parsedTeams);
        }
      } catch (error) {
        console.error("Failed to parse teams from localStorage", error);
      }
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('okrTrackerData_teams_fa', JSON.stringify(teams));
    }
  }, [teams, isMounted]);

  const handleAddTeam = () => {
    setEditingTeam(null);
    setIsManageTeamDialogOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setIsManageTeamDialogOpen(true);
  };
  
  const handleDeleteTeam = (teamId: string) => {
    setTeams(prev => prev.filter(t => t.id !== teamId));
    toast({ title: "تیم حذف شد", description: "تیم مورد نظر با موفقیت حذف شد." });
  };

  const handleSaveTeam = (team: Team) => {
    setTeams(prev => {
      const existingTeamIndex = prev.findIndex(t => t.id === team.id);
      if (existingTeamIndex > -1) {
        const newTeams = [...prev];
        newTeams[existingTeamIndex] = team;
        return newTeams;
      }
      return [...prev, team];
    });
    toast({ title: "تیم ذخیره شد", description: "اطلاعات تیم با موفقیت ذخیره شد." });
  };

  if (!isMounted) {
    return (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <Skeleton className="h-10 w-24 rounded-md" />
                        <Skeleton className="h-10 w-24 rounded-md" />
                        <Skeleton className="h-10 w-24 rounded-md" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <Skeleton className="h-10 w-24 rounded-md" />
                        <Skeleton className="h-10 w-24 rounded-md" />
                    </div>
                </CardContent>
            </Card>
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
                            این عمل غیرقابل بازگشت است. تمام اهداف مرتبط با این تیم، ارتباط خود را از دست خواهند داد.
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
                                    <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="چهره پروفایل" />
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

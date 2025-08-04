
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
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
<<<<<<< HEAD
import type { Team, TeamWithMembership } from '@/types/okr';
import { teamSchema } from '@/lib/schemas';
import { Plus, Trash2, Edit, Users, User, Clipboard, Check } from 'lucide-react';
=======
import type { Team, TeamFormData } from '@/types/okr';
import { teamSchema } from '@/lib/schemas';
import { Plus, Trash2, Edit, Users, User, Loader2 } from 'lucide-react';
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
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
<<<<<<< HEAD
import { Skeleton } from '../ui/skeleton';
import { addTeam, deleteTeam, getTeams, updateTeam } from '@/lib/actions';
import { useSession } from 'next-auth/react';
import { Badge } from '../ui/badge';

=======
import { useSession } from 'next-auth/react';
import { getTeams, saveTeam, deleteTeam } from '@/lib/data/actions';

const generateId = () => String(Date.now() + Math.random());

// ManageTeamDialog Component
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
function ManageTeamDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
<<<<<<< HEAD
  onSave: (team: Omit<Team, 'id' | 'ownerId' | 'invitationLink'>) => void;
=======
  onSave: (team: TeamFormData) => void;
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
  initialData?: Team | null;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
<<<<<<< HEAD
  } = useForm<Omit<Team, 'id' | 'ownerId' | 'invitationLink'>>({
    resolver: zodResolver(teamSchema.omit({ id: true, ownerId: true, invitationLink: true })),
=======
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
    defaultValues: {
      name: '',
      members: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
            name: initialData.name,
<<<<<<< HEAD
            members: initialData.members
=======
            members: initialData.members.length > 0 ? initialData.members.map(m => ({...m, id: String(m.id)})) : [{ id: generateId(), name: '', avatarUrl: `https://placehold.co/40x40.png?text=?` }]
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
        });
      } else {
        reset({
          name: '',
          members: [],
        });
      }
    }
  }, [isOpen, initialData, reset]);

<<<<<<< HEAD
  const onSubmit = (data: Omit<Team, 'id' | 'ownerId' | 'invitationLink'>) => {
    onSave(data);
=======
  const onSubmit = (data: TeamFormData) => {
    const teamToSave: TeamFormData = {
      ...data,
      members: data.members.filter(m => m.name.trim()),
    };
    onSave(teamToSave);
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'ویرایش تیم' : 'ایجاد تیم جدید'}</DialogTitle>
          <DialogDescription>نام تیم را مشخص کنید. شما به صورت خودکار ادمین این تیم خواهید شد.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="team-name">نام تیم</Label>
              <Input id="team-name" {...register('name')} className="mt-1" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
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

function InvitationLinkDisplay({ link }: { link: string | null | undefined }) {
  const [copied, setCopied] = useState(false);

  if (!link) {
    return (
        <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md text-center">
            لینک دعوت برای این تیم در دسترس نیست.
        </p>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 p-3 border-dashed border-2 border-primary/30 rounded-lg bg-primary/5">
        <Label className="text-xs font-semibold text-primary">لینک دعوت اختصاصی تیم</Label>
        <div className="flex items-center gap-2 mt-2">
            <Input
                readOnly
                value={link}
                className="text-xs bg-white/50 text-primary-dark truncate"
            />
            <Button size="icon" variant="ghost" onClick={handleCopy} className="h-9 w-9 flex-shrink-0 text-primary hover:bg-primary/10">
                {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
            </Button>
        </div>
    </div>
  );
}

export function TeamsClient() {
<<<<<<< HEAD
  const { data: session } = useSession();
  const [teams, setTeams] = useState<TeamWithMembership[]>([]);
=======
  const { status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
  const [isLoading, setIsLoading] = useState(true);
  const [isManageTeamDialogOpen, setIsManageTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithMembership | null>(null);
  const { toast } = useToast();

<<<<<<< HEAD
  const fetchTeams = useCallback(async () => {
      if (!session?.user?.id) {
          setIsLoading(false);
          return;
      }
      try {
        setIsLoading(true);
        const userTeams = await getTeams();
        setTeams(userTeams);
      } catch (error) {
        toast({ title: 'خطا', description: 'دریافت اطلاعات تیم‌ها با مشکل مواجه شد.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
  }, [session?.user?.id, toast]);


  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);
=======
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
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719

  const handleAddTeam = () => {
    setEditingTeam(null);
    setIsManageTeamDialogOpen(true);
  };

  const handleEditTeam = (team: TeamWithMembership) => {
    setEditingTeam(team);
    setIsManageTeamDialogOpen(true);
  };
  
<<<<<<< HEAD
  const handleDeleteTeamWrapper = async (teamId: number) => {
    try {
        await deleteTeam(teamId);
        await fetchTeams(); // Refetch teams to update the UI
        toast({ title: "تیم حذف شد", description: "تیم مورد نظر با موفقیت حذف شد." });
    } catch(error) {
        toast({ title: "خطا در حذف تیم", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleSaveTeam = async (teamData: Omit<Team, 'id'| 'ownerId' | 'invitationLink'>) => {
     if (!session?.user?.id) {
        toast({ title: "خطا", description: "برای ساخت یا ویرایش تیم باید وارد شوید.", variant: 'destructive' });
        return;
      }
    try {
      if (editingTeam) {
        // Update logic
        await updateTeam({ ...editingTeam, ...teamData });
        toast({ title: "تیم به‌روزرسانی شد" });
      } else {
        // Create logic
        await addTeam({ name: teamData.name }, session.user.id);
        toast({ title: "تیم جدید ساخته شد" });
      }
      await fetchTeams(); // Refetch teams to update the UI
    } catch (error) {
       toast({ title: "خطا", description: "ذخیره اطلاعات تیم با مشکل مواجه شد.", variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {[1, 2].map(i => (
                <Card key={i}>
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
            ))}
=======
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
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
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
<<<<<<< HEAD
                     <Badge variant={team.role === 'admin' ? 'default' : 'secondary'}>{team.role}</Badge>
                     {team.role === 'admin' && (
                        <>
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
                                    این عمل غیرقابل بازگشت است. تمام اهداف و اطلاعات مرتبط با این تیم حذف خواهند شد.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>لغو</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTeamWrapper(team.id)}>
                                    حذف
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </>
                     )}
=======
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
                            این عمل غیرقابل بازگشت است و در صورتی که تیمی به هدفی اختصاص داده نشده باشد حذف خواهد شد.
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
>>>>>>> 800eae5690277b2cebf730d06dc49029ba9a5719
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
                 {team.role === 'admin' && <InvitationLinkDisplay link={team.invitationLink} />}
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

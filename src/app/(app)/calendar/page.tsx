
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  addMonths,
  addWeeks,
  differenceInDays,
  eachWeekOfInterval,
  endOfDay,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  nextDay,
  parseISO,
  setDay,
  startOfDay,
  startOfMonth,
  startOfWeek as dateFnsStartOfWeek,
  endOfWeek as dateFnsEndOfWeek,
} from 'date-fns';
import { faIR } from 'date-fns/locale';

import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarDays, ListFilter, Save, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";


import type { OkrCycle, CalendarSettings, ScheduledMeeting, CalendarSettingsFormData } from '@/types/okr';
import { calendarSettingsSchema } from '@/lib/schemas';
import { MEETING_FREQUENCIES, PERSIAN_WEEK_DAYS, type MeetingFrequencyValue, type PersianWeekDayValue } from '@/lib/constants';

const CALENDAR_SETTINGS_STORAGE_KEY = 'okrCalendarSettings_fa';
const OKR_CYCLE_STORAGE_KEY = 'okrTrackerData_cycle_fa';

export default function CalendarPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [okrCycle, setOkrCycle] = useState<OkrCycle | null>(null);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);
  const { toast } = useToast();

  const { control, handleSubmit, reset, watch, formState: { errors }, setValue } = useForm<CalendarSettingsFormData>({
    resolver: zodResolver(calendarSettingsSchema),
    defaultValues: {
      frequency: 'weekly',
      checkInDayOfWeek: 6, 
    }
  });

  const watchedCheckInDay = watch('checkInDayOfWeek');
  const watchedEvaluationDate = watch('evaluationDate');

  useEffect(() => {
    setIsMounted(true);
    const storedCycle = localStorage.getItem(OKR_CYCLE_STORAGE_KEY);
    if (storedCycle) {
      try {
        const parsedCycle = JSON.parse(storedCycle) as { startDate: string; endDate: string };
        if (parsedCycle.startDate && parsedCycle.endDate) {
          setOkrCycle({
            startDate: parseISO(parsedCycle.startDate),
            endDate: parseISO(parsedCycle.endDate),
          });
        }
      } catch (error) {
        console.error("Failed to parse OKR cycle from localStorage", error);
      }
    }

    const storedSettings = localStorage.getItem(CALENDAR_SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      try {
        const parsedSettings: CalendarSettings = JSON.parse(storedSettings);
        if (parsedSettings.evaluationDate) {
          parsedSettings.evaluationDate = parseISO(parsedSettings.evaluationDate as unknown as string);
        }
        reset({
          frequency: parsedSettings.frequency,
          checkInDayOfWeek: parsedSettings.checkInDayOfWeek,
          evaluationDate: parsedSettings.evaluationDate,
        });
        setCalendarSettings(parsedSettings);
      } catch (error) {
        console.error("Failed to parse calendar settings from localStorage", error);
      }
    }
  }, [reset]);

  useEffect(() => {
    if (isMounted && calendarSettings) {
      const settingsToStore = {
        ...calendarSettings,
        evaluationDate: calendarSettings.evaluationDate ? calendarSettings.evaluationDate.toISOString() : undefined,
      };
      localStorage.setItem(CALENDAR_SETTINGS_STORAGE_KEY, JSON.stringify(settingsToStore));
    }
  }, [calendarSettings, isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    const currentOkrCycleEndDate = okrCycle?.endDate;
    const formCheckInDayOfWeek = typeof watchedCheckInDay === 'string' ? parseInt(watchedCheckInDay, 10) : watchedCheckInDay;

    if (currentOkrCycleEndDate && typeof formCheckInDayOfWeek === 'number' && !isNaN(formCheckInDayOfWeek) && watchedEvaluationDate === undefined) {
      let suggestedDate = setDay(currentOkrCycleEndDate, formCheckInDayOfWeek, { locale: faIR, weekStartsOn: 6 });
      suggestedDate = startOfDay(suggestedDate);

      if (isAfter(suggestedDate, currentOkrCycleEndDate)) {
        suggestedDate = addWeeks(suggestedDate, -1);
      }

      if (okrCycle?.startDate && !isBefore(suggestedDate, startOfDay(okrCycle.startDate))) {
        setValue('evaluationDate', suggestedDate, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [isMounted, okrCycle, watchedCheckInDay, watchedEvaluationDate, setValue]);


  const handleSaveSettings = (data: CalendarSettingsFormData) => {
    const newSettings: CalendarSettings = {
      frequency: data.frequency,
      checkInDayOfWeek: data.checkInDayOfWeek,
      evaluationDate: data.evaluationDate,
    };
    setCalendarSettings(newSettings);
    toast({
      title: "تنظیمات ذخیره شد",
      description: "تنظیمات تقویم جلسات شما با موفقیت ذخیره شد.",
    });
  };

  const scheduledMeetings = useMemo((): ScheduledMeeting[] => {
    if (!okrCycle || !calendarSettings) return [];

    const meetings: ScheduledMeeting[] = [];
    const { startDate, endDate } = okrCycle;
    const { frequency, checkInDayOfWeek, evaluationDate } = calendarSettings;

    let currentDate = startOfDay(startDate);
    let meetingIdCounter = 0;

    if (frequency && checkInDayOfWeek !== undefined) {
      let firstCheckIn = setDay(currentDate, checkInDayOfWeek, { locale: faIR, weekStartsOn: 6 });
      if (isBefore(firstCheckIn, currentDate)) {
        firstCheckIn = addWeeks(firstCheckIn, 1);
      }

      currentDate = startOfDay(firstCheckIn);

      while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
        meetings.push({
          id: `check-in-${meetingIdCounter++}`,
          date: currentDate,
          type: 'check-in',
          title: `جلسه Check-in`,
          status: isPast(currentDate) ? 'past' : (isToday(currentDate) ? 'today' : 'future'),
        });

        let nextMeetingDateCandidate: Date | null = null;
        if (frequency === 'weekly') {
          nextMeetingDateCandidate = addWeeks(currentDate, 1);
        } else if (frequency === 'bi-weekly') {
          nextMeetingDateCandidate = addWeeks(currentDate, 2);
        } else if (frequency === 'monthly') {
          nextMeetingDateCandidate = addMonths(currentDate, 1);
        } else {
          break;
        }
        if (nextMeetingDateCandidate && (isBefore(nextMeetingDateCandidate, endDate) || isSameDay(nextMeetingDateCandidate, endDate))) {
          currentDate = startOfDay(nextMeetingDateCandidate);
        } else {
          break;
        }
      }
    }

    if (evaluationDate && (isBefore(evaluationDate, endDate) || isSameDay(evaluationDate, endDate)) && (isAfter(evaluationDate, startDate) || isSameDay(evaluationDate, startDate)) ) {
      meetings.push({
        id: 'evaluation-meeting',
        date: startOfDay(evaluationDate),
        type: 'evaluation',
        title: 'جلسه ارزیابی نهایی OKR',
        status: isPast(evaluationDate) ? 'past' : (isToday(evaluationDate) ? 'today' : 'future'),
      });
    }

    return meetings.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [okrCycle, calendarSettings]);

  const monthsInCycle = useMemo(() => {
    if (!okrCycle) return [];
    const months = [];
    let currentMonth = startOfMonth(okrCycle.startDate);
    while (isBefore(currentMonth, okrCycle.endDate)) {
        months.push(currentMonth);
        currentMonth = addMonths(currentMonth, 1);
    }
    return months;
  }, [okrCycle]);


  if (!isMounted) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <CalendarDays className="w-16 h-16 text-primary mb-6 animate-pulse" />
          <h1 className="text-2xl font-semibold text-muted-foreground">در حال بارگذاری تقویم...</h1>
        </div>
      </PageContainer>
    );
  }

  if (!okrCycle) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center text-center py-12">
          <Image
              src="https://placehold.co/300x200.png"
              alt="تقویم خالی"
              width={300}
              height={200}
              className="mb-8 rounded-lg shadow-xl"
              data-ai-hint="تقویم هشدار"
          />
          <h1 className="text-3xl font-bold font-headline text-foreground mb-4">تقویم جلسات OKR</h1>
          <Alert variant="destructive" className="max-w-md text-center">
            <AlertTitle className="font-semibold">چرخه OKR تنظیم نشده است</AlertTitle>
            <AlertDescription>
              برای استفاده از تقویم، ابتدا باید یک چرخه OKR (تاریخ شروع و پایان) در صفحه <Link href="/dashboard" className="font-medium text-primary hover:underline">داشبورد</Link> تنظیم کنید.
            </AlertDescription>
          </Alert>
        </div>
      </PageContainer>
    );
  }

  const totalDays = differenceInDays(okrCycle.endDate, okrCycle.startDate) || 1;

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row gap-8">
        <Card className="w-full md:w-1/3 lg:w-1/4 shadow-lg self-start sticky top-6">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <ListFilter className="w-6 h-6 text-primary" />
              تنظیمات جلسات OKR
            </CardTitle>
            <CardDescription>فرکانس و روز جلسات Check-in و تاریخ جلسه ارزیابی را مشخص کنید.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(handleSaveSettings)}>
            <CardContent className="space-y-6">
              <div>
                <Label className="font-medium">فرکانس جلسات Check-in</Label>
                <Controller
                  name="frequency"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="mt-2 grid grid-cols-1 gap-2"
                    >
                      {MEETING_FREQUENCIES.map((freq) => (
                        <Label key={freq.value} htmlFor={`freq-${freq.value}`} className="flex items-center space-x-2 space-x-reverse p-3 border rounded-md hover:bg-muted/50 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                          <RadioGroupItem value={freq.value} id={`freq-${freq.value}`} />
                          <span>{freq.label}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  )}
                />
                {errors.frequency && <p className="text-destructive text-sm mt-1">{errors.frequency.message}</p>}
              </div>

              <div>
                <Label htmlFor="checkInDayOfWeek" className="font-medium">روز جلسات Check-in</Label>
                <Controller
                  name="checkInDayOfWeek"
                  control={control}
                  render={({ field }) => (
                    <Select
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value !== undefined ? String(field.value) : undefined}
                    >
                      <SelectTrigger id="checkInDayOfWeek" className="mt-1">
                        <SelectValue placeholder="انتخاب روز هفته" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERSIAN_WEEK_DAYS.map(day => (
                          <SelectItem key={day.value} value={String(day.value)}>{day.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.checkInDayOfWeek && <p className="text-destructive text-sm mt-1">{errors.checkInDayOfWeek.message}</p>}
              </div>

              <div>
                <Label htmlFor="evaluationDate" className="font-medium">تاریخ جلسه ارزیابی نهایی</Label>
                <Controller
                  name="evaluationDate"
                  control={control}
                  render={({ field }) => (
                     <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        placeholderText="انتخاب تاریخ ارزیابی"
                        className="mt-1"
                        disabled={(date) =>
                            !okrCycle ||
                            isBefore(date, startOfDay(okrCycle.startDate)) ||
                            isAfter(date, endOfDay(okrCycle.endDate))
                        }
                      />
                  )}
                />
                {errors.evaluationDate && <p className="text-destructive text-sm mt-1">{errors.evaluationDate.message}</p>}
                 <p className="text-xs text-muted-foreground mt-1">جلسه ارزیابی باید در طول چرخه OKR باشد.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                <Save className="w-4 h-4 ml-2" />
                ذخیره تنظیمات
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="w-full md:w-2/3 lg:w-3/4 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" />
              زمان‌بندی جلسات
            </CardTitle>
            {okrCycle && (
              <CardDescription>
                چرخه فعلی: {format(okrCycle.startDate, "d MMMM yyyy", { locale: faIR })} تا {format(okrCycle.endDate, "d MMMM yyyy", { locale: faIR })}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-8">
            {scheduledMeetings.length > 0 ? (
                <TooltipProvider delayDuration={100}>
                    <div className="relative h-40 w-full" aria-label="تایم لاین جلسات">
                        <div className="absolute right-0 w-full top-1/2 h-0.5 bg-border -translate-y-1/2" />
                        
                        {/* Month Markers */}
                        {monthsInCycle.map((month, index) => {
                            const daysFromStart = differenceInDays(month, okrCycle.startDate);
                            const positionPercent = (daysFromStart / totalDays) * 100;
                            return (
                                <div key={`month-${index}`}
                                    className="absolute top-1/2 flex flex-col items-center transform translate-x-1/2"
                                    style={{ right: `${positionPercent}%` }}>
                                    <div className="h-2 w-0.5 bg-muted-foreground" />
                                    <span className="mt-1 text-xs text-muted-foreground">{format(month, "MMM", { locale: faIR })}</span>
                                </div>
                            );
                        })}

                        {/* Meeting Pins */}
                        {scheduledMeetings.map(meeting => {
                            const daysFromStart = differenceInDays(meeting.date, okrCycle.startDate);
                            const positionPercent = Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
                            const isPastMeeting = meeting.status === 'past';
                            
                            const pinClasses = cn(
                                "w-7 h-7 transition-transform duration-200 hover:scale-125", {
                                "text-muted-foreground": isPastMeeting,
                                "text-green-600 -rotate-180": meeting.status === 'future',
                                "text-primary -rotate-180 animate-pulse": meeting.status === 'today',
                            });

                            const wrapperClasses = cn("absolute transform translate-x-1/2", {
                                "top-[calc(50%+8px)]": isPastMeeting,
                                "bottom-[calc(50%+8px)]": !isPastMeeting,
                            });
                           
                            return (
                                <Tooltip key={meeting.id}>
                                    <TooltipTrigger asChild>
                                        <div style={{ right: `${positionPercent}%` }} className={wrapperClasses}>
                                            <MapPin className={pinClasses} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-semibold">{meeting.title}</p>
                                        <p className="text-sm text-muted-foreground">{format(meeting.date, "eeee، d MMMM yyyy", { locale: faIR })}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </div>
                </TooltipProvider>
            ) : (
              <div className="text-center py-10">
                <Image
                    src="https://placehold.co/300x200.png"
                    alt="بدون جلسه"
                    width={250}
                    height={160}
                    className="mb-6 rounded-md shadow-md mx-auto"
                    data-ai-hint="تقویم خالی یادداشت"
                />
                <p className="text-muted-foreground">هیچ جلسه‌ای برنامه‌ریزی نشده است.</p>
                <p className="text-sm text-muted-foreground mt-1">لطفاً تنظیمات جلسات را در پنل کنار مشخص کنید تا تایم‌لاین ساخته شود.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function isPast(date: Date): boolean {
  return isBefore(endOfDay(date), startOfDay(new Date()));
}

    
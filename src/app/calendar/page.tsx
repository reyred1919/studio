
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  addMonths,
  addWeeks,
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
import { CalendarDays, CalendarCheck, CalendarClock, CalendarX, ListFilter, Save } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge'; // Added Badge import

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
      checkInDayOfWeek: 6, // Saturday
      // evaluationDate will be undefined by default
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
        const parsedSettings = JSON.parse(storedSettings) as CalendarSettingsFormData; // Use form data type here
         if (parsedSettings.evaluationDate) {
          // Ensure evaluationDate is a Date object if it was stored as string
          parsedSettings.evaluationDate = parseISO(parsedSettings.evaluationDate as unknown as string);
        }
        // setCalendarSettings is for the actual data used in meeting calculations, not just form.
        // However, parsedSettings directly from storage matches CalendarSettings if types are aligned.
        // For clarity, we can cast after parsing date:
        const loadedCalendarSettings: CalendarSettings = {
            frequency: parsedSettings.frequency,
            checkInDayOfWeek: parsedSettings.checkInDayOfWeek, // Should be number if schema transforms
            evaluationDate: parsedSettings.evaluationDate
        };
        setCalendarSettings(loadedCalendarSettings);
        reset(parsedSettings); // Reset form with loaded & parsed values
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

  // Effect to suggest evaluation date
  useEffect(() => {
    if (!isMounted) return;

    const currentOkrCycleEndDate = okrCycle?.endDate;
    // watchedCheckInDay is a number from the form state due to defaultValues and schema transform
    const formCheckInDayOfWeek = watchedCheckInDay; 

    if (currentOkrCycleEndDate && typeof formCheckInDayOfWeek === 'number' && watchedEvaluationDate === undefined) {
      let suggestedDate = setDay(currentOkrCycleEndDate, formCheckInDayOfWeek, { locale: faIR, weekStartsOn: 6 });
      suggestedDate = startOfDay(suggestedDate);

      if (isAfter(suggestedDate, currentOkrCycleEndDate)) {
        suggestedDate = addWeeks(suggestedDate, -1);
      }

      if (okrCycle?.startDate && !isBefore(suggestedDate, startOfDay(okrCycle.startDate))) {
        setValue('evaluationDate', suggestedDate, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [isMounted, okrCycle, watchedCheckInDay, watchedEvaluationDate, setValue, faIR]);


  const handleSaveSettings = (data: CalendarSettingsFormData) => {
    const newSettings: CalendarSettings = {
      frequency: data.frequency,
      checkInDayOfWeek: data.checkInDayOfWeek, // Zod schema already transformed it to number
      evaluationDate: data.evaluationDate,
    };
    setCalendarSettings(newSettings); // This will trigger the useEffect to save to localStorage
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
      
      currentDate = startOfDay(firstCheckIn); // Ensure we start from a clean day

      while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
        meetings.push({
          id: `check-in-${meetingIdCounter++}`,
          date: currentDate,
          type: 'check-in',
          title: `جلسه Check-in (${MEETING_FREQUENCIES.find(f => f.value === frequency)?.label}, ${PERSIAN_WEEK_DAYS.find(d => d.value === checkInDayOfWeek)?.label})`,
          status: isPast(currentDate) ? (isSameDay(currentDate, new Date()) ? 'today' : 'past') : (isSameDay(currentDate, new Date()) ? 'today' : 'future'),
        });

        let nextMeetingDateCandidate: Date | null = null;
        if (frequency === 'weekly') {
          nextMeetingDateCandidate = addWeeks(currentDate, 1);
        } else if (frequency === 'bi-weekly') {
          nextMeetingDateCandidate = addWeeks(currentDate, 2);
        } else if (frequency === 'monthly') {
          const targetMonthDate = addMonths(currentDate, 1);
          let potentialNextDate = setDay(targetMonthDate, checkInDayOfWeek, { locale: faIR, weekStartsOn: 6 });
          
          // If setDay went to the previous month relative to targetMonthDate, or too early in targetMonthDate's month
          // ensure we find the first occurrence of checkInDayOfWeek in or after targetMonthDate's "day".
          if (isBefore(potentialNextDate, startOfDay(targetMonthDate))) {
             // Try to find the day in the week of targetMonthDate or the following weeks
             let attempts = 0; // safety break
             while(isBefore(potentialNextDate, startOfDay(targetMonthDate)) && attempts < 5){
                 potentialNextDate = addWeeks(potentialNextDate, 1); 
                 attempts++;
             }
          }
           // If after multiple attempts, it's still before the original meeting + approx 1 month,
           // it might indicate an issue with very short months or specific day configurations.
           // This part aims to ensure we move forward by at least a few weeks.
           if (isBefore(potentialNextDate, addWeeks(currentDate, 3))) { // Heuristic: must be at least ~3 weeks later
              potentialNextDate = setDay(addMonths(currentDate, 1), checkInDayOfWeek, { locale: faIR, weekStartsOn: 6 });
              // If setDay still results in an early date, advance weekly until it's clearly in the next month's cycle
              while(isBefore(potentialNextDate, addMonths(currentDate,1)) && !isSameDay(potentialNextDate, addMonths(currentDate,1)) ){
                potentialNextDate = addWeeks(potentialNextDate,1);
                if (potentialNextDate > endDate) break; // Don't go past end date
              }
           }
          nextMeetingDateCandidate = potentialNextDate;

        } else {
          break; 
        }
        if (nextMeetingDateCandidate && (isBefore(nextMeetingDateCandidate, endDate) || isSameDay(nextMeetingDateCandidate, endDate))) {
          currentDate = startOfDay(nextMeetingDateCandidate);
        } else {
          break; // Next meeting would be outside the cycle
        }
      }
    }
    
    if (evaluationDate && (isBefore(evaluationDate, endDate) || isSameDay(evaluationDate, endDate)) && (isAfter(evaluationDate, startDate) || isSameDay(evaluationDate, startDate)) ) {
      meetings.push({
        id: 'evaluation-meeting',
        date: startOfDay(evaluationDate),
        type: 'evaluation',
        title: 'جلسه ارزیابی نهایی OKR',
        status: isPast(evaluationDate) ? (isSameDay(evaluationDate, new Date()) ? 'today' : 'past') : (isSameDay(evaluationDate, new Date()) ? 'today' : 'future'),
      });
    }

    return meetings.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [okrCycle, calendarSettings]);

  const getMeetingItemClasses = (status: ScheduledMeeting['status']) => {
    let base = "p-4 rounded-lg shadow-sm flex items-center gap-3 ";
    if (status === 'past') return base + "bg-muted/60 border-muted/80 opacity-70";
    if (status === 'today') return base + "bg-primary/10 border-primary/40 ring-2 ring-primary";
    return base + "bg-card border";
  };

  const getMeetingIcon = (meeting: ScheduledMeeting) => {
    if (meeting.status === 'past') return <CalendarX className="w-5 h-5 text-muted-foreground" />;
    if (meeting.status === 'today') return <CalendarClock className="w-5 h-5 text-primary animate-pulse" />;
    return <CalendarCheck className="w-5 h-5 text-green-600" />;
  };

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
          <CalendarDays className="w-16 h-16 text-primary mb-6" />
          <h1 className="text-3xl font-bold font-headline text-foreground mb-4">تقویم جلسات OKR</h1>
          <Alert variant="destructive" className="max-w-md text-center">
            <AlertTitle className="font-semibold">چرخه OKR تنظیم نشده است</AlertTitle>
            <AlertDescription>
              برای استفاده از تقویم، ابتدا باید یک چرخه OKR (تاریخ شروع و پایان) در صفحه <Link href="/" className="font-medium text-primary hover:underline">داشبورد</Link> تنظیم کنید.
            </AlertDescription>
          </Alert>
        </div>
      </PageContainer>
    );
  }

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
                        onValueChange={(value) => field.onChange(Number(value))} // Ensure number is passed
                        value={String(field.value)} // field.value is number, Select expects string
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
                            !okrCycle || // Disable if no cycle
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
          <CardContent>
            {scheduledMeetings.length > 0 ? (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {scheduledMeetings.map(meeting => (
                  <div key={meeting.id} className={getMeetingItemClasses(meeting.status)}>
                    {getMeetingIcon(meeting)}
                    <div className="flex-grow">
                      <p className={`font-medium ${meeting.status === 'today' ? 'text-primary' : 'text-foreground'}`}>{meeting.title}</p>
                      <p className={`text-sm ${meeting.status === 'today' ? 'text-primary/80' : 'text-muted-foreground'}`}>
                        {format(meeting.date, "eeee، d MMMM yyyy", { locale: faIR })}
                      </p>
                    </div>
                    {meeting.status === 'today' && <Badge variant="default" className="bg-primary text-primary-foreground">امروز</Badge>}
                    {meeting.status === 'future' && <Badge variant="outline" className="border-foreground/50 text-foreground/80">آینده</Badge>}
                    {meeting.status === 'past' && <Badge variant="secondary" className="bg-muted text-muted-foreground">گذشته</Badge>}
                  </div>
                ))}
              </div>
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
                <p className="text-muted-foreground">هیچ جلسه‌ای برنامه‌ریزی نشده است یا تنظیمات تقویم کامل نیست.</p>
                <p className="text-sm text-muted-foreground mt-1">لطفاً تنظیمات جلسات را در پنل کنار مشخص کنید.</p>
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


    

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Objective, OkrCycle, InitiativeStatus } from '@/types/okr';
import type { ConfidenceLevel } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Clock, ArrowRight, GanttChartSquare, Smile, Meh, Frown, AlertTriangle, ChevronsRight } from 'lucide-react';
import { Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { differenceInCalendarDays, format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Link from 'next/link';
import type { ChartConfig } from '@/components/ui/chart';

const initialObjectivesData: Objective[] = [
  {
    id: 'obj1_sample',
    description: 'بهبود قابلیت کشف محصول و پذیرش کاربر برای فصل سوم',
    keyResults: [
      {
        id: 'kr1_1_sample',
        description: 'افزایش ۲۵٪ ثبت‌نام‌های ارگانیک از طریق بازاریابی محتوا',
        progress: 30,
        confidenceLevel: 'متوسط',
        initiatives: [
          { id: 'init1_1_1_sample', description: 'انتشار ۴ پست وبلاگ جدید با کیفیت بالا', status: 'در حال انجام', tasks: [] },
          { id: 'init1_1_2_sample', description: 'بهینه‌سازی ۱۰ مقاله موجود برای SEO', status: 'شروع نشده', tasks: [] },
        ],
      },
      {
        id: 'kr1_2_sample',
        description: 'بهبود نرخ فعال‌سازی کاربران جدید از ۴۰٪ به ۶۰٪',
        progress: 15,
        confidenceLevel: 'کم',
        initiatives: [
          { id: 'init1_2_1_sample', description: 'طراحی مجدد جریان ورود کاربر', status: 'در حال انجام', tasks: [] },
          { id: 'init1_2_2_sample', description: 'پیاده‌سازی تورهای راهنمای درون برنامه‌ای', status: 'مسدود شده', tasks: [] },
        ],
      },
    ],
  },
  {
    id: 'obj2_sample',
    description: 'تقویت بهره‌وری عملیاتی و کاهش هزینه‌های سربار تا فصل چهارم',
    keyResults: [
      {
        id: 'kr2_1_sample',
        description: 'کاهش ۱۵٪ میانگین زمان حل تیکت (از ۴ ساعت به ۳.۴ ساعت)',
        progress: 60,
        confidenceLevel: 'زیاد',
        initiatives: [
          { id: 'init2_1_1_sample', description: 'پیاده‌سازی پایگاه دانش داخلی جدید برای کارشناسان پشتیبانی', status: 'تکمیل شده', tasks: [] },
          { id: 'init2_1_2_sample', description: 'آموزش تیم پشتیبانی در مورد عیب‌یابی پیشرفته', status: 'در حال انجام', tasks: [] },
        ],
      },
    ],
  }
];

const confidenceChartConfig = {
  high: { label: "زیاد", color: "hsl(var(--chart-2))", icon: Smile },
  medium: { label: "متوسط", color: "hsl(var(--chart-4))", icon: Meh },
  low: { label: "کم", color: "hsl(var(--chart-5))", icon: Frown },
  at_risk: { label: "در معرض خطر", color: "hsl(var(--chart-1))", icon: AlertTriangle },
} satisfies ChartConfig;

type ConfidenceChartKey = keyof typeof confidenceChartConfig;

const confidenceLevelToKey: Record<ConfidenceLevel, ConfidenceChartKey> = {
    'زیاد': 'high',
    'متوسط': 'medium',
    'کم': 'low',
    'در معرض خطر': 'at_risk',
};

const initiativeChartConfig = {
    completed: { label: 'تکمیل شده', color: "hsl(var(--chart-2))" },
    in_progress: { label: 'در حال انجام', color: "hsl(var(--primary))" },
    not_started: { label: 'شروع نشده', color: "hsl(var(--muted))" },
    blocked: { label: 'مسدود شده', color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

type InitiativeChartKey = keyof typeof initiativeChartConfig;

const initiativeStatusToKey: Record<InitiativeStatus, InitiativeChartKey> = {
    'تکمیل شده': 'completed',
    'در حال انجام': 'in_progress',
    'شروع نشده': 'not_started',
    'مسدود شده': 'blocked',
};

const getProgressIndicatorClass = (progress: number): string => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
};

const getProgressColorClass = (progress: number): string => {
    if (progress >= 75) return 'text-green-600';
    if (progress >= 40) return 'text-yellow-600';
    return 'text-red-600';
};

const getProgressIcon = (progress: number) => {
    const className = `w-7 h-7 flex-shrink-0 ${getProgressColorClass(progress)}`;
    if (progress >= 75) return <TrendingUp className={className} />;
    if (progress >= 40) return <ChevronsRight className={className} />;
    return <AlertTriangle className={className} />;
};


export function DashboardView() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [okrCycle, setOkrCycle] = useState<OkrCycle | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    let loadedObjectives = initialObjectivesData;
    const storedObjectives = localStorage.getItem('okrTrackerData_objectives_fa');
    if (storedObjectives) {
      try {
        const parsedObjectives = JSON.parse(storedObjectives);
        if (Array.isArray(parsedObjectives) && parsedObjectives.every(obj => obj.id && obj.description)) {
           loadedObjectives = parsedObjectives;
        }
      } catch (error) {
        console.error("Failed to parse Persian objectives from localStorage", error);
      }
    }

    const objectivesWithTasks = loadedObjectives.map(obj => ({
        ...obj,
        keyResults: obj.keyResults.map(kr => ({
            ...kr,
            initiatives: kr.initiatives.map(init => ({
                ...init,
                tasks: init.tasks || [],
            })),
        })),
    }));
    setObjectives(objectivesWithTasks);

    const storedCycle = localStorage.getItem('okrTrackerData_cycle_fa');
    if (storedCycle) {
      try {
        const parsedCycle = JSON.parse(storedCycle) as { startDate: string; endDate: string };
        if (parsedCycle.startDate && parsedCycle.endDate) {
          setOkrCycle({
            startDate: new Date(parsedCycle.startDate),
            endDate: new Date(parsedCycle.endDate),
          });
        }
      } catch (error) {
        console.error("Failed to parse OKR cycle from localStorage", error);
      }
    }
  }, []);

  const summaryStats = useMemo(() => {
    let totalProgressSum = 0;
    let totalKeyResultsCount = 0;

    const krsByConfidence: Record<ConfidenceChartKey, number> = {
      high: 0, medium: 0, low: 0, at_risk: 0,
    };
    const initiativesByStatus: Record<InitiativeChartKey, number> = {
      not_started: 0, in_progress: 0, completed: 0, blocked: 0,
    };
    const objectivesWithProgress: { id: string; description: string; progress: number }[] = [];

    objectives.forEach(obj => {
      let totalKrProgress = 0;
      let keyResultsCountInObj = obj.keyResults.length;
      
      obj.keyResults.forEach(kr => {
        totalProgressSum += kr.progress;
        totalKeyResultsCount++;
        const confidenceKey = confidenceLevelToKey[kr.confidenceLevel];
        if (krsByConfidence[confidenceKey] !== undefined) krsByConfidence[confidenceKey]++;
        
        kr.initiatives.forEach(init => {
            const statusKey = initiativeStatusToKey[init.status];
            if (initiativesByStatus[statusKey] !== undefined) {
              initiativesByStatus[statusKey]++;
            }
        });
        totalKrProgress += kr.progress;
      });
      
      const objectiveProgress = keyResultsCountInObj > 0 ? totalKrProgress / keyResultsCountInObj : 0;
      objectivesWithProgress.push({
        id: obj.id,
        description: obj.description,
        progress: Math.round(objectiveProgress),
      });
    });

    const averageProgress = totalKeyResultsCount > 0 ? totalProgressSum / totalKeyResultsCount : 0;

    let remainingDays: number | null = null;
    let cycleElapsedPercentage: number = 0;
    if (okrCycle && okrCycle.startDate && okrCycle.endDate) {
      const today = new Date(); today.setHours(0,0,0,0);
      const cycleEndDate = new Date(okrCycle.endDate); cycleEndDate.setHours(0,0,0,0);
      const cycleStartDate = new Date(okrCycle.startDate); cycleStartDate.setHours(0,0,0,0);

      remainingDays = differenceInCalendarDays(cycleEndDate, today);
      if (remainingDays < 0) remainingDays = 0;

      const totalCycleDuration = differenceInCalendarDays(cycleEndDate, cycleStartDate);
      if (totalCycleDuration > 0) {
        const elapsedCycleDuration = differenceInCalendarDays(today, cycleStartDate);
        cycleElapsedPercentage = Math.min(100, Math.max(0, (elapsedCycleDuration / totalCycleDuration) * 100));
      } else if (today >= cycleEndDate) {
        cycleElapsedPercentage = 100;
      }
    }
    
    const confidenceChartData = Object.entries(krsByConfidence)
        .map(([key, count]) => ({
            name: key,
            value: count,
            fill: confidenceChartConfig[key as ConfidenceChartKey]?.color,
        }))
        .filter(item => item.value > 0);

    const initiativeChartData = Object.entries(initiativesByStatus)
        .map(([status, count]) => ({ status: status, count }));

    return {
      totalObjectives: objectives.length,
      averageProgress: parseFloat(averageProgress.toFixed(1)),
      remainingDays,
      cycleElapsedPercentage: Math.round(cycleElapsedPercentage),
      cycleDates: okrCycle ? { 
        start: format(okrCycle.startDate, "d MMMM", { locale: faIR }), 
        end: format(okrCycle.endDate, "d MMMM yyyy", { locale: faIR }) 
      } : null,
      confidenceChartData,
      initiativeChartData,
      objectivesWithProgress,
    };
  }, [objectives, okrCycle]);

  if (!isMounted) {
     return (
       <div className="flex flex-col items-center justify-center h-[60vh]">
         <TrendingUp className="w-16 h-16 text-primary mb-6 animate-pulse" />
         <h1 className="text-2xl font-semibold text-muted-foreground">در حال بارگذاری داشبورد...</h1>
       </div>
     );
  }

  return (
    <>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold font-headline text-foreground">داشبورد خلاصه وضعیت OKR</h2>
        <Button asChild>
          <Link href="/objectives">
            مدیریت اهداف
            <ArrowRight className="w-4 h-4 mr-2" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">اهداف فعال</CardTitle>
            <Target className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalObjectives}</div>
            <p className="text-xs text-muted-foreground">اهداف تعریف شده در این چرخه</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">میانگین پیشرفت کل</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.averageProgress}%</div>
            <Progress value={summaryStats.averageProgress} className="h-2 mt-2" indicatorClassName={getProgressIndicatorClass(summaryStats.averageProgress)} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium">نمای زمانی چرخه</CardTitle>
                <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
                <div className="text-lg font-bold">
                    {summaryStats.remainingDays !== null ? `${summaryStats.remainingDays} روز` : 'نامشخص'}
                </div>
                <div className="text-sm text-muted-foreground">
                    {summaryStats.remainingDays !== null ? 'باقیمانده' : 'چرخه تنظیم نشده'}
                </div>
            </div>
            {summaryStats.cycleDates && (
                 <>
                    <Progress value={summaryStats.cycleElapsedPercentage} className="h-2 my-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>شروع: {summaryStats.cycleDates.start}</span>
                        <span>پایان: {summaryStats.cycleDates.end}</span>
                    </div>
                </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">سطح اطمینان نتایج کلیدی</CardTitle>
                <CardDescription>توزیع نتایج کلیدی بر اساس سطح اطمینان.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center min-h-[300px] items-center">
                {summaryStats.confidenceChartData.length > 0 ? (
                <ChartContainer config={confidenceChartConfig} className="mx-auto aspect-square max-h-[250px]">
                    <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" hideLabel nameKey="name"/>}
                    />
                    <Pie
                        data={summaryStats.confidenceChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                        paddingAngle={5}
                    >
                         {summaryStats.confidenceChartData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.fill} className="focus:outline-none" />
                        ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" />}
                      className="[&_.recharts-legend-item-text]:text-muted-foreground"
                    />
                    </PieChart>
                </ChartContainer>
                ) : <p className="text-center text-muted-foreground py-12">داده‌ای برای نمایش وجود ندارد.</p>}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">وضعیت اقدامات</CardTitle>
                <CardDescription>توزیع اقدامات بر اساس وضعیت فعلی آنها.</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[300px] flex items-center">
                {summaryStats.initiativeChartData.some(d => d.count > 0) ? (
                <ChartContainer config={initiativeChartConfig} className="w-full h-[250px]">
                    <BarChart data={summaryStats.initiativeChartData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                      <XAxis type="number" hide />
                      <YAxis 
                        orientation="right"
                        dataKey="status" 
                        type="category" 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={10} 
                        width={80} 
                        tickFormatter={(value) => initiativeChartConfig[value as InitiativeChartKey]?.label || value}
                      />
                      <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="line" nameKey="status" />}
                      />
                      <Bar dataKey="count" layout="vertical" radius={5} barSize={35}>
                          {summaryStats.initiativeChartData.map((entry) => (
                              <Cell key={`cell-${entry.status}`} fill={initiativeChartConfig[entry.status as InitiativeChartKey]?.color || 'hsl(var(--muted))'} />
                          ))}
                      </Bar>
                    </BarChart>
                </ChartContainer>
                ) : <p className="text-center text-muted-foreground py-12 w-full">هیچ اقدامی تعریف نشده است.</p>}
            </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2"><GanttChartSquare className="w-5 h-5 text-primary"/> نمای کلی پیشرفت اهداف</CardTitle>
            <CardDescription>پیشرفت هر هدف بر اساس میانگین پیشرفت نتایج کلیدی آن محاسبه شده است.</CardDescription>
        </CardHeader>
        <CardContent>
            {summaryStats.objectivesWithProgress.length > 0 ? (
                <div className="space-y-4">
                    {summaryStats.objectivesWithProgress.map(obj => (
                        <div key={obj.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors duration-200">
                            {getProgressIcon(obj.progress)}
                            <div className="flex-grow">
                                <p className="font-medium text-foreground truncate mb-1.5">{obj.description}</p>
                                <Progress value={obj.progress} className="h-2.5" indicatorClassName={getProgressIndicatorClass(obj.progress)} />
                            </div>
                            <span className={`text-xl font-bold w-16 text-right ${getProgressColorClass(obj.progress)}`}>{obj.progress}%</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">هنوز هدفی تعریف نشده است.</p>
                    <Button asChild variant="link" className="mt-2">
                        <Link href="/objectives">همین حالا یک هدف اضافه کنید</Link>
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
    </>
  );
}

    

    
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import Image from 'next/image';

export default function CalendarPage() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center text-center py-12">
        <Image 
            src="https://placehold.co/400x250.png" 
            alt="تصویر تقویم" 
            width={400} 
            height={250} 
            className="mb-8 rounded-lg shadow-xl"
            data-ai-hint="تقویم برنامه ریزی"
        />
        <CalendarDays className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-4xl font-bold font-headline text-foreground mb-4">تقویم OKR</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          رویدادها، مهلت‌ها و جلسات مرتبط با OKRهای خود را در این تقویم مشاهده و مدیریت کنید. این قابلیت به زودی در دسترس خواهد بود.
        </p>
        <Card className="w-full max-w-md bg-card shadow-md">
            <CardHeader>
                <CardTitle className="text-center font-headline text-xl">به زودی...</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center">
                    بخش تقویم در حال آماده‌سازی است و به زودی به برنامه اضافه خواهد شد. منتظر خبرهای خوب باشید!
                </p>
            </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

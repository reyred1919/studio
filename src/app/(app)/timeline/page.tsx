import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';
import Image from 'next/image';

export default function TimelinePage() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center text-center py-12">
        <Image 
            src="https://placehold.co/400x250.png" 
            alt="تصویر زمان‌نما" 
            width={400} 
            height={250} 
            className="mb-8 rounded-lg shadow-xl"
            data-ai-hint="زمان تاریخچه"
        />
        <History className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-4xl font-bold font-headline text-foreground mb-4">زمان‌نمای چرخه OKR</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          رخدادها و تغییرات مهم در چرخه OKR خود را در این بخش ثبت و پیگیری کنید. این قابلیت به زودی اضافه خواهد شد.
        </p>
        <Card className="w-full max-w-md bg-card shadow-md">
            <CardHeader>
                <CardTitle className="text-center font-headline text-xl">در حال توسعه</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center">
                    ویژگی زمان‌نمای چرخه OKR به زودی برای ثبت و مشاهده رخدادها فعال خواهد شد. از صبر شما متشکریم.
                </p>
            </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

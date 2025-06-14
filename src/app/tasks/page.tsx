import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';
import Image from 'next/image';

export default function TasksPage() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center text-center py-12">
        <Image 
            src="https://placehold.co/400x250.png" 
            alt="تصویر مدیریت وظایف" 
            width={400} 
            height={250} 
            className="mb-8 rounded-lg shadow-xl"
            data-ai-hint="وظایف چک لیست"
        />
        <ListChecks className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-4xl font-bold font-headline text-foreground mb-4">مدیریت وظیفه‌ها</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          در این بخش می‌توانید وظایف مرتبط با اقدامات (Initiatives) نتایج کلیدی خود را مدیریت کنید. این قابلیت به زودی اضافه خواهد شد.
        </p>
        <Card className="w-full max-w-md bg-card shadow-md">
            <CardHeader>
                <CardTitle className="text-center font-headline text-xl">در دست ساخت</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center">
                    ما در حال کار بر روی این بخش هستیم تا بهترین تجربه را برای شما فراهم کنیم. از شکیبایی شما سپاسگزاریم!
                </p>
            </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

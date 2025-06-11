import { Button } from "@/components/ui/button";
import { Target, Plus } from "lucide-react";
import Image from "next/image";

interface EmptyStateProps {
  onAddObjective: () => void;
}

export function EmptyState({ onAddObjective }: EmptyStateProps) {
  return (
    <div className="text-center py-16 flex flex-col items-center bg-card rounded-lg shadow-md mt-8">
      <Image 
        src="https://placehold.co/300x200.png" 
        alt="تیمی که روی اهداف کار می‌کند" 
        width={300} 
        height={200} 
        className="mb-8 rounded-md shadow-lg"
        data-ai-hint="تیم اهداف" 
      />
      <Target className="w-16 h-16 text-primary mx-auto mb-4" />
      <h2 className="text-2xl font-semibold mb-2 font-headline text-foreground">هنوز هدفی وجود ندارد</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        با افزودن اولین هدف خود، ردیابی اهدافتان را شروع کنید. اهداف و نتایج کلیدی که به وضوح تعریف شده‌اند، اولین قدم به سوی موفقیت هستند.
      </p>
      <Button onClick={onAddObjective} size="lg" className="bg-primary hover:bg-primary/90">
        <Plus className="w-5 h-5 ml-2" />
        اولین هدف خود را اضافه کنید
      </Button>
    </div>
  );
}

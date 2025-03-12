import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface DateNavigationProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
}

export function DateNavigation({ currentDate, onPrevious, onNext }: DateNavigationProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <Button variant="outline" size="icon" onClick={onPrevious}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <h2 className="text-lg font-medium">
        {format(currentDate, 'EEEE M/d')}
      </h2>
      
      <Button variant="outline" size="icon" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

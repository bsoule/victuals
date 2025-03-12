import { Card } from '@/components/ui/card';
import { formatTime } from '@/lib/utils';
import { type Photo } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

interface PhotoGridProps {
  photos: Photo[];
  isLoading: boolean;
}

const GRID_SLOTS = 6; // 2x3 grid

export function PhotoGrid({ photos, isLoading }: PhotoGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 my-4">
        {Array.from({ length: GRID_SLOTS }).map((_, i) => (
          <Skeleton key={i} className="w-full aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 my-4">
      {Array.from({ length: GRID_SLOTS }).map((_, index) => {
        const photo = photos[index];

        if (!photo) {
          return (
            <Card 
              key={`empty-${index}`} 
              className="aspect-square flex items-center justify-center bg-pink-100"
            >
              <span className="text-pink-300">
                {formatTime(new Date(new Date().setHours(9 + Math.floor(index * 2.5))))}
              </span>
            </Card>
          );
        }

        return (
          <Card key={photo.id} className="aspect-square overflow-hidden relative">
            <img 
              src={photo.imageUrl} 
              alt="Food" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
              <span>{formatTime(new Date(photo.takenAt))}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
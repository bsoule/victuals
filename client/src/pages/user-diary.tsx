import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { add, sub } from 'date-fns';
import { PhotoGrid } from '@/components/photo-grid';
import { DateNavigation } from '@/components/date-navigation';
import { PhotoUpload } from '@/components/photo-upload';
import { formatDate } from '@/lib/utils';
import { type Photo } from '@shared/schema';

export default function UserDiary() {
  const { username } = useParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoToReplace, setPhotoToReplace] = useState<number | null>(null);

  const { data: photos, isLoading } = useQuery<Photo[]>({
    queryKey: ['/api/users', username, 'photos', formatDate(currentDate)],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/photos?date=${formatDate(currentDate)}`);
      if (!res.ok) throw new Error('Failed to fetch photos');
      return res.json();
    }
  });

  const handlePreviousDay = () => {
    setCurrentDate(prev => sub(prev, { days: 1 }));
  };

  const handleNextDay = () => {
    setCurrentDate(prev => add(prev, { days: 1 }));
  };

  const handlePhotoReplace = (photoId: number) => {
    setPhotoToReplace(photoId);
    // Trigger file input
    if (photoInputRef.current) {
      photoInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {username}'s Food Diary
        </h1>

        <DateNavigation
          currentDate={currentDate}
          onPrevious={handlePreviousDay}
          onNext={handleNextDay}
        />

        <PhotoGrid 
          photos={photos || []} 
          isLoading={isLoading}
          onPhotoReplace={handlePhotoReplace}
        />

        <PhotoUpload 
          username={username} 
          photoToReplace={photoToReplace}
          onPhotoReplaced={() => setPhotoToReplace(null)}
        />
      </div>
    </div>
  );
}
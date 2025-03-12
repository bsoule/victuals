import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { add, sub } from 'date-fns';
import { PhotoGrid } from '@/components/photo-grid';
import { DateNavigation } from '@/components/date-navigation';
import { PhotoUpload } from '@/components/photo-upload';
import { Comments } from '@/components/comments';
import { formatDate } from '@/lib/utils';
import { type Photo } from '@shared/schema';

export default function UserDiary() {
  const { username } = useParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [photoToReplace, setPhotoToReplace] = useState<number | null>(null);
  const [replacementMode, setReplacementMode] = useState<'camera' | 'gallery' | null>(null);

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

  const handleTakePhoto = (photoId: number) => {
    setPhotoToReplace(photoId);
    setReplacementMode('camera');
  };

  const handleChooseFromGallery = (photoId: number) => {
    setPhotoToReplace(photoId);
    setReplacementMode('gallery');
  };

  const handlePhotoReplaced = () => {
    setPhotoToReplace(null);
    setReplacementMode(null);
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
          onTakePhoto={handleTakePhoto}
          onChooseFromGallery={handleChooseFromGallery}
        />

        <PhotoUpload 
          username={username!} 
          photoToReplace={photoToReplace}
          replacementMode={replacementMode}
          onPhotoReplaced={handlePhotoReplaced}
        />

        <Comments currentDate={currentDate} />
      </div>
    </div>
  );
}
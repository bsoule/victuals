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
  const [activeTimeSlot, setActiveTimeSlot] = useState<number | null>(null);

  // Get the diary owner's user ID
  const { data: user } = useQuery({
    queryKey: ['/api/users', username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    }
  });

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

  const handleTakePhoto = (timeSlot: number) => {
    const existingPhoto = photos?.find(p => p.timeSlot === timeSlot);
    setPhotoToReplace(existingPhoto?.id || null);
    setActiveTimeSlot(timeSlot);
    setReplacementMode('camera');
  };

  const handleChooseFromGallery = (timeSlot: number) => {
    const existingPhoto = photos?.find(p => p.timeSlot === timeSlot);
    setPhotoToReplace(existingPhoto?.id || null);
    setActiveTimeSlot(timeSlot);
    setReplacementMode('gallery');
  };

  const handlePhotoReplaced = () => {
    setPhotoToReplace(null);
    setReplacementMode(null);
    setActiveTimeSlot(null);
  };

  return (
    <div className="min-h-screen bg-background pt-16 pb-4">
      <div className="max-w-lg mx-auto px-4">
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

        <div className="pb-32">
          {user && <Comments currentDate={currentDate} diaryOwnerId={user.id} />}
        </div>

        {activeTimeSlot !== null && (
          <PhotoUpload 
            username={username!} 
            photoToReplace={photoToReplace}
            replacementMode={replacementMode}
            onPhotoReplaced={handlePhotoReplaced}
            timeSlot={activeTimeSlot}
          />
        )}
      </div>
    </div>
  );
}
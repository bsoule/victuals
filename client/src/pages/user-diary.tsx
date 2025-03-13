import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { add, sub } from 'date-fns';
import { PhotoGrid } from '@/components/photo-grid';
import { DateNavigation } from '@/components/date-navigation';
import { PhotoUpload } from '@/components/photo-upload';
import { Comments } from '@/components/comments';
import { formatDate } from '@/lib/utils';
import { type Photo } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import NotFound from '@/pages/not-found';

interface UserDiaryProps {
  username: string;
}

export default function UserDiary({ username }: UserDiaryProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [photoToReplace, setPhotoToReplace] = useState<number | null>(null);
  const [replacementMode, setReplacementMode] = useState<'camera' | 'gallery' | null>(null);

  // Get the diary owner's user ID
  const { data: user, error: userError } = useQuery({
    queryKey: ['/api/users', username],
    queryFn: async () => {
      const res = await apiRequest('POST', '/api/users', { username });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'User not found');
      }
      return data;
    }
  });

  // Show 404 if user doesn't exist
  if (userError) {
    return <NotFound />;
  }

  const { data: photos, isLoading } = useQuery<Photo[]>({
    queryKey: ['/api/users', username, 'photos', formatDate(currentDate)],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/photos?date=${formatDate(currentDate)}`);
      if (!res.ok) throw new Error('Failed to fetch photos');
      return res.json();
    },
    enabled: !!user // Only fetch photos if we have a valid user
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

  // Don't render anything until we confirm user exists
  if (!user) {
    return null;
  }

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
          <Comments currentDate={currentDate} diaryOwnerId={user.id} />
        </div>

        <PhotoUpload
          username={username}
          photoToReplace={photoToReplace}
          replacementMode={replacementMode}
          onPhotoReplaced={handlePhotoReplaced}
        />
      </div>
    </div>
  );
}
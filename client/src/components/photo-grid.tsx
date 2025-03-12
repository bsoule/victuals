import { Card } from '@/components/ui/card';
import { formatTime } from '@/lib/utils';
import { type Photo } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';

interface PhotoGridProps {
  photos: Photo[];
  isLoading: boolean;
  onTakePhoto?: (photoId: number) => void;
  onChooseFromGallery?: (photoId: number) => void;
}

const GRID_SLOTS = 6; // 2x3 grid

export function PhotoGrid({ photos, isLoading, onTakePhoto, onChooseFromGallery }: PhotoGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState('');

  const deleteMutation = useMutation({
    mutationFn: async (photoId: number) => {
      await apiRequest('DELETE', `/api/photos/${photoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "Photo deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive",
      });
    },
  });

  const updateDescriptionMutation = useMutation({
    mutationFn: async ({ photoId, description }: { photoId: number; description: string }) => {
      await apiRequest('PATCH', `/api/photos/${photoId}`, { description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "Description updated successfully",
      });
      setEditingPhotoId(null);
      setEditingDescription('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update description",
        variant: "destructive",
      });
    },
  });

  const handleDescriptionClick = (photo: Photo) => {
    setEditingPhotoId(photo.id);
    setEditingDescription(photo.description || '');
  };

  const handleDescriptionSubmit = (photoId: number) => {
    if (editingDescription !== null) {
      updateDescriptionMutation.mutate({ photoId, description: editingDescription });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, photoId: number) => {
    if (e.key === 'Enter') {
      handleDescriptionSubmit(photoId);
    } else if (e.key === 'Escape') {
      setEditingPhotoId(null);
      setEditingDescription('');
    }
  };

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
          <ContextMenu key={photo.id}>
            <ContextMenuTrigger>
              <Card className="aspect-square overflow-hidden relative">
                <img 
                  src={photo.imageUrl} 
                  alt={photo.description || "Food"} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm flex flex-col gap-1 max-h-[50%]">
                  <span>{formatTime(new Date(photo.takenAt))}</span>
                  {editingPhotoId === photo.id ? (
                    <Input
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      onBlur={() => handleDescriptionSubmit(photo.id)}
                      onKeyDown={(e) => handleKeyPress(e, photo.id)}
                      autoFocus
                      className="text-xs bg-transparent border-none text-white placeholder:text-white/50"
                      placeholder="Add a description..."
                    />
                  ) : (
                    <span 
                      className="text-xs opacity-90 cursor-pointer hover:opacity-100 line-clamp-3 overflow-y-auto"
                      onClick={() => handleDescriptionClick(photo)}
                    >
                      {photo.description || "Tap to add description..."}
                    </span>
                  )}
                </div>
              </Card>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem 
                onClick={() => onTakePhoto?.(photo.id)}
              >
                Take New Photo
              </ContextMenuItem>
              <ContextMenuItem 
                onClick={() => onChooseFromGallery?.(photo.id)}
              >
                Choose from Gallery
              </ContextMenuItem>
              <ContextMenuItem 
                className="text-red-600"
                onClick={() => deleteMutation.mutate(photo.id)}
              >
                Delete Photo
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
}
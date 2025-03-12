import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';

interface PhotoUploadProps {
  username: string;
}

export function PhotoUpload({ username }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('userId', '1'); // In real app, get from context

      const res = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/users', username, 'photos', formatDate(new Date())]
      });
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    mutation.mutate(file);
  };

  return (
    <div className="fixed bottom-4 right-4">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
        id="camera-input"
      />
      <label htmlFor="camera-input">
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full"
          disabled={isUploading}
        >
          <Camera className="h-6 w-6" />
        </Button>
      </label>
    </div>
  );
}

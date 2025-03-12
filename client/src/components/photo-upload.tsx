import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';

interface PhotoUploadProps {
  username: string;
}

export function PhotoUpload({ username }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the user ID for this username
  const { data: user } = useQuery({
    queryKey: ['/api/users', username],
    queryFn: async () => {
      const res = await fetch(`/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      if (!res.ok) throw new Error('Failed to get user');
      return res.json();
    }
  });

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('userId', user?.id.toString() || '');

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
      // Invalidate today's photos query
      queryClient.invalidateQueries({
        queryKey: ['/api/users', username, 'photos', formatDate(new Date())]
      });
      toast({
        title: "Success",
        description: "Photo captured and uploaded successfully",
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
    console.log('File input change event triggered');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    console.log('File selected:', file.name, file.type);
    mutation.mutate(file);
  };

  const triggerCamera = () => {
    console.log('Camera button clicked');
    const input = document.getElementById('camera-input') as HTMLInputElement;
    input?.click();
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
        disabled={isUploading || !user}
      />
      <Button 
        size="icon" 
        className="h-14 w-14 rounded-full shadow-lg"
        disabled={isUploading || !user}
        onClick={triggerCamera}
      >
        {isUploading ? (
          <span className="animate-pulse">...</span>
        ) : (
          <Camera className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
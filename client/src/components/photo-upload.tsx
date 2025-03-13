import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhotoUploadProps {
  username: string;
  photoToReplace?: number | null;
  replacementMode?: 'camera' | 'gallery' | null;
  onPhotoReplaced?: () => void;
}

async function apiRequest(method: string, url: string, body?: FormData | object) {
  const res = await fetch(url, {
    method,
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API request failed: ${errorText}`);
  }
  return res;
}

export function PhotoUpload({ username, photoToReplace, replacementMode, onPhotoReplaced }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the user ID for this username
  const { data: user } = useQuery({
    queryKey: ['/api/users', username],
    queryFn: async () => {
      const res = await apiRequest('POST', '/api/users', { username });
      return res.json();
    }
  });

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('userId', user?.id.toString() || '');
      formData.append('description', description);

      // If we're replacing a photo, delete the old one first
      if (photoToReplace) {
        await apiRequest('DELETE', `/api/photos/${photoToReplace}`);
      }

      console.log('Uploading photo with formData:', {
        userId: user?.id,
        description
      });

      const res = await apiRequest('POST', '/api/photos', formData);
      const data = await res.json();
      console.log('Upload response:', data);
      return data;
    },
    onSuccess: () => {
      // Invalidate today's photos query
      console.log('Invalidating query for date:', formatDate(new Date()));
      queryClient.invalidateQueries({
        queryKey: ['/api/users', username, 'photos', formatDate(new Date())]
      });
      toast({
        title: "Success",
        description: photoToReplace ? "Photo replaced successfully" : "Photo captured and uploaded successfully",
      });
      if (photoToReplace && onPhotoReplaced) {
        onPhotoReplaced();
      }
      // Reset state
      setDescription('');
      setSelectedFile(null);
      setShowDescriptionDialog(false);
    },
    onError: (error) => {
      console.error('Upload error:', error);
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
    setSelectedFile(file);
    setShowDescriptionDialog(true);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      mutation.mutate(selectedFile);
    }
  };

  const triggerCamera = () => {
    console.log('Camera button clicked');
    const input = document.getElementById('camera-input') as HTMLInputElement;
    input?.click();
  };

  const triggerGallery = () => {
    console.log('Gallery button clicked');
    const input = document.getElementById('gallery-input') as HTMLInputElement;
    input?.click();
  };

  // Effect to handle replacement mode changes
  useEffect(() => {
    if (replacementMode === 'camera') {
      triggerCamera();
    } else if (replacementMode === 'gallery') {
      triggerGallery();
    }
  }, [replacementMode]);

  return (
    <>
      <Dialog open={showDescriptionDialog} onOpenChange={setShowDescriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a description</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What's in this photo?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button onClick={handleSubmit} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Photo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-4 right-4 flex gap-2">
        {/* Camera input */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
          id="camera-input"
          disabled={isUploading || !user}
        />

        {/* Gallery input */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          id="gallery-input"
          disabled={isUploading || !user}
        />

        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full shadow-lg"
          disabled={isUploading || !user}
          onClick={triggerGallery}
          variant="outline"
        >
          {isUploading ? (
            <span className="animate-pulse">...</span>
          ) : (
            <Image className="h-6 w-6" />
          )}
        </Button>

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
    </>
  );
}
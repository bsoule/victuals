import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import { type Comment } from '@shared/schema';

interface CommentsProps {
  currentDate: Date;
}

export function Comments({ currentDate }: CommentsProps) {
  const [newComment, setNewComment] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the stored username from localStorage
  const username = localStorage.getItem('food-diary-username');

  // Query to get user ID
  const { data: user } = useQuery({
    queryKey: ['/api/users', username],
    queryFn: async () => {
      const res = await apiRequest('POST', '/api/users', { username });
      return res.json();
    },
    enabled: !!username
  });

  // Query to get comments for current date
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['/api/comments', formatDate(currentDate)],
    queryFn: async () => {
      const res = await fetch(`/api/comments?date=${formatDate(currentDate)}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    }
  });

  // Mutation to add a new comment
  const mutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error('User not found');

      await apiRequest('POST', '/api/comments', {
        userId: Number(user.id), // Ensure userId is a number
        content: content.trim(), // Ensure content is trimmed
        date: currentDate // Send the full Date object
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments'] });
      setNewComment('');
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    mutation.mutate(newComment);
  };

  if (!username) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4">Comments</h3>

      {/* Comment list */}
      <div className="space-y-4 mb-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet</p>
        )}
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={mutation.isPending || !newComment.trim()}
        >
          {mutation.isPending ? "Posting..." : "Post"}
        </Button>
      </form>
    </div>
  );
}
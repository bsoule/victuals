import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatDate, normalizeDate } from '@/lib/utils';
import { type Comment } from '@shared/schema';

interface CommentsProps {
  currentDate: Date;
  diaryOwnerId: number; // The ID of the user whose diary we're viewing
}

export function Comments({ currentDate, diaryOwnerId }: CommentsProps) {
  const [newComment, setNewComment] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the stored username from localStorage (the logged-in user)
  const username = localStorage.getItem('food-diary-username');

  // Query to get comments for the diary owner's date
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['/api/comments', formatDate(currentDate), diaryOwnerId],
    queryFn: async () => {
      console.log('Fetching comments for date:', formatDate(currentDate), 'and user:', diaryOwnerId); // Debug log
      const res = await fetch(`/api/comments?date=${formatDate(currentDate)}&userId=${diaryOwnerId}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      console.log('Fetched comments:', data); // Debug log
      return data;
    },
    enabled: !!diaryOwnerId
  });

  // Mutation to add a new comment
  const mutation = useMutation({
    mutationFn: async (content: string) => {
      if (!username) throw new Error('User not found');
      console.log('Submitting comment with data:', {
        userId: diaryOwnerId,
        username,
        content: content.trim(),
        date: currentDate
      }); // Debug log

      const res = await apiRequest('POST', '/api/comments', {
        userId: diaryOwnerId, // The diary owner's ID
        username: username, // The logged-in user's username
        content: content.trim(),
        date: normalizeDate(currentDate).toISOString()
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments', formatDate(currentDate), diaryOwnerId] });
      setNewComment('');
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: (error) => {
      console.error('Comment error:', error);
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
                    <p className="text-sm font-medium text-primary mb-1">
                      {comment.username}
                    </p>
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
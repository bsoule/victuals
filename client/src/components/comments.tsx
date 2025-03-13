import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatDate, normalizeDate } from '@/lib/utils';
import { type Comment } from '@shared/schema';
import { Pencil, Trash2, X, Check } from 'lucide-react';

interface CommentsProps {
  currentDate: Date;
  diaryOwnerId: number;
}

export function Comments({ currentDate, diaryOwnerId }: CommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the stored username from localStorage (the logged-in user)
  const username = localStorage.getItem('food-diary-username')?.toLowerCase();

  // Query to get comments for the diary owner's date
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['/api/comments', formatDate(currentDate), diaryOwnerId],
    queryFn: async () => {
      console.log('Fetching comments for date:', formatDate(currentDate), 'and user:', diaryOwnerId);
      const res = await fetch(`/api/comments?date=${formatDate(currentDate)}&userId=${diaryOwnerId}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      console.log('Fetched comments:', data);
      return data;
    },
    enabled: !!diaryOwnerId
  });

  // Mutation to add a new comment
  const addMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!username) throw new Error('User not found');

      const res = await apiRequest('POST', '/api/comments', {
        userId: diaryOwnerId,
        username: username,
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

  // Mutation to edit a comment
  const editMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      if (!username) throw new Error('User not found');

      const res = await apiRequest('PATCH', `/api/comments/${id}`, {
        content: content.trim(),
        username // For authorization
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments', formatDate(currentDate), diaryOwnerId] });
      setEditingCommentId(null);
      setEditingContent('');
      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a comment
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!username) throw new Error('User not found');

      await apiRequest('DELETE', `/api/comments/${id}`, {
        username, // For authorization
        diaryOwnerId // Pass the diary owner's ID
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments', formatDate(currentDate), diaryOwnerId] });
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addMutation.mutate(newComment);
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const submitEdit = (id: number) => {
    if (!editingContent.trim()) return;
    editMutation.mutate({ id, content: editingContent });
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
                    {editingCommentId === comment.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => submitEdit(comment.id)}
                          disabled={editMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={cancelEditing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm">{comment.content}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {/* Show edit button only for the comment author */}
                    {comment.username.toLowerCase() === username && !editingCommentId && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing(comment)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {/* Show delete button if user is either comment author or diary owner */}
                    {(comment.username.toLowerCase() === username || diaryOwnerId === comment.userId) && !editingCommentId && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(comment.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
          disabled={addMutation.isPending || !newComment.trim()}
        >
          {addMutation.isPending ? "Posting..." : "Post"}
        </Button>
      </form>
    </div>
  );
}
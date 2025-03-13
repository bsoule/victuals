import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertUserSchema } from '@shared/schema';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const STORAGE_KEY = 'food-diary-username';

export default function Home() {
  const [, setLocation] = useLocation();
  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: '' }
  });

  // Check for existing username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem(STORAGE_KEY);
    if (savedUsername) {
      setLocation(`/${savedUsername}`);
    }
  }, [setLocation]);

  const mutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest('POST', '/api/users', { 
        username: username.toLowerCase() 
      }, {
        params: { create: 'true' }  // Add create flag
      });
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem(STORAGE_KEY, data.username);
      setLocation(`/${data.username}`);
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Food Photo Diary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data.username))}>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter your username to start</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full mt-4"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Loading..." : "Start My Diary"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function Navigation() {
  const [, setLocation] = useLocation();
  const storedUsername = localStorage.getItem('food-diary-username')?.toLowerCase();

  // Always run this query, but only if we have a username
  const { data: user } = useQuery({
    queryKey: ['/api/users', storedUsername],
    queryFn: async () => {
      if (!storedUsername) return null;
      const res = await apiRequest('POST', '/api/users', { username: storedUsername });
      if (!res.ok) {
        localStorage.removeItem('food-diary-username');
        return null;
      }
      return res.json();
    },
    enabled: !!storedUsername
  });

  const handleHome = () => {
    if (user?.username) {
      setLocation(`/${user.username}`);
    } else {
      // If no valid user, go to home page
      localStorage.removeItem('food-diary-username');
      setLocation('/');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('food-diary-username');
    setLocation('/');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b bg-background">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={handleHome}
      >
        <Home className="h-5 w-5" />
      </Button>

      <Button 
        variant="ghost" 
        size="icon"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );
}
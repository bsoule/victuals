import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';

export function Navigation() {
  const [, setLocation] = useLocation();
  const username = localStorage.getItem('food-diary-username')?.toLowerCase();

  const handleHome = () => {
    if (username) {
      setLocation(`/${username}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('food-diary-username');
    setLocation('/');
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
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

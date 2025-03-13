import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';

export function Navigation() {
  const [, setLocation] = useLocation();
  const username = localStorage.getItem('food-diary-username')?.toLowerCase();

  const handleHome = () => {
    if (username) {
      setLocation(`/${username}`);
    } else {
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
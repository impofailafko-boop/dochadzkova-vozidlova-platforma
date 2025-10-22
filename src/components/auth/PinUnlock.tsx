import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Lock, LogOut } from 'lucide-react';

interface PinUnlockProps {
  onUnlock: () => void;
}

const PinUnlock = ({ onUnlock }: PinUnlockProps) => {
  const { user, signOut } = useAuth();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (data) setUserName(data.full_name);
      }
    };
    fetchUserName();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 4) {
      toast.error('PIN musí obsahovať 4 číslice');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('pin_code')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data.pin_code === pin) {
        toast.success('Aplikácia odomknutá');
        onUnlock();
      } else {
        toast.error('Nesprávny PIN kód');
        setPin('');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      toast.error('Chyba pri overovaní PIN kódu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Vitajte späť</CardTitle>
          <CardDescription>
            {userName && `${userName}, `}zadajte svoj PIN kód pre odomknutie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="text-center text-3xl tracking-[1em] h-16"
                autoFocus
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Overujem...' : 'Odomknúť'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">alebo</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full gap-2" 
            onClick={handleLogout}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Odhlásiť sa
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PinUnlock;

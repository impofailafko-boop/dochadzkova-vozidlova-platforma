import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Lock } from 'lucide-react';

interface PinSetupProps {
  onComplete: () => void;
}

const PinSetup = ({ onComplete }: PinSetupProps) => {
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error('PIN musí obsahovať 4 číslice');
      return;
    }

    if (pin !== confirmPin) {
      toast.error('PIN kódy sa nezhodujú');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pin_code: pin })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('PIN kód bol úspešne nastavený');
      onComplete();
    } catch (error) {
      console.error('Error setting PIN:', error);
      toast.error('Nepodarilo sa nastaviť PIN kód');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Nastavte si PIN kód</CardTitle>
          <CardDescription>
            Vytvorte si 4-číselný PIN kód pre rýchle odomknutie aplikácie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN kód (4 číslice)</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin">Potvrďte PIN kód</Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Nastavujem...' : 'Nastaviť PIN kód'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PinSetup;

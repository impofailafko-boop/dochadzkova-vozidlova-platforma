import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Lock } from 'lucide-react';

const PinSettings = () => {
  const { user } = useAuth();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error('PIN musí obsahovať 4 číslice');
      return;
    }

    if (newPin !== confirmPin) {
      toast.error('PIN kódy sa nezhodujú');
      return;
    }

    setIsLoading(true);
    try {
      // Verify current PIN
      const { data: profile } = await supabase
        .from('profiles')
        .select('pin_code')
        .eq('user_id', user?.id)
        .single();

      if (profile?.pin_code !== currentPin) {
        toast.error('Nesprávny aktuálny PIN kód');
        return;
      }

      // Update to new PIN
      const { error } = await supabase
        .from('profiles')
        .update({ pin_code: newPin })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('PIN kód bol úspešne zmenený');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (error) {
      console.error('Error updating PIN:', error);
      toast.error('Nepodarilo sa zmeniť PIN kód');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Nastavenia PIN kódu</h1>
        <p className="text-muted-foreground">
          Zmeňte svoj PIN kód pre odomknutie aplikácie
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Zmena PIN kódu</CardTitle>
              <CardDescription>
                Nastavte nový 4-číselný PIN kód
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPin">Aktuálny PIN kód</Label>
              <Input
                id="currentPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPin">Nový PIN kód</Label>
              <Input
                id="newPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin">Potvrďte nový PIN kód</Label>
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
              {isLoading ? 'Ukladám...' : 'Zmeniť PIN kód'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PinSettings;

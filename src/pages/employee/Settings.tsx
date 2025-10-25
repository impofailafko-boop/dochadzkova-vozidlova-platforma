import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, LogOut, KeyRound, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Settings = () => {
  const { user, role, signOut } = useAuth();
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Change password
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('Heslo musí mať aspoň 6 znakov');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Heslá sa nezhodujú');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Heslo bolo úspešne zmenené');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Nepodarilo sa zmeniť heslo');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Nastavenia</h1>
        <p className="text-muted-foreground">
          Spravujte svoj účet a zabezpečenie
        </p>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informácie o účte
          </CardTitle>
          <CardDescription>Vaše prihlásené údaje</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Celé meno</Label>
              <p className="text-lg font-medium">{profile?.full_name || 'Neuvedené'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="text-lg font-medium">{user?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Telefón</Label>
              <p className="text-lg font-medium">{profile?.phone || 'Neuvedené'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Rola</Label>
              <div className="mt-1">
                <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
                  {role === 'admin' ? 'Administrátor' : 'Zamestnanec'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Zmena hesla
          </CardTitle>
          <CardDescription>Aktualizujte heslo pre prihlásenie</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nové heslo</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Zadajte nové heslo"
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Minimálne 6 znakov</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potvrďte nové heslo</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Zopakujte nové heslo"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mením heslo...
                </>
              ) : (
                'Zmeniť heslo'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Logout */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Odhlásenie
          </CardTitle>
          <CardDescription>Odhláste sa zo svojho účtu</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <LogOut className="h-4 w-4" />
                Odhlásiť sa
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Naozaj sa chcete odhlásiť?</AlertDialogTitle>
                <AlertDialogDescription>
                  Budete presmerovaný na prihlasovaciu stránku.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Zrušiť</AlertDialogCancel>
                <AlertDialogAction onClick={signOut}>
                  Odhlásiť sa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

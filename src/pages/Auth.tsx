import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

// Validation schema for signup form
const signupSchema = z.object({
  email: z.string().trim().email({ message: 'Neplatný email' }).max(255, { message: 'Email musí byť kratší ako 255 znakov' }),
  password: z.string().min(8, { message: 'Heslo musí mať minimálne 8 znakov' }),
  fullName: z.string().trim().min(2, { message: 'Meno musí mať minimálne 2 znaky' }).max(100, { message: 'Meno musí byť kratšie ako 100 znakov' }),
  phone: z.string().trim().regex(/^(\+421|00421)?[0-9]{9,10}$/, { message: 'Neplatné telefónne číslo (použite formát +421XXXXXXXXX)' }),
});

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Neplatný email' }),
  password: z.string().min(1, { message: 'Heslo je povinné' }),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Validate login inputs
        const loginValidation = loginSchema.safeParse({ email, password });
        if (!loginValidation.success) {
          toast.error(loginValidation.error.errors[0].message);
          setLoading(false);
          return;
        }
        
        await signIn(email, password);
        // Navigation will be handled by AuthContext
      } else {
        // Validate signup inputs
        const signupValidation = signupSchema.safeParse({ email, password, fullName, phone });
        if (!signupValidation.success) {
          toast.error(signupValidation.error.errors[0].message);
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, fullName, phone);
        if (!error) {
          setIsLogin(true);
          setPassword('');
          setPhone('');
        }
      }
    } catch (error) {
      toast.error('Nastala neočakávaná chyba');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Car className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Dochádzková platforma</CardTitle>
          <CardDescription>
            Evidencia dochádzky a služobných vozidiel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Prihlásenie</TabsTrigger>
              <TabsTrigger value="signup">Registrácia</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vas@email.sk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Heslo</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Prihlasovanie...' : 'Prihlásiť sa'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Celé meno</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Ján Novák"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefón</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+421 XXX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="vas@email.sk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Heslo</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimálne 8 znakov
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Vytváram účet...' : 'Vytvoriť účet'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

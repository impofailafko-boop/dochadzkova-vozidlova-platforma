import AttendanceButton from '@/components/employee/AttendanceButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Fuel, History, Loader2, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveVehicleLogs } from '@/hooks/useVehicleLogs';
import { ActiveVehicleCard } from '@/components/employee/ActiveVehicleCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Dashboard = () => {
  const { user } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          full_name,
          current_project_id,
          projects:current_project_id(
            id,
            name,
            description
          )
        `)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: activeVehicles = [], isLoading: loadingVehicles } = useActiveVehicleLogs(user?.id);

  // Extract first name from full_name
  const firstName = profile?.full_name?.split(' ')[0] || 'používateľ';

  if (loadingProfile || loadingVehicles) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Vitaj {firstName}</h1>
        <p className="text-muted-foreground">
          Tu nájdeš prehľad svojej dochádzky a rýchly prístup k dôležitým funkciám
        </p>
      </div>

      {/* Current Project Banner */}
      {profile?.projects && (
        <Alert className="border-2 border-primary bg-primary/5">
          <Briefcase className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold mb-2">
            Aktuálny projekt: {profile.projects.name}
          </AlertTitle>
          {profile.projects.description && (
            <AlertDescription className="text-base leading-relaxed">
              <strong className="block mb-1 text-foreground">Inštrukcie:</strong>
              <span className="text-muted-foreground">{profile.projects.description}</span>
            </AlertDescription>
          )}
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Attendance widget */}
        <AttendanceButton />

        {/* Active vehicles if any */}
        {activeVehicles.length > 0 && (
          <ActiveVehicleCard activeVehicles={activeVehicles} />
        )}
      </div>

      {/* Quick actions always visible */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Rýchle akcie</CardTitle>
          <CardDescription className="text-sm">Často používané funkcie</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild className="w-full justify-start gap-2 h-9" variant="outline">
            <Link to="/vehicle-use">
              <Car className="h-4 w-4" />
              Evidovať použitie auta
            </Link>
          </Button>
          <Button asChild className="w-full justify-start gap-2 h-9" variant="outline">
            <Link to="/fueling">
              <Fuel className="h-4 w-4" />
              Pridať tankovanie
            </Link>
          </Button>
          <Button asChild className="w-full justify-start gap-2 h-9" variant="outline">
            <Link to="/history">
              <History className="h-4 w-4" />
              Zobraziť históriu
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

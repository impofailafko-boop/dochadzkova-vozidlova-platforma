import AttendanceButton from '@/components/employee/AttendanceButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Fuel, History, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveVehicleLogs } from '@/hooks/useVehicleLogs';
import { ActiveVehicleCard } from '@/components/employee/ActiveVehicleCard';

const Dashboard = () => {
  const { user } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Vitaj {firstName}</h1>
        <p className="text-muted-foreground">
          Tu nájdeš prehľad svojej dochádzky a rýchly prístup k dôležitým funkciám
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance widget */}
        <AttendanceButton />

        {/* Active vehicles or Quick actions */}
        {activeVehicles.length > 0 ? (
          <ActiveVehicleCard activeVehicles={activeVehicles} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Rýchle akcie</CardTitle>
              <CardDescription>Často používané funkcie</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start gap-2" variant="outline">
                <Link to="/vehicle-use">
                  <Car className="h-4 w-4" />
                  Evidovať použitie auta
                </Link>
              </Button>
              <Button asChild className="w-full justify-start gap-2" variant="outline">
                <Link to="/fueling">
                  <Fuel className="h-4 w-4" />
                  Pridať tankovanie
                </Link>
              </Button>
              <Button asChild className="w-full justify-start gap-2" variant="outline">
                <Link to="/history">
                  <History className="h-4 w-4" />
                  Zobraziť históriu
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick actions always visible below if there are active vehicles */}
      {activeVehicles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rýchle akcie</CardTitle>
            <CardDescription>Často používané funkcie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start gap-2" variant="outline">
              <Link to="/vehicle-use">
                <Car className="h-4 w-4" />
                Evidovať použitie auta
              </Link>
            </Button>
            <Button asChild className="w-full justify-start gap-2" variant="outline">
              <Link to="/fueling">
                <Fuel className="h-4 w-4" />
                Pridať tankovanie
              </Link>
            </Button>
            <Button asChild className="w-full justify-start gap-2" variant="outline">
              <Link to="/history">
                <History className="h-4 w-4" />
                Zobraziť históriu
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;

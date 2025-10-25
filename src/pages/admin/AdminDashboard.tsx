import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Car, FolderKanban, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarWidget } from '@/components/admin/CalendarWidget';
import { AlertsWidget } from '@/components/admin/AlertsWidget';

const AdminDashboard = () => {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
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

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [employeesRes, vehiclesRes, projectsRes, todayAttendanceRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', new Date().toISOString().split('T')[0]),
      ]);

      return {
        employees: employeesRes.count || 0,
        vehicles: vehiclesRes.count || 0,
        projects: projectsRes.count || 0,
        todayAttendance: todayAttendanceRes.count || 0,
      };
    },
  });

  const statCards = [
    {
      title: 'Zamestnanci',
      value: stats?.employees,
      icon: Users,
      description: 'Celkom používateľov',
    },
    {
      title: 'Aktívne vozidlá',
      value: stats?.vehicles,
      icon: Car,
      description: 'V prevádzke',
    },
    {
      title: 'Aktívne projekty',
      value: stats?.projects,
      icon: FolderKanban,
      description: 'Bežiace projekty',
    },
    {
      title: 'Dochádzka dnes',
      value: stats?.todayAttendance,
      icon: Clock,
      description: 'Príchody dnes',
    },
  ];

  // Extract first name from full_name
  const firstName = profile?.full_name?.split(' ')[0] || 'admin';

  if (profileLoading) {
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
          Tu nájdeš prehľad a správu celého systému
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertsWidget />

      <CalendarWidget />
    </div>
  );
};

export default AdminDashboard;

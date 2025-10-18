import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Car, FolderKanban, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [employeesRes, vehiclesRes, projectsRes, todayAttendanceRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('is_active', true),
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Prehľad a správa systému
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
    </div>
  );
};

export default AdminDashboard;

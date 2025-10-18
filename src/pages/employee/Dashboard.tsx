import AttendanceButton from '@/components/employee/AttendanceButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Fuel, History } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Vitajte v systéme evidencie dochádzky a vozidiel
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance widget */}
        <AttendanceButton />

        {/* Quick actions */}
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
      </div>
    </div>
  );
};

export default Dashboard;

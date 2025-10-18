import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { useVehicleLogs } from '@/hooks/useVehicleLogs';
import { useFuelLogs } from '@/hooks/useFuelLogs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Car, Fuel } from 'lucide-react';

const History = () => {
  const { user } = useAuth();
  const { history: attendanceHistory, isLoading: loadingAttendance } = useAttendance(user?.id);
  const { logs: vehicleLogs, isLoading: loadingVehicle } = useVehicleLogs(user?.id);
  const { logs: fuelLogs, isLoading: loadingFuel } = useFuelLogs(user?.id);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">História</h1>
        <p className="text-muted-foreground">
          Prehľad všetkých vašich záznamov
        </p>
      </div>

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance" className="gap-2">
            <Clock className="h-4 w-4" />
            Dochádzka
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="gap-2">
            <Car className="h-4 w-4" />
            Jazdy
          </TabsTrigger>
          <TabsTrigger value="fuel" className="gap-2">
            <Fuel className="h-4 w-4" />
            Tankovania
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>História dochádzky</CardTitle>
              <CardDescription>Posledných 30 dní</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAttendance ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dátum</TableHead>
                      <TableHead>Príchod</TableHead>
                      <TableHead>Odchod</TableHead>
                      <TableHead className="text-right">Hodiny</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceHistory && attendanceHistory.length > 0 ? (
                      attendanceHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {new Date(record.date).toLocaleDateString('sk-SK')}
                          </TableCell>
                          <TableCell>{record.arrival_time || '-'}</TableCell>
                          <TableCell>{record.departure_time || '-'}</TableCell>
                          <TableCell className="text-right">
                            {record.total_hours ? `${record.total_hours}h` : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Žiadne záznamy
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>História jázd</CardTitle>
              <CardDescription>Posledných 30 záznamov</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVehicle ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dátum</TableHead>
                      <TableHead>Vozidlo</TableHead>
                      <TableHead>Projekt</TableHead>
                      <TableHead className="text-right">Kilometre</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleLogs && vehicleLogs.length > 0 ? (
                      vehicleLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {new Date(log.date).toLocaleDateString('sk-SK')}
                          </TableCell>
                          <TableCell>{log.vehicles?.spz}</TableCell>
                          <TableCell>{log.projects?.name}</TableCell>
                          <TableCell className="text-right">
                            {log.km_driven} km
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Žiadne záznamy
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel">
          <Card>
            <CardHeader>
              <CardTitle>História tankovaní</CardTitle>
              <CardDescription>Posledných 30 záznamov</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFuel ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dátum</TableHead>
                      <TableHead>Vozidlo</TableHead>
                      <TableHead className="text-right">Litre</TableHead>
                      <TableHead className="text-right">Cena</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuelLogs && fuelLogs.length > 0 ? (
                      fuelLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {new Date(log.date).toLocaleDateString('sk-SK')}
                          </TableCell>
                          <TableCell>{log.vehicles?.spz}</TableCell>
                          <TableCell className="text-right">
                            {log.liters} L
                          </TableCell>
                          <TableCell className="text-right">
                            {log.price ? `${log.price}€` : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Žiadne záznamy
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;

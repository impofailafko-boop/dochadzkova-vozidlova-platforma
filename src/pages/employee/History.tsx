import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Car, Fuel, CheckCircle2, AlertCircle } from 'lucide-react';
import { CompleteDriveDialog } from '@/components/employee/CompleteDriveDialog';

const History = () => {
  const { user } = useAuth();
  const { getHistory } = useAttendance(user?.id);
  const { data: attendanceHistory, isLoading: loadingAttendance } = getHistory(30);
  const { logs: vehicleLogs, isLoading: loadingVehicle } = useVehicleLogs(user?.id);
  const { logs: fuelLogs, isLoading: loadingFuel } = useFuelLogs(user?.id);
  const [selectedLog, setSelectedLog] = useState<any>(null);

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
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Kilometre</TableHead>
                      <TableHead></TableHead>
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
                          <TableCell>
                            {log.is_completed ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Ukončená
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Prebieha
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {log.is_completed ? `${log.km_driven} km` : `${log.km_start} km →`}
                          </TableCell>
                          <TableCell>
                            {!log.is_completed && (
                              <Button
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                              >
                                Ukončiť
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                      <TableHead>Projekt</TableHead>
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
                          <TableCell>{log.projects?.name || '-'}</TableCell>
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
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
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

      {selectedLog && (
        <CompleteDriveDialog
          open={!!selectedLog}
          onOpenChange={(open) => !open && setSelectedLog(null)}
          log={selectedLog}
        />
      )}
    </div>
  );
};

export default History;

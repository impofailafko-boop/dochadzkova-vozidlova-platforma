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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Clock, Car, Fuel, CheckCircle2, AlertCircle, CalendarIcon, X, ImageIcon, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CompleteDriveDialog } from '@/components/employee/CompleteDriveDialog';
import { EditFuelReceiptDialog } from '@/components/employee/EditFuelReceiptDialog';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { cn, formatHoursToReadable } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const History = () => {
  const { user, role } = useAuth();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [editingFuelLog, setEditingFuelLog] = useState<any>(null);
  
  // Date filtering state
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  // Pagination state
  const [attendancePage, setAttendancePage] = useState(1);
  const [vehiclePage, setVehiclePage] = useState(1);
  const [fuelPage, setFuelPage] = useState(1);
  const itemsPerPage = 20;

  // Format dates for query
  const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
  const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;

  // Fetch data with pagination and filtering
  const { getHistory } = useAttendance(user?.id);
  const attendanceQuery = getHistory({ 
    limit: itemsPerPage, 
    offset: (attendancePage - 1) * itemsPerPage,
    startDate: startDateStr,
    endDate: endDateStr
  });
  
  const vehicleQuery = useVehicleLogs(user?.id, {
    limit: itemsPerPage,
    offset: (vehiclePage - 1) * itemsPerPage,
    startDate: startDateStr,
    endDate: endDateStr
  });
  
  const fuelQuery = useFuelLogs(user?.id, {
    limit: itemsPerPage,
    offset: (fuelPage - 1) * itemsPerPage,
    startDate: startDateStr,
    endDate: endDateStr
  });

  const attendanceHistory = attendanceQuery.data?.data || [];
  const attendanceCount = attendanceQuery.data?.count || 0;
  const loadingAttendance = attendanceQuery.isLoading;

  const vehicleLogs = vehicleQuery.logs || [];
  const vehicleCount = vehicleQuery.count || 0;
  const loadingVehicle = vehicleQuery.isLoading;

  const fuelLogs = fuelQuery.logs || [];
  const fuelCount = fuelQuery.count || 0;
  const loadingFuel = fuelQuery.isLoading;
  const updateFuelLog = fuelQuery.updateLog;
  const isUpdatingFuel = fuelQuery.isUpdating;

  // Calculate total pages
  const attendanceTotalPages = Math.ceil(attendanceCount / itemsPerPage);
  const vehicleTotalPages = Math.ceil(vehicleCount / itemsPerPage);
  const fuelTotalPages = Math.ceil(fuelCount / itemsPerPage);

  // Reset pagination when filters change
  const handleDateChange = () => {
    setAttendancePage(1);
    setVehiclePage(1);
    setFuelPage(1);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    handleDateChange();
  };

  const canEditFuelLog = (fuelLogDate: string) => {
    // Admin môže pridať fotku kedykoľvek
    if (role === 'admin') return true;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Zamestnanec môže editovať len tankovania z dnešného dňa
    if (fuelLogDate !== today) return false;
    
    // Skontrolovať či už neodišiel z práce
    const todayAttendance = attendanceHistory.find(
      (record) => record.date === today
    );
    
    // Ak má departure_time, nemôže už editovať
    return !todayAttendance?.departure_time;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">História</h1>
        <p className="text-muted-foreground">
          Prehľad všetkých vašich záznamov
        </p>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrovanie podľa dátumu</CardTitle>
          <CardDescription>Vyberte časové obdobie pre zobrazenie záznamov</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Od</label>
              <DatePicker
                date={startDate}
                onDateChange={(date) => {
                  setStartDate(date);
                  handleDateChange();
                }}
                placeholder="Od dátumu"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Do</label>
              <DatePicker
                date={endDate}
                onDateChange={(date) => {
                  setEndDate(date);
                  handleDateChange();
                }}
                placeholder="Do dátumu"
              />
            </div>

            {(startDate || endDate) && (
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Zrušiť filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
              <CardDescription>
                {attendanceCount > 0 
                  ? `Zobrazených ${attendanceHistory.length} z ${attendanceCount} záznamov`
                  : 'Žiadne záznamy'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingAttendance ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Dátum</TableHead>
                        <TableHead className="whitespace-nowrap">Príchod</TableHead>
                        <TableHead className="whitespace-nowrap">Odchod</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Hodiny</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceHistory && attendanceHistory.length > 0 ? (
                        attendanceHistory.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {new Date(record.date).toLocaleDateString('sk-SK')}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{record.arrival_time || '-'}</TableCell>
                            <TableCell className="whitespace-nowrap">{record.departure_time || '-'}</TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              {record.total_hours ? formatHoursToReadable(record.total_hours) : '-'}
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
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}

              {/* Pagination */}
              {attendanceTotalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setAttendancePage(Math.max(1, attendancePage - 1))}
                        className={attendancePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: attendanceTotalPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (attendanceTotalPages <= 5) return true;
                        if (page === 1 || page === attendanceTotalPages) return true;
                        if (Math.abs(page - attendancePage) <= 1) return true;
                        return false;
                      })
                      .map((page, idx, arr) => {
                        if (idx > 0 && page - arr[idx - 1] > 1) {
                          return [
                            <PaginationItem key={`ellipsis-${page}`}>
                              <span className="px-4">...</span>
                            </PaginationItem>,
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setAttendancePage(page)}
                                isActive={attendancePage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ];
                        }
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setAttendancePage(page)}
                              isActive={attendancePage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setAttendancePage(Math.min(attendanceTotalPages, attendancePage + 1))}
                        className={attendancePage === attendanceTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>História jázd</CardTitle>
              <CardDescription>
                {vehicleCount > 0 
                  ? `Zobrazených ${vehicleLogs.length} z ${vehicleCount} záznamov`
                  : 'Žiadne záznamy'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingVehicle ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Dátum</TableHead>
                        <TableHead className="whitespace-nowrap">Vozidlo</TableHead>
                        <TableHead className="whitespace-nowrap">Projekt</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Kilometre</TableHead>
                        <TableHead className="whitespace-nowrap">Tachometer (Štart)</TableHead>
                        <TableHead className="whitespace-nowrap">Tachometer (Koniec)</TableHead>
                        <TableHead className="whitespace-nowrap"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicleLogs && vehicleLogs.length > 0 ? (
                        vehicleLogs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {new Date(log.date).toLocaleDateString('sk-SK')}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{log.vehicles?.spz}</TableCell>
                            <TableCell className="whitespace-nowrap">{log.projects?.name}</TableCell>
                            <TableCell className="whitespace-nowrap">
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
                            <TableCell className="text-right whitespace-nowrap">
                              {log.is_completed ? `${log.km_driven} km` : `${log.km_start} km →`}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {log.photo_km_start ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    const { data, error } = await supabase.storage
                                      .from('vehicle-photos')
                                      .createSignedUrl(log.photo_km_start, 3600); // 1 hour expiry
                                    if (data?.signedUrl) {
                                      window.open(data.signedUrl, '_blank');
                                    }
                                  }}
                                >
                                  <ImageIcon className="h-4 w-4 mr-2" />
                                  Zobraziť
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {log.photo_km_end ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    const { data, error } = await supabase.storage
                                      .from('vehicle-photos')
                                      .createSignedUrl(log.photo_km_end, 3600); // 1 hour expiry
                                    if (data?.signedUrl) {
                                      window.open(data.signedUrl, '_blank');
                                    }
                                  }}
                                >
                                  <ImageIcon className="h-4 w-4 mr-2" />
                                  Zobraziť
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
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
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            Žiadne záznamy
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}

              {/* Pagination */}
              {vehicleTotalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setVehiclePage(Math.max(1, vehiclePage - 1))}
                        className={vehiclePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: vehicleTotalPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (vehicleTotalPages <= 5) return true;
                        if (page === 1 || page === vehicleTotalPages) return true;
                        if (Math.abs(page - vehiclePage) <= 1) return true;
                        return false;
                      })
                      .map((page, idx, arr) => {
                        if (idx > 0 && page - arr[idx - 1] > 1) {
                          return [
                            <PaginationItem key={`ellipsis-${page}`}>
                              <span className="px-4">...</span>
                            </PaginationItem>,
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setVehiclePage(page)}
                                isActive={vehiclePage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ];
                        }
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setVehiclePage(page)}
                              isActive={vehiclePage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setVehiclePage(Math.min(vehicleTotalPages, vehiclePage + 1))}
                        className={vehiclePage === vehicleTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel">
          <Card>
            <CardHeader>
              <CardTitle>História tankovaní</CardTitle>
              <CardDescription>
                {fuelCount > 0 
                  ? `Zobrazených ${fuelLogs.length} z ${fuelCount} záznamov`
                  : 'Žiadne záznamy'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingFuel ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Dátum</TableHead>
                        <TableHead className="whitespace-nowrap">Vozidlo</TableHead>
                        <TableHead className="whitespace-nowrap">Projekt</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Litre</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Cena</TableHead>
                        <TableHead className="whitespace-nowrap">Bloček</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fuelLogs && fuelLogs.length > 0 ? (
                        fuelLogs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {new Date(log.date).toLocaleDateString('sk-SK')}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{log.vehicles?.spz}</TableCell>
                            <TableCell className="whitespace-nowrap">{log.projects?.name || '-'}</TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              {log.liters} L
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              {log.price ? `${log.price}€` : '-'}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {log.photo_receipt ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    const { data, error } = await supabase.storage
                                      .from('vehicle-photos')
                                      .createSignedUrl(log.photo_receipt, 3600); // 1 hour expiry
                                    if (data?.signedUrl) {
                                      window.open(data.signedUrl, '_blank');
                                    }
                                  }}
                                >
                                  <ImageIcon className="h-4 w-4 mr-2" />
                                  Zobraziť
                                </Button>
                              ) : canEditFuelLog(log.date) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingFuelLog(log)}
                                >
                                  <Camera className="h-4 w-4 mr-2" />
                                  Pridať
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  Nedá sa pridať
                                </span>
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
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}

              {/* Pagination */}
              {fuelTotalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setFuelPage(Math.max(1, fuelPage - 1))}
                        className={fuelPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: fuelTotalPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (fuelTotalPages <= 5) return true;
                        if (page === 1 || page === fuelTotalPages) return true;
                        if (Math.abs(page - fuelPage) <= 1) return true;
                        return false;
                      })
                      .map((page, idx, arr) => {
                        if (idx > 0 && page - arr[idx - 1] > 1) {
                          return [
                            <PaginationItem key={`ellipsis-${page}`}>
                              <span className="px-4">...</span>
                            </PaginationItem>,
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setFuelPage(page)}
                                isActive={fuelPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ];
                        }
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setFuelPage(page)}
                              isActive={fuelPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setFuelPage(Math.min(fuelTotalPages, fuelPage + 1))}
                        className={fuelPage === fuelTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
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

      <EditFuelReceiptDialog
        open={!!editingFuelLog}
        onClose={() => setEditingFuelLog(null)}
        onUpdate={(fuelLogId, photo) => {
          updateFuelLog({ id: fuelLogId, photo_receipt: photo });
        }}
        fuelLog={editingFuelLog}
        isUpdating={isUpdatingFuel}
      />
    </div>
  );
};

export default History;

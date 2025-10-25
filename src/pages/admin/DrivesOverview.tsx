import { useState } from 'react';
import { useAdminDrives } from '@/hooks/useAdminDrives';
import { useEmployees } from '@/hooks/useEmployees';
import { useAdminVehicles } from '@/hooks/useAdminVehicles';
import { useAdminProjects } from '@/hooks/useAdminProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Download, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';

const DrivesOverview = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    userId: 'all',
    vehicleId: 'all',
    projectId: 'all',
  });

  const [statsProjectFilter, setStatsProjectFilter] = useState('all');

  const { data: drives, isLoading } = useAdminDrives({
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filters.userId !== 'all' && { userId: filters.userId }),
    ...(filters.vehicleId !== 'all' && { vehicleId: filters.vehicleId }),
    ...(filters.projectId !== 'all' && { projectId: filters.projectId }),
  });
  const { employees } = useEmployees();
  const { vehicles } = useAdminVehicles();
  const { projects } = useAdminProjects();

  const filteredDrivesForStats = statsProjectFilter === 'all' 
    ? drives 
    : drives?.filter((d: any) => d.project_id === statsProjectFilter);

  const totalKm = filteredDrivesForStats?.reduce((sum: number, drive: any) => 
    sum + (drive.is_completed ? (drive.km_driven || 0) : 0), 0) || 0;
  const completedDrives = filteredDrivesForStats?.filter((d: any) => d.is_completed).length || 0;
  const inProgressDrives = filteredDrivesForStats?.filter((d: any) => !d.is_completed).length || 0;

  const handleExport = () => {
    if (!drives || drives.length === 0) return;

    const csv = [
      ['Dátum', 'Zamestnanec', 'Vozidlo', 'Projekt', 'Status', 'Km začiatku', 'Km konca', 'Km celkom', 'GPS Start Lat', 'GPS Start Lon', 'GPS End Lat', 'GPS End Lon'].join(','),
      ...drives.map((record: any) => [
        record.date,
        record.profiles?.full_name || '-',
        record.vehicles?.spz || '-',
        record.projects?.name || '-',
        record.is_completed ? 'Ukončená' : 'Prebieha',
        record.km_start,
        record.km_end || '-',
        record.km_driven || '-',
        record.start_latitude || '-',
        record.start_longitude || '-',
        record.end_latitude || '-',
        record.end_longitude || '-',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jazdy_${filters.startDate}_${filters.endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prehľad jázd</h1>
          <p className="text-muted-foreground">Všetky jazdy služobnými vozidlami</p>
        </div>
        <Button onClick={handleExport} disabled={!drives || drives.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Štatistiky</CardTitle>
            <Select
              value={statsProjectFilter}
              onValueChange={setStatsProjectFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Všetky projekty" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">Všetky projekty</SelectItem>
                {projects?.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Celkový počet jázd</p>
              <p className="text-2xl font-bold">{filteredDrivesForStats?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {completedDrives} ukončených, {inProgressDrives} prebieha
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Celkové kilometre</p>
              <p className="text-2xl font-bold">{totalKm.toLocaleString()} km</p>
              <p className="text-xs text-muted-foreground mt-1">Iba ukončené jazdy</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priemerné kilometre</p>
              <p className="text-2xl font-bold">
                {completedDrives > 0 ? Math.round(totalKm / completedDrives) : 0} km
              </p>
              <p className="text-xs text-muted-foreground mt-1">Na jazdu</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
          <CardDescription>Filtrovanie záznamov jázd</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Od dátumu</Label>
              <DatePicker
                date={filters.startDate ? new Date(filters.startDate) : undefined}
                onDateChange={(date) => {
                  setFilters({ ...filters, startDate: date ? date.toISOString().split('T')[0] : '' });
                }}
                placeholder="Od dátumu"
              />
            </div>
            <div className="space-y-2">
              <Label>Do dátumu</Label>
              <DatePicker
                date={filters.endDate ? new Date(filters.endDate) : undefined}
                onDateChange={(date) => {
                  setFilters({ ...filters, endDate: date ? date.toISOString().split('T')[0] : '' });
                }}
                placeholder="Do dátumu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">Zamestnanec</Label>
              <Select
                value={filters.userId}
                onValueChange={(value) => setFilters({ ...filters, userId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Všetci" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">Všetci</SelectItem>
                  {employees?.map((emp: any) => (
                    <SelectItem key={emp.user_id} value={emp.user_id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vozidlo</Label>
              <Select
                value={filters.vehicleId}
                onValueChange={(value) => setFilters({ ...filters, vehicleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Všetky" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">Všetky</SelectItem>
                  {vehicles?.map((vehicle: any) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.spz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Projekt</Label>
              <Select
                value={filters.projectId}
                onValueChange={(value) => setFilters({ ...filters, projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Všetky" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">Všetky</SelectItem>
                  {projects?.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Záznamy jázd</CardTitle>
          <CardDescription>
            {drives?.length || 0} záznamov
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                    <TableHead>Dátum</TableHead>
                    <TableHead>Zamestnanec</TableHead>
                    <TableHead>Vozidlo</TableHead>
                    <TableHead>Projekt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>GPS</TableHead>
                    <TableHead className="text-right">Km</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drives && drives.length > 0 ? (
                    drives.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {new Date(record.date).toLocaleDateString('sk-SK')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{record.profiles?.full_name || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{record.vehicles?.spz || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{record.projects?.name || '-'}</TableCell>
                        <TableCell>
                          {record.is_completed ? (
                            <Badge variant="default" className="gap-1 whitespace-nowrap">
                              <CheckCircle2 className="h-3 w-3" />
                              Ukončená
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 whitespace-nowrap">
                              <AlertCircle className="h-3 w-3" />
                              Prebieha
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {record.start_latitude && record.start_longitude ? (
                              <a
                                href={`https://www.google.com/maps?q=${record.start_latitude},${record.start_longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                title="Poloha začiatku"
                              >
                                <MapPin className="h-3 w-3" />
                                Start
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                            {record.is_completed && record.end_latitude && record.end_longitude && (
                              <>
                                <span className="text-muted-foreground">|</span>
                                <a
                                  href={`https://www.google.com/maps?q=${record.end_latitude},${record.end_longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  title="Poloha konca"
                                >
                                  <MapPin className="h-3 w-3" />
                                  Koniec
                                </a>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {record.is_completed ? `${record.km_driven} km` : `${record.km_start} km →`}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Žiadne záznamy
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DrivesOverview;

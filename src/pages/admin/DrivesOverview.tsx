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
import { Download, CheckCircle2, AlertCircle, MapPin, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { EditDriveDialog } from '@/components/admin/EditDriveDialog';
import { supabase } from '@/integrations/supabase/client';
import { CompleteDriveDialog } from '@/components/admin/CompleteDriveDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const DrivesOverview = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    userId: 'all',
    vehicleId: 'all',
    projectId: 'all',
  });
  const [statsProjectFilter, setStatsProjectFilter] = useState('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driveToDelete, setDriveToDelete] = useState<any>(null);

  const { data: drives, isLoading, updateDrive, deleteDrive, completeDrive, isUpdating, isDeleting, isCompleting } = useAdminDrives({
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filters.userId !== 'all' && { userId: filters.userId }),
    ...(filters.vehicleId !== 'all' && { vehicleId: filters.vehicleId }),
    ...(filters.projectId !== 'all' && { projectId: filters.projectId }),
  });
  const { employees } = useEmployees();
  const { vehicles } = useAdminVehicles();
  const { projects } = useAdminProjects();

  const handleEdit = (record: any) => {
    setSelectedDrive(record);
    setEditDialogOpen(true);
  };

  const handleComplete = (record: any) => {
    setSelectedDrive(record);
    setCompleteDialogOpen(true);
  };

  const handleDeleteClick = (record: any) => {
    setDriveToDelete(record);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (driveToDelete) {
      deleteDrive(driveToDelete.id);
      setDeleteDialogOpen(false);
      setDriveToDelete(null);
    }
  };

  const handleSaveDrive = (id: string, data: any) => {
    updateDrive({ id, ...data });
  };

  const handleCompleteDrive = (id: string, km_end: number, photo_km_end?: File) => {
    completeDrive({ id, km_end, photo_km_end });
  };

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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prehľad jázd</h1>
          <p className="text-muted-foreground">Všetky jazdy služobnými vozidlami</p>
        </div>
        <Button onClick={handleExport} disabled={!drives || drives.length === 0} className="w-full md:w-auto">
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
                    <TableHead className="whitespace-nowrap">Dátum</TableHead>
                    <TableHead className="whitespace-nowrap">Zamestnanec</TableHead>
                    <TableHead className="whitespace-nowrap">Vozidlo</TableHead>
                    <TableHead className="whitespace-nowrap">Projekt</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">GPS</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Km</TableHead>
                    <TableHead className="whitespace-nowrap">Tachometer (Štart)</TableHead>
                    <TableHead className="whitespace-nowrap">Tachometer (Koniec)</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Akcie</TableHead>
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
                        <TableCell className="whitespace-nowrap">
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
                        <TableCell className="whitespace-nowrap">
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
                        <TableCell className="whitespace-nowrap">
                          {record.photo_km_start ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const { data, error } = await supabase.storage
                                  .from('vehicle-photos')
                                  .createSignedUrl(record.photo_km_start, 3600); // 1 hour expiry
                                
                                if (error) {
                                  console.error('Error creating signed URL:', error);
                                  toast.error('Nepodarilo sa načítať fotku');
                                  return;
                                }
                                
                                if (data?.signedUrl) {
                                  window.open(data.signedUrl, '_blank');
                                } else {
                                  toast.error('Fotka nebola nájdená');
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
                          {record.photo_km_end ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const { data, error } = await supabase.storage
                                  .from('vehicle-photos')
                                  .createSignedUrl(record.photo_km_end, 3600); // 1 hour expiry
                                
                                if (error) {
                                  console.error('Error creating signed URL:', error);
                                  toast.error('Nepodarilo sa načítať fotku');
                                  return;
                                }
                                
                                if (data?.signedUrl) {
                                  window.open(data.signedUrl, '_blank');
                                } else {
                                  toast.error('Fotka nebola nájdená');
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
                        <TableCell className="text-right whitespace-nowrap">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                •••
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(record)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Upraviť
                              </DropdownMenuItem>
                              {!record.is_completed && (
                                <DropdownMenuItem onClick={() => handleComplete(record)}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Dokončiť
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDeleteClick(record)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Zmazať
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
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

      {selectedDrive && (
        <>
          <EditDriveDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            drive={selectedDrive}
            vehicles={vehicles || []}
            projects={projects || []}
            onSave={handleSaveDrive}
            isUpdating={isUpdating}
          />
          {!selectedDrive.is_completed && (
            <CompleteDriveDialog
              open={completeDialogOpen}
              onOpenChange={setCompleteDialogOpen}
              drive={selectedDrive}
              onComplete={handleCompleteDrive}
              isCompleting={isCompleting}
            />
          )}
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odstrániť jazdu?</AlertDialogTitle>
            <AlertDialogDescription>
              Táto akcia sa nedá vrátiť späť. Záznam jazdy bude permanentne odstránený.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušiť</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Odstrániť
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DrivesOverview;

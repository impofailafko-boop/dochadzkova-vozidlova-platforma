import { useState } from 'react';
import { useAdminAttendance } from '@/hooks/useAdminAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { useAdminProjects } from '@/hooks/useAdminProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { formatDateToLocalString } from '@/lib/utils';
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
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Download, MapPin, Edit, Trash2, Plus } from 'lucide-react';
import { formatHoursToReadable } from '@/lib/utils';
import { EditAttendanceDialog } from '@/components/admin/EditAttendanceDialog';
import { CreateAttendanceDialog } from '@/components/admin/CreateAttendanceDialog';
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

const AttendanceOverview = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    userId: 'all',
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState<any>(null);

  const { data: attendance, isLoading, updateAttendance, deleteAttendance, createAttendance, isUpdating, isDeleting, isCreating } = useAdminAttendance(
    filters.userId === 'all' 
      ? { startDate: filters.startDate, endDate: filters.endDate }
      : filters
  );
  const { employees } = useEmployees();

  const handleEdit = (record: any) => {
    setSelectedAttendance(record);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (record: any) => {
    setAttendanceToDelete(record);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (attendanceToDelete) {
      deleteAttendance(attendanceToDelete.id);
      setDeleteDialogOpen(false);
      setAttendanceToDelete(null);
    }
  };

  const handleSave = (id: string, data: any) => {
    updateAttendance({ id, ...data });
  };

  const handleCreate = (data: any) => {
    createAttendance(data);
  };

  const handleExport = () => {
    if (!attendance || attendance.length === 0) return;

    const csv = [
      ['Dátum', 'Zamestnanec', 'Projekt', 'Príchod', 'Odchod', 'Hodiny', 'GPS Latitude', 'GPS Longitude'].join(','),
      ...attendance.map((record: any) => [
        record.date,
        record.profiles?.full_name || '-',
        record.projects?.name || '-',
        record.arrival_time || '-',
        record.departure_time || '-',
        record.total_hours || '-',
        record.arrival_latitude || '-',
        record.arrival_longitude || '-',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dochadzka_${filters.startDate}_${filters.endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prehľad dochádzky</h1>
          <p className="text-muted-foreground">Dochádzka všetkých zamestnancov</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button onClick={() => setCreateDialogOpen(true)} variant="outline" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Pridať dochádzku
          </Button>
          <Button onClick={handleExport} disabled={!attendance || attendance.length === 0} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
          <CardDescription>Filtrovanie záznamov dochádzky</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Od dátumu</Label>
              <DatePicker
                date={filters.startDate ? new Date(filters.startDate + 'T00:00:00') : undefined}
                onDateChange={(date) => {
                  setFilters({ ...filters, startDate: date ? formatDateToLocalString(date) : '' });
                }}
                placeholder="Od dátumu"
              />
            </div>
            <div className="space-y-2">
              <Label>Do dátumu</Label>
              <DatePicker
                date={filters.endDate ? new Date(filters.endDate + 'T00:00:00') : undefined}
                onDateChange={(date) => {
                  setFilters({ ...filters, endDate: date ? formatDateToLocalString(date) : '' });
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Záznamy dochádzky</CardTitle>
          <CardDescription>
            {attendance?.length || 0} záznamov
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
                    <TableHead className="whitespace-nowrap">Projekt</TableHead>
                    <TableHead className="whitespace-nowrap">Príchod</TableHead>
                    <TableHead className="whitespace-nowrap">Odchod</TableHead>
                    <TableHead className="whitespace-nowrap">Poloha</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Hodiny</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance && attendance.length > 0 ? (
                    attendance.map((record: any, index: number) => {
                      const currentDate = new Date(record.date).toLocaleDateString('sk-SK');
                      const nextDate = index < attendance.length - 1 
                        ? new Date(attendance[index + 1].date).toLocaleDateString('sk-SK') 
                        : null;
                      const isLastOfDate = nextDate && currentDate !== nextDate;
                      
                      return (
                      <TableRow 
                        key={record.id}
                        className={isLastOfDate ? "border-b-2 border-primary" : ""}
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          {new Date(record.date).toLocaleDateString('sk-SK')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{record.profiles?.full_name || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{record.projects?.name || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{record.arrival_time || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{record.departure_time || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {record.arrival_latitude && record.arrival_longitude ? (
                              <a
                                href={`https://www.google.com/maps?q=${record.arrival_latitude},${record.arrival_longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline"
                              >
                                <MapPin className="h-4 w-4" />
                                Mapa
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                            <span className="text-muted-foreground">/</span>
                            {record.departure_latitude && record.departure_longitude ? (
                              <a
                                href={`https://www.google.com/maps?q=${record.departure_latitude},${record.departure_longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 hover:underline"
                              >
                                <MapPin className="h-4 w-4" />
                                Mapa
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {record.total_hours ? formatHoursToReadable(record.total_hours) : '-'}
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
                              <DropdownMenuItem onClick={() => handleDeleteClick(record)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Zmazať
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      );
                    })
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
        </CardContent>
      </Card>

      {selectedAttendance && (
        <EditAttendanceDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          attendance={selectedAttendance}
          onSave={handleSave}
          isUpdating={isUpdating}
        />
      )}

      <CreateAttendanceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        employees={employees || []}
        onCreate={handleCreate}
        isCreating={isCreating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odstrániť dochádzku?</AlertDialogTitle>
            <AlertDialogDescription>
              Táto akcia sa nedá vrátiť späť. Záznam dochádzky bude permanentne odstránený.
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

export default AttendanceOverview;

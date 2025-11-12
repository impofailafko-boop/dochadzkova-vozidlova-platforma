import { useState } from 'react';
import { useAdminFuelings } from '@/hooks/useAdminFuelings';
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
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Download, Edit, Trash2, Plus, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EditFuelingDialog } from '@/components/admin/EditFuelingDialog';
import { CreateFuelingDialog } from '@/components/admin/CreateFuelingDialog';
import { useAuth } from '@/contexts/AuthContext';
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

const FuelingsOverview = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    userId: 'all',
    vehicleId: 'all',
    projectId: 'all',
  });
  const [statsProjectFilter, setStatsProjectFilter] = useState('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedFueling, setSelectedFueling] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fuelingToDelete, setFuelingToDelete] = useState<any>(null);
  const { user } = useAuth();

  const { data: fuelings, isLoading, updateFueling, deleteFueling, createFueling, isUpdating, isDeleting, isCreating } = useAdminFuelings({
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
    setSelectedFueling(record);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (record: any) => {
    setFuelingToDelete(record);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (fuelingToDelete) {
      deleteFueling(fuelingToDelete.id);
      setDeleteDialogOpen(false);
      setFuelingToDelete(null);
    }
  };

  const handleSaveFueling = (id: string, data: any) => {
    updateFueling({ id, ...data });
  };

  const handleCreateFueling = (data: any) => {
    createFueling(data);
  };

  const filteredFuelingsForStats = statsProjectFilter === 'all' 
    ? fuelings 
    : fuelings?.filter((f: any) => f.project_id === statsProjectFilter);

  const totalLiters = filteredFuelingsForStats?.reduce((sum: number, fuel: any) => sum + (fuel.liters || 0), 0) || 0;
  const totalPrice = filteredFuelingsForStats?.reduce((sum: number, fuel: any) => sum + (fuel.price || 0), 0) || 0;

  const handleExport = () => {
    if (!fuelings || fuelings.length === 0) return;

    const csv = [
      ['Dátum', 'Zamestnanec', 'Vozidlo', 'Projekt', 'Litre', 'Cena', 'Poznámka', 'Bloček'].join(','),
      ...fuelings.map((record: any) => [
        record.date,
        record.profiles?.full_name || '-',
        record.vehicles?.spz || '-',
        record.projects?.name || '-',
        record.liters,
        record.price || '-',
        record.note || '-',
        record.photo_receipt ? 'Áno' : 'Nie',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tankovania_${filters.startDate}_${filters.endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prehľad tankovaní</h1>
          <p className="text-muted-foreground">Všetky tankovania služobných vozidiel</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button onClick={() => setCreateDialogOpen(true)} variant="outline" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Pridať tankovanie
          </Button>
          <Button onClick={handleExport} disabled={!fuelings || fuelings.length === 0} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
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
                    <div className="flex flex-col gap-1 py-1">
                      <span className="font-medium">{project.name}</span>
                      {project.description && (
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {project.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Celkový počet tankovaní</p>
              <p className="text-2xl font-bold">{filteredFuelingsForStats?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Celkové litre</p>
              <p className="text-2xl font-bold">{totalLiters.toFixed(2)} L</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Celkové náklady</p>
              <p className="text-2xl font-bold">{totalPrice.toFixed(2)} €</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
          <CardDescription>Filtrovanie záznamov tankovaní</CardDescription>
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
                      <div className="flex flex-col gap-1 py-1">
                        <span className="font-medium">{project.name}</span>
                        {project.description && (
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {project.description}
                          </span>
                        )}
                      </div>
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
          <CardTitle>Záznamy tankovaní</CardTitle>
          <CardDescription>
            {fuelings?.length || 0} záznamov
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
                    <TableHead className="text-right whitespace-nowrap">Litre</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Cena</TableHead>
                    <TableHead className="whitespace-nowrap">Poznámka</TableHead>
                    <TableHead className="whitespace-nowrap">Bloček</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelings && fuelings.length > 0 ? (
                    fuelings.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {new Date(record.date).toLocaleDateString('sk-SK')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{record.profiles?.full_name || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{record.vehicles?.spz || '-'}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{record.projects?.name || '-'}</span>
                            {record.projects?.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {record.projects.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">{record.liters} L</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {record.price ? `${record.price}€` : '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap max-w-xs truncate">{record.note || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {record.photo_receipt ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const { data, error } = await supabase.storage
                                  .from('vehicle-photos')
                                  .createSignedUrl(record.photo_receipt, 3600); // 1 hour expiry
                                
                                if (error) {
                                  console.error('Error creating signed URL:', error);
                                  toast.error('Nepodarilo sa načítať fotku účtenky');
                                  return;
                                }
                                
                                if (data?.signedUrl) {
                                  window.open(data.signedUrl, '_blank');
                                } else {
                                  toast.error('Účtenka nebola nájdená');
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
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
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

      {selectedFueling && (
        <EditFuelingDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          fueling={selectedFueling}
          vehicles={vehicles || []}
          projects={projects || []}
          onSave={handleSaveFueling}
          isUpdating={isUpdating}
        />
      )}

      <CreateFuelingDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        vehicles={vehicles || []}
        projects={projects || []}
        currentUserId={user?.id || ''}
        onCreate={handleCreateFueling}
        isCreating={isCreating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odstrániť tankovanie?</AlertDialogTitle>
            <AlertDialogDescription>
              Táto akcia sa nedá vrátiť späť. Záznam tankovania bude permanentne odstránený.
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

export default FuelingsOverview;

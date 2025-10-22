import { useState } from 'react';
import { useAdminFuelings } from '@/hooks/useAdminFuelings';
import { useEmployees } from '@/hooks/useEmployees';
import { useAdminVehicles } from '@/hooks/useAdminVehicles';
import { useAdminProjects } from '@/hooks/useAdminProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Download } from 'lucide-react';

const FuelingsOverview = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    userId: 'all',
    vehicleId: 'all',
    projectId: 'all',
  });

  const { data: fuelings, isLoading } = useAdminFuelings({
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filters.userId !== 'all' && { userId: filters.userId }),
    ...(filters.vehicleId !== 'all' && { vehicleId: filters.vehicleId }),
    ...(filters.projectId !== 'all' && { projectId: filters.projectId }),
  });
  const { employees } = useEmployees();
  const { vehicles } = useAdminVehicles();
  const { projects } = useAdminProjects();

  const totalLiters = fuelings?.reduce((sum: number, fuel: any) => sum + (fuel.liters || 0), 0) || 0;
  const totalPrice = fuelings?.reduce((sum: number, fuel: any) => sum + (fuel.price || 0), 0) || 0;

  const handleExport = () => {
    if (!fuelings || fuelings.length === 0) return;

    const csv = [
      ['Dátum', 'Zamestnanec', 'Vozidlo', 'Projekt', 'Litre', 'Cena', 'Poznámka'].join(','),
      ...fuelings.map((record: any) => [
        record.date,
        record.profiles?.full_name || '-',
        record.vehicles?.spz || '-',
        record.projects?.name || '-',
        record.liters,
        record.price || '-',
        record.note || '-',
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prehľad tankovaní</h1>
          <p className="text-muted-foreground">Všetky tankovania služobných vozidiel</p>
        </div>
        <Button onClick={handleExport} disabled={!fuelings || fuelings.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Štatistiky</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Celkový počet tankovaní</p>
              <p className="text-2xl font-bold">{fuelings?.length || 0}</p>
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
              <Label htmlFor="startDate">Od dátumu</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Do dátumu</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
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
                        <TableCell className="whitespace-nowrap">{record.projects?.name || '-'}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">{record.liters} L</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {record.price ? `${record.price}€` : '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap max-w-xs truncate">{record.note || '-'}</TableCell>
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

export default FuelingsOverview;

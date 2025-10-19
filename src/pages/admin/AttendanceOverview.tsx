import { useState } from 'react';
import { useAdminAttendance } from '@/hooks/useAdminAttendance';
import { useEmployees } from '@/hooks/useEmployees';
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
import { Download } from 'lucide-react';

const AttendanceOverview = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    userId: 'all',
  });

  const { data: attendance, isLoading } = useAdminAttendance(
    filters.userId === 'all' 
      ? { startDate: filters.startDate, endDate: filters.endDate }
      : filters
  );
  const { employees } = useEmployees();

  const handleExport = () => {
    if (!attendance || attendance.length === 0) return;

    const csv = [
      ['Dátum', 'Zamestnanec', 'Príchod', 'Odchod', 'Hodiny'].join(','),
      ...attendance.map((record: any) => [
        record.date,
        record.profiles?.full_name || '-',
        record.arrival_time || '-',
        record.departure_time || '-',
        record.total_hours || '-',
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prehľad dochádzky</h1>
          <p className="text-muted-foreground">Dochádzka všetkých zamestnancov</p>
        </div>
        <Button onClick={handleExport} disabled={!attendance || attendance.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
          <CardDescription>Filtrovanie záznamov dochádzky</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dátum</TableHead>
                  <TableHead>Zamestnanec</TableHead>
                  <TableHead>Príchod</TableHead>
                  <TableHead>Odchod</TableHead>
                  <TableHead className="text-right">Hodiny</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance && attendance.length > 0 ? (
                  attendance.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.date).toLocaleDateString('sk-SK')}
                      </TableCell>
                      <TableCell>{record.profiles?.full_name || '-'}</TableCell>
                      <TableCell>{record.arrival_time || '-'}</TableCell>
                      <TableCell>{record.departure_time || '-'}</TableCell>
                      <TableCell className="text-right">
                        {record.total_hours ? `${record.total_hours}h` : '-'}
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
    </div>
  );
};

export default AttendanceOverview;

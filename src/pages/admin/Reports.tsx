import { useState, useMemo } from 'react';
import { useAdminAttendance } from '@/hooks/useAdminAttendance';
import { useAdminDrives } from '@/hooks/useAdminDrives';
import { useAdminFuelings } from '@/hooks/useAdminFuelings';
import { useAdminProjects } from '@/hooks/useAdminProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, FileSpreadsheet, FileDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as XLSX from 'xlsx';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const { projects, isLoading: loadingProjects } = useAdminProjects();
  const { data: attendance, isLoading: loadingAttendance } = useAdminAttendance(dateRange);
  const { data: drives, isLoading: loadingDrives } = useAdminDrives(dateRange);
  const { data: fuelings, isLoading: loadingFuelings } = useAdminFuelings(dateRange);

  // Filter data by selected project
  const filteredDrives = useMemo(() => {
    if (!drives) return [];
    if (selectedProject === 'all') return drives;
    return drives.filter((drive: any) => drive.project_id === selectedProject);
  }, [drives, selectedProject]);

  const filteredFuelings = useMemo(() => {
    if (!fuelings) return [];
    if (selectedProject === 'all') return fuelings;
    return fuelings.filter((fuel: any) => fuel.project_id === selectedProject);
  }, [fuelings, selectedProject]);

  // Get user IDs who worked on the selected project (from drives)
  const projectUserIds = useMemo(() => {
    if (selectedProject === 'all') return [];
    return [...new Set(filteredDrives.map((drive: any) => drive.user_id))];
  }, [filteredDrives, selectedProject]);

  // Filter attendance by project users
  const filteredAttendance = useMemo(() => {
    if (!attendance) return [];
    if (selectedProject === 'all') return attendance;
    return attendance.filter((att: any) => projectUserIds.includes(att.user_id));
  }, [attendance, selectedProject, projectUserIds]);

  // Calculate project statistics
  const projectStats = useMemo(() => {
    // Employee stats
    const employeeStats = new Map<string, { name: string; hours: number }>();
    filteredAttendance.forEach((att: any) => {
      const existing = employeeStats.get(att.user_id) || { name: att.profiles?.full_name || '-', hours: 0 };
      employeeStats.set(att.user_id, {
        name: existing.name,
        hours: existing.hours + (att.total_hours || 0)
      });
    });

    // Vehicle stats
    const vehicleStats = new Map<string, { spz: string; km: number }>();
    filteredDrives.forEach((drive: any) => {
      const spz = drive.vehicles?.spz || '-';
      const existing = vehicleStats.get(drive.vehicle_id) || { spz, km: 0 };
      vehicleStats.set(drive.vehicle_id, {
        spz: existing.spz,
        km: existing.km + (drive.km_driven || 0)
      });
    });

    const totalLiters = filteredFuelings.reduce((sum: number, fuel: any) => sum + (fuel.liters || 0), 0);

    return {
      employees: Array.from(employeeStats.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        hours: data.hours
      })),
      vehicles: Array.from(vehicleStats.entries()).map(([id, data]) => ({
        id,
        spz: data.spz,
        km: data.km
      })),
      totalLiters
    };
  }, [filteredAttendance, filteredDrives, filteredFuelings]);

  const totalHours = filteredAttendance?.reduce((sum: number, record: any) => sum + (record.total_hours || 0), 0) || 0;
  const totalKm = filteredDrives?.reduce((sum: number, drive: any) => sum + (drive.km_driven || 0), 0) || 0;
  const totalFuelCost = filteredFuelings?.reduce((sum: number, fuel: any) => sum + (fuel.price || 0), 0) || 0;
  const totalLiters = filteredFuelings?.reduce((sum: number, fuel: any) => sum + (fuel.liters || 0), 0) || 0;

  const handleExportCSV = () => {
    if (attendance && attendance.length > 0) {
      const attendanceCsv = [
        ['DOCHÁDZKA'].join(','),
        ['Dátum', 'Zamestnanec', 'Príchod', 'Odchod', 'Hodiny'].join(','),
        ...attendance.map((record: any) => [
          record.date,
          record.profiles?.full_name || '-',
          record.arrival_time || '-',
          record.departure_time || '-',
          record.total_hours || '-',
        ].join(',')),
        [],
      ].join('\n');

      const drivesCsv = drives && drives.length > 0 ? [
        ['JAZDY'].join(','),
        ['Dátum', 'Zamestnanec', 'Vozidlo', 'Projekt', 'Km'].join(','),
        ...drives.map((record: any) => [
          record.date,
          record.profiles?.full_name || '-',
          record.vehicles?.spz || '-',
          record.projects?.name || '-',
          record.km_driven,
        ].join(',')),
        [],
      ].join('\n') : '';

      const fuelingsCsv = fuelings && fuelings.length > 0 ? [
        ['TANKOVANIA'].join(','),
        ['Dátum', 'Zamestnanec', 'Vozidlo', 'Litre', 'Cena'].join(','),
        ...fuelings.map((record: any) => [
          record.date,
          record.profiles?.full_name || '-',
          record.vehicles?.spz || '-',
          record.liters,
          record.price || '-',
        ].join(',')),
      ].join('\n') : '';

      const fullCsv = `${attendanceCsv}\n${drivesCsv}\n${fuelingsCsv}`;

      const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kompletny_report_${dateRange.startDate}_${dateRange.endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Attendance sheet
    if (attendance && attendance.length > 0) {
      const attendanceData = [
        ['Dátum', 'Zamestnanec', 'Príchod', 'Odchod', 'Hodiny'],
        ...attendance.map((record: any) => [
          record.date,
          record.profiles?.full_name || '-',
          record.arrival_time || '-',
          record.departure_time || '-',
          record.total_hours || '-',
        ]),
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(attendanceData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Dochádzka');
    }

    // Drives sheet
    if (drives && drives.length > 0) {
      const drivesData = [
        ['Dátum', 'Zamestnanec', 'Vozidlo', 'Projekt', 'Km'],
        ...drives.map((record: any) => [
          record.date,
          record.profiles?.full_name || '-',
          record.vehicles?.spz || '-',
          record.projects?.name || '-',
          record.km_driven,
        ]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(drivesData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Jazdy');
    }

    // Fuelings sheet
    if (fuelings && fuelings.length > 0) {
      const fuelingsData = [
        ['Dátum', 'Zamestnanec', 'Vozidlo', 'Litre', 'Cena'],
        ...fuelings.map((record: any) => [
          record.date,
          record.profiles?.full_name || '-',
          record.vehicles?.spz || '-',
          record.liters,
          record.price || '-',
        ]),
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(fuelingsData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Tankovania');
    }

    // Summary sheet
    const summaryData = [
      ['SÚHRN REPORTU'],
      ['Obdobie', `${dateRange.startDate} - ${dateRange.endDate}`],
      [],
      ['DOCHÁDZKA'],
      ['Počet záznamov', attendance?.length || 0],
      ['Celkové hodiny', totalHours.toFixed(2)],
      [],
      ['JAZDY'],
      ['Počet jázd', drives?.length || 0],
      ['Celkové km', totalKm],
      [],
      ['TANKOVANIA'],
      ['Počet tankovaní', fuelings?.length || 0],
      ['Celkové litre', totalLiters.toFixed(2)],
      ['Celkové náklady', `${totalFuelCost.toFixed(2)} €`],
      ['Priemerná cena/L', totalLiters > 0 ? `${(totalFuelCost / totalLiters).toFixed(2)} €` : '0 €'],
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws4, 'Súhrn');

    XLSX.writeFile(wb, `kompletny_report_${dateRange.startDate}_${dateRange.endDate}.xlsx`);
  };

  const isLoading = loadingAttendance || loadingDrives || loadingFuelings;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reporty</h1>
          <p className="text-muted-foreground">Komplexné reporty a štatistiky</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportExcel} disabled={isLoading} variant="default">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={handleExportCSV} disabled={isLoading} variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Obdobie reportu</CardTitle>
          <CardDescription>Vyberte časové obdobie pre generovanie reportu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Od dátumu</Label>
              <DatePicker
                date={dateRange.startDate ? new Date(dateRange.startDate) : undefined}
                onDateChange={(date) => {
                  setDateRange({ ...dateRange, startDate: date ? date.toISOString().split('T')[0] : '' });
                }}
                placeholder="Od dátumu"
              />
            </div>
            <div className="space-y-2">
              <Label>Do dátumu</Label>
              <DatePicker
                date={dateRange.endDate ? new Date(dateRange.endDate) : undefined}
                onDateChange={(date) => {
                  setDateRange({ ...dateRange, endDate: date ? date.toISOString().split('T')[0] : '' });
                }}
                placeholder="Do dátumu"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkové hodiny</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalHours.toFixed(2)}h</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {attendance?.length || 0} záznamov
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkové kilometre</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalKm.toLocaleString()} km</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {drives?.length || 0} jázd
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Náklady na palivo</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalFuelCost.toFixed(2)} €</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {fuelings?.length || 0} tankovaní
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spotreba paliva</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalLiters.toFixed(2)} L</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Priemerná spotreba: {totalKm > 0 ? ((totalLiters / totalKm) * 100).toFixed(2) : 0} L/100km
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Sumár</TabsTrigger>
          <TabsTrigger value="details">Detaily</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Sumárny prehľad</CardTitle>
                  <CardDescription>
                    Obdobie: {new Date(dateRange.startDate).toLocaleDateString('sk-SK')} - {new Date(dateRange.endDate).toLocaleDateString('sk-SK')}
                  </CardDescription>
                </div>
                <div className="w-full sm:w-[250px]">
                  <Label>Filter projektu</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Všetky projekty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všetky projekty</SelectItem>
                      {projects?.map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedProject !== 'all' && (
                <>
                  <div>
                    <h3 className="font-semibold mb-3">Zamestnanci na projekte</h3>
                    {projectStats.employees.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Meno</TableHead>
                            <TableHead className="text-right">Odpracované hodiny</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectStats.employees.map((emp) => (
                            <TableRow key={emp.id}>
                              <TableCell>{emp.name}</TableCell>
                              <TableCell className="text-right font-medium">{emp.hours.toFixed(2)}h</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">Žiadni zamestnanci</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Vozidlá na projekte</h3>
                    {projectStats.vehicles.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>SPZ</TableHead>
                            <TableHead className="text-right">Najazdené km</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectStats.vehicles.map((vehicle) => (
                            <TableRow key={vehicle.id}>
                              <TableCell className="font-medium">{vehicle.spz}</TableCell>
                              <TableCell className="text-right">{vehicle.km.toLocaleString()} km</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">Žiadne vozidlá</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Tankovanie na projekte</h3>
                    <p className="text-sm text-muted-foreground">
                      Celkovo pretankované litre: <strong>{projectStats.totalLiters.toFixed(2)} L</strong>
                    </p>
                  </div>
                </>
              )}

              {selectedProject === 'all' && (
                <>
                  <div>
                    <h3 className="font-semibold mb-2">Dochádzka</h3>
                    <p className="text-sm text-muted-foreground">
                      Celkový počet záznamov: <strong>{attendance?.length || 0}</strong><br />
                      Odpracované hodiny: <strong>{totalHours.toFixed(2)}h</strong>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Služobné jazdy</h3>
                    <p className="text-sm text-muted-foreground">
                      Celkový počet jázd: <strong>{drives?.length || 0}</strong><br />
                      Najazdené kilometre: <strong>{totalKm.toLocaleString()} km</strong>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Tankovanie</h3>
                    <p className="text-sm text-muted-foreground">
                      Celkový počet tankovaní: <strong>{fuelings?.length || 0}</strong><br />
                      Spotrebované litre: <strong>{totalLiters.toFixed(2)} L</strong><br />
                      Celkové náklady: <strong>{totalFuelCost.toFixed(2)} €</strong><br />
                      Priemerná cena za liter: <strong>{totalLiters > 0 ? (totalFuelCost / totalLiters).toFixed(2) : 0} €/L</strong>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Detailné údaje</CardTitle>
              <CardDescription>Pre detailný prehľad prejdite na príslušné sekcie</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <strong>Dochádzka:</strong> Prejdite na sekciu "Overviews → Attendance" pre detailný prehľad dochádzky.
              </p>
              <p className="text-sm">
                <strong>Jazdy:</strong> Prejdite na sekciu "Overviews → Drives" pre detailný prehľad jázd.
              </p>
              <p className="text-sm">
                <strong>Tankovanie:</strong> Prejdite na sekciu "Overviews → Fuelings" pre detailný prehľad tankovaní.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;

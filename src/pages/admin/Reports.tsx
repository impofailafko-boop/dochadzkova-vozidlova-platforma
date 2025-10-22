import { useState } from 'react';
import { useAdminAttendance } from '@/hooks/useAdminAttendance';
import { useAdminDrives } from '@/hooks/useAdminDrives';
import { useAdminFuelings } from '@/hooks/useAdminFuelings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: attendance, isLoading: loadingAttendance } = useAdminAttendance(dateRange);
  const { data: drives, isLoading: loadingDrives } = useAdminDrives(dateRange);
  const { data: fuelings, isLoading: loadingFuelings } = useAdminFuelings(dateRange);

  const totalHours = attendance?.reduce((sum: number, record: any) => sum + (record.total_hours || 0), 0) || 0;
  const totalKm = drives?.reduce((sum: number, drive: any) => sum + (drive.km_driven || 0), 0) || 0;
  const totalFuelCost = fuelings?.reduce((sum: number, fuel: any) => sum + (fuel.price || 0), 0) || 0;
  const totalLiters = fuelings?.reduce((sum: number, fuel: any) => sum + (fuel.liters || 0), 0) || 0;

  const handleExportAll = () => {
    // Attendance
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

      const blob = new Blob([fullCsv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kompletny_report_${dateRange.startDate}_${dateRange.endDate}.csv`;
      a.click();
    }
  };

  const isLoading = loadingAttendance || loadingDrives || loadingFuelings;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reporty</h1>
          <p className="text-muted-foreground">Komplexné reporty a štatistiky</p>
        </div>
        <Button onClick={handleExportAll} disabled={isLoading}>
          <Download className="mr-2 h-4 w-4" />
          Export všetkých dát
        </Button>
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
              <CardTitle>Sumárny prehľad</CardTitle>
              <CardDescription>
                Obdobie: {new Date(dateRange.startDate).toLocaleDateString('sk-SK')} - {new Date(dateRange.endDate).toLocaleDateString('sk-SK')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

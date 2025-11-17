import { useParams, useNavigate } from 'react-router-dom';
import { useEmployeeDetail } from '@/hooks/useEmployeeDetail';
import { useEmployees } from '@/hooks/useEmployees';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Save, X, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { formatHoursToReadable } from '@/lib/utils';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { sk } from 'date-fns/locale';

interface MonthlySummary {
  month: string;
  year: number;
  monthNumber: number;
  totalHoursBrutto: number; // Celkové hodiny pred odrátaním prestávky
  totalHours: number; // Netto hodiny po odrátaní prestávky
  workDays: number;
  hourlyRate: number | null;
  totalPayment: number | null;
  totalKm: number;
  vehicles: Set<string>;
  projects: Set<string>;
}

interface DailyActivity {
  date: string;
  attendance: any | null;
  vehicleLogs: any[];
  totalHours: number;
  payment: number | null;
  totalKm: number;
}

const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { employee, attendance, vehicleLogs, isLoading } = useEmployeeDetail(id);
  const { updateEmployeeProfile, updateEmployeeType, updateEmployeePosition, updateEmployeeHourlyRate, isUpdatingProfile } = useEmployees();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDriveMonth, setSelectedDriveMonth] = useState<string | null>(null);
  const [deleteMonthDialogOpen, setDeleteMonthDialogOpen] = useState(false);
  const [monthToDelete, setMonthToDelete] = useState<string | null>(null);
  const [isDeletingMonth, setIsDeletingMonth] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    employment_type: 'unset',
    job_position: 'unset',
    hourly_rate: '',
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        full_name: employee.full_name,
        phone: employee.phone || '',
        employment_type: employee.employment_type || 'unset',
        job_position: employee.job_position || 'unset',
        hourly_rate: employee.hourly_rate ? employee.hourly_rate.toString() : '',
      });
    }
  }, [employee]);

  // Calculate monthly summaries combining attendance and vehicle logs
  const monthlySummaries = useMemo<MonthlySummary[]>(() => {
    if ((!attendance || attendance.length === 0) && (!vehicleLogs || vehicleLogs.length === 0)) return [];

    const summaryMap = new Map<string, MonthlySummary>();
    const hourlyRate = employee?.hourly_rate ? parseFloat(employee.hourly_rate.toString()) : null;

    // Process attendance data
    attendance?.forEach((record) => {
      const date = parseISO(record.date);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'LLLL yyyy', { locale: sk });
      const year = date.getFullYear();
      const monthNumber = date.getMonth() + 1;

      if (!summaryMap.has(monthKey)) {
        summaryMap.set(monthKey, {
          month: monthName,
          year,
          monthNumber,
          totalHoursBrutto: 0,
          totalHours: 0,
          workDays: 0,
          hourlyRate,
          totalPayment: null,
          totalKm: 0,
          vehicles: new Set<string>(),
          projects: new Set<string>(),
        });
      }

      const summary = summaryMap.get(monthKey)!;
      if (record.total_hours) {
        const hoursWorked = parseFloat(record.total_hours.toString());
        // Brutto hodiny (pred odrátaním prestávky)
        summary.totalHoursBrutto += hoursWorked;
        // Netto hodiny (po odrátaní 30 minút prestávky)
        const hoursWithBreak = Math.max(0, hoursWorked - 0.5);
        summary.totalHours += hoursWithBreak;
        summary.workDays += 1;
      }
      if ((record as any).projects?.name) {
        summary.projects.add((record as any).projects.name);
      }
    });

    // Process vehicle logs data
    vehicleLogs?.forEach((log) => {
      const date = parseISO(log.date);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'LLLL yyyy', { locale: sk });
      const year = date.getFullYear();
      const monthNumber = date.getMonth() + 1;

      if (!summaryMap.has(monthKey)) {
        summaryMap.set(monthKey, {
          month: monthName,
          year,
          monthNumber,
          totalHoursBrutto: 0,
          totalHours: 0,
          workDays: 0,
          hourlyRate,
          totalPayment: null,
          totalKm: 0,
          vehicles: new Set<string>(),
          projects: new Set<string>(),
        });
      }

      const summary = summaryMap.get(monthKey)!;
      summary.totalKm += log.km_driven || 0;
      if ((log as any).vehicles?.spz) {
        summary.vehicles.add((log as any).vehicles.spz);
      }
      if ((log as any).projects?.name) {
        summary.projects.add((log as any).projects.name);
      }
    });

    // Calculate payments
    summaryMap.forEach((summary) => {
      if (summary.hourlyRate !== null && summary.totalHours > 0) {
        summary.totalPayment = summary.totalHours * summary.hourlyRate;
      }
    });

    return Array.from(summaryMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.monthNumber - a.monthNumber;
    });
  }, [attendance, vehicleLogs, employee?.hourly_rate]);

  // Create daily activity data combining attendance and vehicle logs
  const dailyActivities = useMemo(() => {
    if (!selectedMonth) return [];

    const activityMap = new Map<string, DailyActivity>();
    const hourlyRate = employee?.hourly_rate ? parseFloat(employee.hourly_rate.toString()) : null;

    // Add attendance data
    attendance?.forEach((record) => {
      const date = parseISO(record.date);
      const monthKey = format(date, 'yyyy-MM');
      if (monthKey !== selectedMonth) return;

      const dateKey = record.date;
      if (!activityMap.has(dateKey)) {
        activityMap.set(dateKey, {
          date: dateKey,
          attendance: null,
          vehicleLogs: [],
          totalHours: 0,
          payment: null,
          totalKm: 0,
        });
      }

      const activity = activityMap.get(dateKey)!;
      activity.attendance = record;
      if (record.total_hours) {
        const hoursWorked = parseFloat(record.total_hours.toString());
        // Odrátať 30 minút (0.5 hodiny) prestávky
        activity.totalHours = Math.max(0, hoursWorked - 0.5);
        if (hourlyRate !== null) {
          activity.payment = activity.totalHours * hourlyRate;
        }
      }
    });

    // Add vehicle logs data
    vehicleLogs?.forEach((log) => {
      const date = parseISO(log.date);
      const monthKey = format(date, 'yyyy-MM');
      if (monthKey !== selectedMonth) return;

      const dateKey = log.date;
      if (!activityMap.has(dateKey)) {
        activityMap.set(dateKey, {
          date: dateKey,
          attendance: null,
          vehicleLogs: [],
          totalHours: 0,
          payment: null,
          totalKm: 0,
        });
      }

      const activity = activityMap.get(dateKey)!;
      activity.vehicleLogs.push(log);
      activity.totalKm += log.km_driven || 0;
    });

    return Array.from(activityMap.values()).sort((a, b) => 
      b.date.localeCompare(a.date)
    );
  }, [selectedMonth, attendance, vehicleLogs, employee?.hourly_rate]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Zamestnanec nenájdený
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    if (!id) return;
    
    updateEmployeeProfile({
      userId: id,
      full_name: formData.full_name,
      phone: formData.phone,
    });

    if (formData.employment_type !== employee.employment_type) {
      updateEmployeeType({
        userId: id,
        employmentType: formData.employment_type === 'unset' ? null : formData.employment_type as any,
      });
    }

    if (formData.job_position !== employee.job_position) {
      updateEmployeePosition({
        userId: id,
        jobPosition: formData.job_position === 'unset' ? null : formData.job_position as any,
      });
    }

    const newHourlyRate = formData.hourly_rate === '' ? null : parseFloat(formData.hourly_rate);
    const currentHourlyRate = employee.hourly_rate ? parseFloat(employee.hourly_rate.toString()) : null;
    
    if (newHourlyRate !== currentHourlyRate) {
      updateEmployeeHourlyRate({
        userId: id,
        hourlyRate: newHourlyRate,
      });
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      full_name: employee.full_name,
      phone: employee.phone || '',
      employment_type: employee.employment_type || 'unset',
      job_position: employee.job_position || 'unset',
      hourly_rate: employee.hourly_rate ? employee.hourly_rate.toString() : '',
    });
    setIsEditing(false);
  };

  const handleDeleteMonthClick = (monthKey: string) => {
    setMonthToDelete(monthKey);
    setDeleteMonthDialogOpen(true);
  };

  const handleConfirmDeleteMonth = async () => {
    if (!monthToDelete || !id) return;

    setIsDeletingMonth(true);
    try {
      const [year, month] = monthToDelete.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = format(endOfMonth(parseISO(startDate)), 'yyyy-MM-dd');

      // Delete all attendance records for this month
      const { error: attendanceError } = await supabase
        .from('attendance')
        .delete()
        .eq('user_id', id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (attendanceError) throw attendanceError;

      // Delete all vehicle logs for this month
      const { error: vehicleLogsError } = await supabase
        .from('vehicle_logs')
        .delete()
        .eq('user_id', id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (vehicleLogsError) throw vehicleLogsError;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['employee-attendance', id] });
      queryClient.invalidateQueries({ queryKey: ['employee-vehicle-logs', id] });

      toast.success('Všetky záznamy za mesiac boli vymazané');
      setDeleteMonthDialogOpen(false);
      setMonthToDelete(null);
      setSelectedMonth(null);
    } catch (error: any) {
      toast.error(error.message || 'Chyba pri vymazávaní záznamov');
    } finally {
      setIsDeletingMonth(false);
    }
  };

  const employmentTypeLabels = {
    unset: 'Nezaznamenané',
    zivnost: 'Živnosť',
    dohoda_25: 'Dohoda 25%',
    dohoda_50: 'Dohoda 50%',
    tpp: 'TPP',
    administrativa: 'Administratíva',
  };

  const jobPositionLabels = {
    unset: 'Nezaznamenané',
    pilcik: 'Pilčík',
    strojnik: 'Strojník',
    elektrikar: 'Elektrikár',
    sofer: 'Šofér',
    administrativa: 'Administratíva',
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Detail zamestnanca</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{employee.full_name}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Osobné údaje</CardTitle>
              <CardDescription>Informácie o zamestnancovi</CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Upraviť
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isUpdatingProfile}>
                  <Save className="mr-2 h-4 w-4" />
                  Uložiť
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Zrušiť
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Celé meno</Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              ) : (
                <p className="text-lg font-medium">{employee.full_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <p className="text-lg font-medium">{employee.email || '-'}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefón</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+421 XXX XXX XXX"
                />
              ) : (
                <p className="text-lg font-medium">{employee.phone || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_type">Typ pracovného vzťahu</Label>
              {isEditing ? (
                <Select
                  value={formData.employment_type}
                  onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="unset">Nezaznamenané</SelectItem>
                    <SelectItem value="zivnost">Živnosť</SelectItem>
                    <SelectItem value="dohoda_25">Dohoda 25%</SelectItem>
                    <SelectItem value="dohoda_50">Dohoda 50%</SelectItem>
                    <SelectItem value="tpp">TPP</SelectItem>
                    <SelectItem value="administrativa">Administratíva</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-lg font-medium">
                  {employmentTypeLabels[formData.employment_type as keyof typeof employmentTypeLabels]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_position">Pracovná pozícia</Label>
              {isEditing ? (
                <Select
                  value={formData.job_position}
                  onValueChange={(value) => setFormData({ ...formData, job_position: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="unset">Nezaznamenané</SelectItem>
                    <SelectItem value="pilcik">Pilčík</SelectItem>
                    <SelectItem value="strojnik">Strojník</SelectItem>
                    <SelectItem value="elektrikar">Elektrikár</SelectItem>
                    <SelectItem value="sofer">Šofér</SelectItem>
                    <SelectItem value="administrativa">Administratíva</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-lg font-medium">
                  {jobPositionLabels[formData.job_position as keyof typeof jobPositionLabels]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hodinová sadzba</Label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="999.99"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">€/h</span>
                </div>
              ) : (
                <p className={`text-lg font-medium ${!employee.hourly_rate ? 'text-orange-600' : ''}`}>
                  {employee.hourly_rate 
                    ? `${parseFloat(employee.hourly_rate.toString()).toFixed(2)} €/h`
                    : 'Nenastavené'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kompletný prehľad aktivity</CardTitle>
          <CardDescription>Mesačný súhrn dochádzky, jázd a výplat</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlySummaries.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Žiadne záznamy</p>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Mesiac</TableHead>
                    <TableHead className="whitespace-nowrap">Pracovné dni</TableHead>
                    <TableHead className="whitespace-nowrap">Brutto hodiny</TableHead>
                    <TableHead className="whitespace-nowrap">Prestávka</TableHead>
                    <TableHead className="whitespace-nowrap">Netto hodiny</TableHead>
                    <TableHead className="whitespace-nowrap">Najazdené km</TableHead>
                    <TableHead className="whitespace-nowrap">Použité autá</TableHead>
                    <TableHead className="whitespace-nowrap">Projekty</TableHead>
                    <TableHead className="whitespace-nowrap">Výplata</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlySummaries.map((summary) => {
                    const monthKey = `${summary.year}-${summary.monthNumber.toString().padStart(2, '0')}`;
                    return (
                      <TableRow key={monthKey}>
                        <TableCell className="font-medium whitespace-nowrap capitalize">
                          {summary.month}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{summary.workDays}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatHoursToReadable(summary.totalHoursBrutto)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-orange-600">
                          {formatHoursToReadable(summary.workDays * 0.5)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium">
                          {formatHoursToReadable(summary.totalHours)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {summary.totalKm > 0 ? `${summary.totalKm.toLocaleString()} km` : '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {Array.from(summary.vehicles).length > 0 ? (
                              Array.from(summary.vehicles).slice(0, 2).map((spz) => (
                                <span key={spz} className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-xs font-medium">
                                  {spz}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                            {Array.from(summary.vehicles).length > 2 && (
                              <span className="text-xs text-muted-foreground">+{Array.from(summary.vehicles).length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap max-w-[150px]">
                          <div className="truncate">
                            {Array.from(summary.projects).length > 0 
                              ? Array.from(summary.projects).join(', ')
                              : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {summary.totalPayment !== null ? (
                            <span className="text-green-600 font-medium">
                              {summary.totalPayment.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €
                            </span>
                          ) : (
                            <span className="text-orange-600">- (chýba sadzba)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMonth(selectedMonth === monthKey ? null : monthKey)}
                            >
                              {selectedMonth === monthKey ? 'Skryť detail' : 'Zobraziť detail'}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteMonthClick(monthKey)}
                              title="Vymazať všetky záznamy za tento mesiac"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
          
          {monthlySummaries.length > 0 && monthlySummaries.some(s => s.totalPayment !== null) && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Celková výplata:</span>
                <span className="text-2xl font-bold text-green-600">
                  {monthlySummaries
                    .reduce((sum, s) => sum + (s.totalPayment || 0), 0)
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Za všetky mesiace s nastavenou sadzbou
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedMonth && dailyActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Denný prehľad aktivity</CardTitle>
            <CardDescription>
              {format(parseISO(`${selectedMonth}-01`), 'LLLL yyyy', { locale: sk })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Dátum</TableHead>
                    <TableHead className="whitespace-nowrap">Príchod</TableHead>
                    <TableHead className="whitespace-nowrap">Odchod</TableHead>
                    <TableHead className="whitespace-nowrap">Hodiny</TableHead>
                    <TableHead className="whitespace-nowrap">Výplata</TableHead>
                    <TableHead className="whitespace-nowrap">Projekt</TableHead>
                    <TableHead className="whitespace-nowrap">Vozidlá použité</TableHead>
                    <TableHead className="whitespace-nowrap">Km</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyActivities.map((activity) => (
                    <TableRow key={activity.date}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {format(parseISO(activity.date), 'dd.MM.yyyy (E)', { locale: sk })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {activity.attendance?.arrival_time || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {activity.attendance?.departure_time || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {activity.totalHours > 0 ? formatHoursToReadable(activity.totalHours) : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {activity.payment !== null ? (
                          <span className="text-green-600 font-medium">
                            {activity.payment.toFixed(2)} €
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        {activity.attendance?.projects ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium truncate">{(activity.attendance as any).projects?.name}</span>
                            {(activity.attendance as any).projects?.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {(activity.attendance as any).projects.description}
                              </span>
                            )}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {activity.vehicleLogs.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {activity.vehicleLogs.map((log) => (
                              <div key={log.id} className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-xs font-medium gap-1.5">
                                <span className="font-semibold">{(log as any).vehicles?.spz}</span>
                                <span className="text-muted-foreground">-</span>
                                <span>{(log as any).vehicles?.brand} {(log as any).vehicles?.type}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {activity.totalKm > 0 ? (
                          <span className="font-medium">{activity.totalKm.toLocaleString()} km</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteMonthDialogOpen} onOpenChange={setDeleteMonthDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vymazať všetky záznamy za mesiac?</AlertDialogTitle>
            <AlertDialogDescription>
              Táto akcia natrvalo vymaže všetky záznamy dochádzky a jázd za vybraný mesiac.
              {monthToDelete && (
                <span className="block mt-2 font-medium">
                  Mesiac: {format(parseISO(`${monthToDelete}-01`), 'LLLL yyyy', { locale: sk })}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingMonth}>Zrušiť</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeleteMonth}
              disabled={isDeletingMonth}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingMonth ? 'Mazanie...' : 'Vymazať'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeDetail;

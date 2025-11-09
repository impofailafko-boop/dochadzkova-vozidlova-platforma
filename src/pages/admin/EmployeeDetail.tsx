import { useParams, useNavigate } from 'react-router-dom';
import { useEmployeeDetail } from '@/hooks/useEmployeeDetail';
import { useEmployees } from '@/hooks/useEmployees';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { formatHoursToReadable } from '@/lib/utils';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { sk } from 'date-fns/locale';

interface MonthlySummary {
  month: string;
  year: number;
  monthNumber: number;
  totalHours: number;
  workDays: number;
}

const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { employee, attendance, isLoading } = useEmployeeDetail(id);
  const { updateEmployeeProfile, updateEmployeeType, updateEmployeePosition, isUpdatingProfile } = useEmployees();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    employment_type: 'unset',
    job_position: 'unset',
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        full_name: employee.full_name,
        phone: employee.phone || '',
        employment_type: employee.employment_type || 'unset',
        job_position: employee.job_position || 'unset',
      });
    }
  }, [employee]);

  // Calculate monthly summaries
  const monthlySummaries = useMemo<MonthlySummary[]>(() => {
    if (!attendance || attendance.length === 0) return [];

    const summaryMap = new Map<string, MonthlySummary>();

    attendance.forEach((record) => {
      if (!record.total_hours) return;

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
          totalHours: 0,
          workDays: 0,
        });
      }

      const summary = summaryMap.get(monthKey)!;
      summary.totalHours += parseFloat(record.total_hours.toString());
      summary.workDays += 1;
    });

    return Array.from(summaryMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.monthNumber - a.monthNumber;
    });
  }, [attendance]);

  // Filter attendance by selected month
  const filteredAttendance = useMemo(() => {
    if (!selectedMonth || !attendance) return [];

    return attendance.filter((record) => {
      const date = parseISO(record.date);
      const monthKey = format(date, 'yyyy-MM');
      return monthKey === selectedMonth;
    });
  }, [attendance, selectedMonth]);

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

    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      full_name: employee.full_name,
      phone: employee.phone || '',
      employment_type: employee.employment_type || 'unset',
      job_position: employee.job_position || 'unset',
    });
    setIsEditing(false);
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Odpracované hodiny</CardTitle>
          <CardDescription>Mesačný prehľad pracovnej dochádzky</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlySummaries.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Žiadne záznamy o dochádzke</p>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Mesiac</TableHead>
                    <TableHead className="whitespace-nowrap">Pracovné dni</TableHead>
                    <TableHead className="whitespace-nowrap">Celkové hodiny</TableHead>
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
                          {formatHoursToReadable(summary.totalHours)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMonth(selectedMonth === monthKey ? null : monthKey)}
                          >
                            {selectedMonth === monthKey ? 'Skryť detail' : 'Zobraziť detail'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {selectedMonth && filteredAttendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailná dochádzka</CardTitle>
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
                    <TableHead className="whitespace-nowrap">Projekt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(parseISO(record.date), 'dd.MM.yyyy', { locale: sk })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.arrival_time || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.departure_time || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.total_hours ? formatHoursToReadable(parseFloat(record.total_hours.toString())) : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {(record as any).projects?.name || '-'}
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
    </div>
  );
};

export default EmployeeDetail;

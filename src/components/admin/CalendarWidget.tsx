import { useState } from 'react';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useAdminAttendance } from '@/hooks/useAdminAttendance';
import { useAdminDrives } from '@/hooks/useAdminDrives';
import { useAdminFuelings } from '@/hooks/useAdminFuelings';
import { useAdminProjects } from '@/hooks/useAdminProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Route, Fuel, FileSpreadsheet, FileDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { sk } from 'date-fns/locale';
import * as XLSX from 'xlsx';

export const CalendarWidget = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const filters = {
    startDate: format(monthStart, 'yyyy-MM-dd'),
    endDate: format(monthEnd, 'yyyy-MM-dd'),
    ...(selectedProject !== 'all' && { projectId: selectedProject }),
  };

  const { projects } = useAdminProjects();
  const { data: calendarData, isLoading } = useCalendarData(filters);
  const { data: attendance } = useAdminAttendance(filters);
  const { data: drives } = useAdminDrives(filters);
  const { data: fuelings } = useAdminFuelings(filters);

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1).fill(null);

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const today = () => setCurrentMonth(new Date());

  const getDayData = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return calendarData?.byDate[dateStr];
  };

  const selectedDayData = selectedDate ? calendarData?.byDate[selectedDate] : null;

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const monthName = format(currentMonth, 'LLLL_yyyy', { locale: sk });

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

    XLSX.writeFile(wb, `kalendar_${monthName}.xlsx`);
  };

  const handleExportCSV = () => {
    const monthName = format(currentMonth, 'LLLL_yyyy', { locale: sk });

    const attendanceCsv = attendance && attendance.length > 0 ? [
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
    ].join('\n') : '';

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
    a.download = `kalendar_${monthName}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Kalendár aktivít</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="default" size="sm" onClick={handleExportExcel} disabled={isLoading} className="w-full sm:w-auto">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export Excel</span>
                <span className="sm:hidden">Excel</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isLoading} className="w-full sm:w-auto">
                <FileDown className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={today}>
                Dnes
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Všetky projekty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všetky projekty</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">
                    {format(currentMonth, 'LLLL yyyy', { locale: sk })}
                  </h3>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'].map((day) => (
                    <div key={day} className="text-center text-xs sm:text-sm font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {emptyDays.map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                  ))}
                  
                  {daysInMonth.map((day) => {
                    const dayData = getDayData(day);
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = selectedDate === dateStr;
                    const isToday = isSameDay(day, new Date());
                    const hasData = dayData?.hasData;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`
                          aspect-square p-1 sm:p-2 rounded-lg border-2 transition-all
                          ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
                          ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                          ${!hasData ? 'opacity-40' : ''}
                        `}
                      >
                        <div className="flex flex-col h-full">
                          <span className="text-xs sm:text-sm font-medium mb-1">{format(day, 'd')}</span>
                          {hasData && (
                            <div className="flex flex-col gap-0.5 mt-auto">
                              {dayData.attendance.count > 0 && (
                                <div className="h-0.5 sm:h-1 rounded-full bg-green-500" />
                              )}
                              {dayData.drives.count > 0 && (
                                <div className="h-0.5 sm:h-1 rounded-full bg-blue-500" />
                              )}
                              {dayData.fuelings.count > 0 && (
                                <div className="h-0.5 sm:h-1 rounded-full bg-orange-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 sm:gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Dochádzka</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Jazdy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Tankovania</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Day details */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <h3 className="text-lg font-semibold mb-2">Detail dňa</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedDate ? format(new Date(selectedDate), 'd. MMMM yyyy', { locale: sk }) : 'Vyberte deň'}
              </p>
              
              {!selectedDate ? (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-8">
                  Kliknite na deň v kalendári pre zobrazenie detailov
                </p>
              ) : !selectedDayData?.hasData ? (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-8">
                  Žiadne záznamy pre vybraný deň
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Employees */}
                  {selectedDayData.attendance.count > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        <h4 className="text-sm font-semibold">Zamestnanci</h4>
                      </div>
                      <ScrollArea className="w-full">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Meno</TableHead>
                              <TableHead className="text-xs text-right">Hodiny</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedDayData.attendance.records.map((record: any) => (
                              <TableRow key={record.id}>
                                <TableCell className="text-xs py-2">{record.profiles?.full_name || '-'}</TableCell>
                                <TableCell className="text-xs text-right py-2">{record.total_hours?.toFixed(2) || '0.00'}h</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                  )}

                  {/* Vehicles */}
                  {selectedDayData.drives.count > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-blue-500" />
                        <h4 className="text-sm font-semibold">Vozidlá</h4>
                      </div>
                      <ScrollArea className="w-full">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">SPZ</TableHead>
                              <TableHead className="text-xs text-right">Km</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const vehicleMap = new Map<string, { spz: string; km: number }>();
                              selectedDayData.drives.records.forEach((record: any) => {
                                const vehicleId = record.vehicle_id;
                                const spz = record.vehicles?.spz || '-';
                                const km = record.km_driven || 0;
                                
                                if (vehicleMap.has(vehicleId)) {
                                  vehicleMap.get(vehicleId)!.km += km;
                                } else {
                                  vehicleMap.set(vehicleId, { spz, km });
                                }
                              });
                              
                              return Array.from(vehicleMap.values()).map((vehicle, index) => (
                                <TableRow key={index}>
                                  <TableCell className="text-xs py-2">{vehicle.spz}</TableCell>
                                  <TableCell className="text-xs text-right py-2">{vehicle.km.toLocaleString()} km</TableCell>
                                </TableRow>
                              ));
                            })()}
                          </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                  )}

                  {/* Fuelings */}
                  {selectedDayData.fuelings.count > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-orange-500" />
                        <h4 className="text-sm font-semibold">Tankovanie</h4>
                      </div>
                      <ScrollArea className="w-full">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">SPZ</TableHead>
                              <TableHead className="text-xs text-right">Litre</TableHead>
                              <TableHead className="text-xs text-right">Cena</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedDayData.fuelings.records.map((record: any) => (
                              <TableRow key={record.id}>
                                <TableCell className="text-xs py-2">{record.vehicles?.spz || '-'}</TableCell>
                                <TableCell className="text-xs text-right py-2">{record.liters} L</TableCell>
                                <TableCell className="text-xs text-right py-2">{record.price?.toFixed(2) || '0.00'}€</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

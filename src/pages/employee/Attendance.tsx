import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import AttendanceButton from '@/components/employee/AttendanceButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { DatePicker } from '@/components/ui/date-picker';
import { formatHoursToReadable, formatDateToLocalString } from '@/lib/utils';

const Attendance = () => {
  const { user } = useAuth();
  const [limit, setLimit] = useState(30);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  const { getHistory } = useAttendance(user?.id);
  const { data, isLoading } = getHistory({ 
    limit,
    startDate: startDate ? formatDateToLocalString(startDate) : undefined,
    endDate: endDate ? formatDateToLocalString(endDate) : undefined
  });
  
  const history = data?.data || [];
  const totalCount = data?.count || 0;

  const loadMore = () => {
    setLimit((prev) => prev + 30);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dochádzka</h1>
        <p className="text-muted-foreground">
          Zaznamenajte príchod a odchod z práce
        </p>
      </div>

      <AttendanceButton />

      <Card>
        <CardHeader>
          <CardTitle>História dochádzky</CardTitle>
          <CardDescription>
            {totalCount > 0 
              ? `Zobrazených ${history.length} z ${totalCount} záznamov` 
              : 'Žiadne záznamy'}
          </CardDescription>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex-1 min-w-[200px]">
              <DatePicker
                date={startDate}
                onDateChange={setStartDate}
                placeholder="Od dátumu"
                disableFuture
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <DatePicker
                date={endDate}
                onDateChange={setEndDate}
                placeholder="Do dátumu"
                disableFuture
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Dátum</TableHead>
                      <TableHead className="whitespace-nowrap">Príchod</TableHead>
                      <TableHead className="whitespace-nowrap">Odchod</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Hodiny</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history && history.length > 0 ? (
                      history.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {new Date(record.date).toLocaleDateString('sk-SK')}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{record.arrival_time || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap">{record.departure_time || '-'}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {record.total_hours ? formatHoursToReadable(record.total_hours) : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Žiadne záznamy
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              
              {totalCount > limit && (
                <div className="mt-4 flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    disabled={isLoading}
                  >
                    Načítať ďalších 30
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;

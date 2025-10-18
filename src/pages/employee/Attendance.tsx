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

const Attendance = () => {
  const { user } = useAuth();
  const { history, isLoading } = useAttendance(user?.id);

  return (
    <div className="p-6 space-y-6">
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
          <CardDescription>Posledných 30 dní</CardDescription>
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
                  <TableHead>Príchod</TableHead>
                  <TableHead>Odchod</TableHead>
                  <TableHead className="text-right">Hodiny</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history && history.length > 0 ? (
                  history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.date).toLocaleDateString('sk-SK')}
                      </TableCell>
                      <TableCell>{record.arrival_time || '-'}</TableCell>
                      <TableCell>{record.departure_time || '-'}</TableCell>
                      <TableCell className="text-right">
                        {record.total_hours ? `${record.total_hours}h` : '-'}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;

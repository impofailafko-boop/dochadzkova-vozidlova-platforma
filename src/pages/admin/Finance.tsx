import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { useFinanceRecords } from '@/hooks/useFinanceRecords';
import { CreateFinanceRecordDialog } from '@/components/admin/CreateFinanceRecordDialog';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Finance() {
  const { records, isLoading, deleteRecord } = useFinanceRecords();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (selectedRecordId) {
      await deleteRecord(selectedRecordId);
      setDeleteDialogOpen(false);
      setSelectedRecordId(null);
    }
  };

  // Calculate statistics
  const totalVsd = records.reduce((sum, r) => sum + (r.total_vsd || 0), 0);
  const totalPaid = records.reduce((sum, r) => sum + (r.paid_employees || 0), 0);
  const totalProfit = records.reduce((sum, r) => sum + (r.profit || 0), 0);

  // Prepare chart data - top 5 by total_vsd
  const chartData = records
    .filter(r => r.total_vsd)
    .sort((a, b) => (b.total_vsd || 0) - (a.total_vsd || 0))
    .slice(0, 5)
    .map(r => ({
      name: r.order_number,
      'Suma VŠD': r.total_vsd,
      'Zaplatené': r.paid_employees,
      'Zisk': r.profit,
    }));

  // Pie chart data - profit distribution
  const profitData = records
    .filter(r => r.profit && r.profit !== 0)
    .map(r => ({
      name: r.order_number,
      value: Math.abs(r.profit || 0),
      isProfit: (r.profit || 0) > 0,
    }))
    .slice(0, 5);

  const exportToCSV = () => {
    const headers = [
      'Č. objednávky',
      'Lokalita',
      'Termín ukončenia',
      'Kto pracoval',
      'Rozsah podľa obj.',
      'Celková suma VŠD',
      'Zaplatené zam.',
      'Zisk',
      'Dátum ukončenia',
      'FA',
      'Rozsah podľa FA',
      'Rozsah reálny',
      'Podľa zam.',
      'Poznámky'
    ];
    
    const csvContent = [
      headers.join(','),
      ...records.map(r => [
        r.order_number,
        r.location || '',
        r.completion_deadline || '',
        r.worker || '',
        r.scope_by_order || '',
        r.total_vsd || '',
        r.paid_employees || '',
        r.profit || '',
        r.completion_date || '',
        r.invoice_number || '',
        r.scope_by_invoice || '',
        r.actual_scope || '',
        r.by_employee || '',
        r.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financie_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Načítavam...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financie</h1>
          <p className="text-muted-foreground">Prehľad finančných záznamov a štatistiky</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nová akcia
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Všetky záznamy</CardTitle>
          <CardDescription>Kompletný zoznam finančných záznamov</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Č. objednávky</TableHead>
                  <TableHead>Lokalita</TableHead>
                  <TableHead>Termín</TableHead>
                  <TableHead>Pracovník</TableHead>
                  <TableHead className="text-right">Suma VŠD</TableHead>
                  <TableHead className="text-right">Zaplatené</TableHead>
                  <TableHead className="text-right">Zisk</TableHead>
                  <TableHead>FA</TableHead>
                  <TableHead className="w-[100px]">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow 
                    key={record.id}
                    style={{ backgroundColor: record.row_color || '#ffffff' }}
                  >
                    <TableCell className="font-medium">{record.order_number}</TableCell>
                    <TableCell>{record.location}</TableCell>
                    <TableCell>
                      {record.completion_deadline ? 
                        format(new Date(record.completion_deadline), 'dd.MM.yyyy', { locale: sk }) 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{record.worker}</TableCell>
                    <TableCell className="text-right">
                      {record.total_vsd ? `${record.total_vsd.toFixed(2)} €` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {record.paid_employees ? `${record.paid_employees.toFixed(2)} €` : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      (record.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {record.profit ? `${record.profit.toFixed(2)} €` : '-'}
                    </TableCell>
                    <TableCell>{record.invoice_number}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedRecordId(record.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 objednávok podľa objemu</CardTitle>
            <CardDescription>Porovnanie súm, zaplatených a zisku</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Suma VŠD" fill="#8884d8" />
                <Bar dataKey="Zaplatené" fill="#82ca9d" />
                <Bar dataKey="Zisk" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rozdelenie zisku/straty</CardTitle>
            <CardDescription>Top 5 objednávok podľa zisku</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={profitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {profitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isProfit ? COLORS[index % COLORS.length] : '#ff4444'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <CreateFinanceRecordDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potvrdiť vymazanie</AlertDialogTitle>
            <AlertDialogDescription>
              Naozaj chcete vymazať tento finančný záznam? Túto akciu nie je možné vrátiť späť.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušiť</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Vymazať</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

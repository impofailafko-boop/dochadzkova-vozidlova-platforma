import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Download, BarChart3 } from 'lucide-react';
import { useFinanceRecords, FinanceRecord } from '@/hooks/useFinanceRecords';
import { CreateFinanceRecordDialog } from '@/components/admin/CreateFinanceRecordDialog';
import { FinanceRecordChartDialog } from '@/components/admin/FinanceRecordChartDialog';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
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

export default function Finance() {
  const { user } = useAuth();
  const { records, isLoading, deleteRecord } = useFinanceRecords();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chartDialogOpen, setChartDialogOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRecordForChart, setSelectedRecordForChart] = useState<FinanceRecord | null>(null);

  // Check if user has access to finance section
  const hasAccess = user?.email === 'pikolo@pikolo.sk';

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Prístup odmietnutý</CardTitle>
            <CardDescription>
              Nemáte oprávnenie na prístup do sekcie Financie.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    if (selectedRecordId) {
      await deleteRecord(selectedRecordId);
      setDeleteDialogOpen(false);
      setSelectedRecordId(null);
    }
  };

  const handleOpenChart = (record: FinanceRecord) => {
    setSelectedRecordForChart(record);
    setChartDialogOpen(true);
  };

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
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[150px] border-r">Č. objednávky</TableHead>
                  <TableHead className="border-r">Lokalita</TableHead>
                  <TableHead className="border-r">Termín ukončenia</TableHead>
                  <TableHead className="border-r">Pracovník</TableHead>
                  <TableHead className="border-r">Rozsah podľa obj.</TableHead>
                  <TableHead className="text-right border-r">Suma VŠD</TableHead>
                  <TableHead className="text-right border-r">Zaplatené</TableHead>
                  <TableHead className="text-right border-r">Zisk</TableHead>
                  <TableHead className="border-r">Dátum ukončenia</TableHead>
                  <TableHead className="border-r">FA</TableHead>
                  <TableHead className="border-r">Rozsah podľa FA</TableHead>
                  <TableHead className="border-r">Rozsah reálny</TableHead>
                  <TableHead className="border-r">Podľa zamestnanca</TableHead>
                  <TableHead className="border-r">Poznámky</TableHead>
                  <TableHead className="w-[80px] border-r">Graf</TableHead>
                  <TableHead className="w-[80px]">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, index) => (
                  <TableRow 
                    key={record.id}
                    style={{ backgroundColor: record.row_color || '#ffffff' }}
                    className={index % 2 === 0 ? '' : 'bg-muted/20'}
                  >
                    <TableCell className="font-medium border-r">{record.order_number}</TableCell>
                    <TableCell className="border-r">{record.location || '-'}</TableCell>
                    <TableCell className="border-r">
                      {record.completion_deadline ? 
                        format(new Date(record.completion_deadline), 'dd.MM.yyyy', { locale: sk }) 
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="border-r">{record.worker || '-'}</TableCell>
                    <TableCell className="border-r">{record.scope_by_order || '-'}</TableCell>
                    <TableCell className="text-right border-r">
                      {record.total_vsd ? `${record.total_vsd.toFixed(2)} €` : '-'}
                    </TableCell>
                    <TableCell className="text-right border-r">
                      {record.paid_employees ? `${record.paid_employees.toFixed(2)} €` : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium border-r ${
                      (record.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {record.profit ? `${record.profit.toFixed(2)} €` : '-'}
                    </TableCell>
                    <TableCell className="border-r">
                      {record.completion_date ? 
                        format(new Date(record.completion_date), 'dd.MM.yyyy', { locale: sk }) 
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="border-r">{record.invoice_number || '-'}</TableCell>
                    <TableCell className="border-r">{record.scope_by_invoice || '-'}</TableCell>
                    <TableCell className="border-r">{record.actual_scope || '-'}</TableCell>
                    <TableCell className="border-r">{record.by_employee || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate border-r">{record.notes || '-'}</TableCell>
                    <TableCell className="border-r">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenChart(record)}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateFinanceRecordDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <FinanceRecordChartDialog
        open={chartDialogOpen}
        onOpenChange={setChartDialogOpen}
        record={selectedRecordForChart}
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

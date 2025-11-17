import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FinanceRecord } from '@/hooks/useFinanceRecords';

interface FinanceRecordChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: FinanceRecord | null;
}

export function FinanceRecordChartDialog({ open, onOpenChange, record }: FinanceRecordChartDialogProps) {
  if (!record) return null;

  const chartData = [
    {
      name: 'Finančný prehľad',
      'Suma VŠD': record.total_vsd || 0,
      'Zaplatené': record.paid_employees || 0,
      'Zisk': record.profit || 0,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Graf pre objednávku: {record.order_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Celková suma VŠD</p>
              <p className="text-2xl font-bold">{record.total_vsd?.toFixed(2) || '0.00'} €</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Zaplatené zamestnancom</p>
              <p className="text-2xl font-bold">{record.paid_employees?.toFixed(2) || '0.00'} €</p>
            </div>
            <div className={`p-4 border rounded-lg ${(record.profit || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-muted-foreground">Zisk</p>
              <p className={`text-2xl font-bold ${(record.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {record.profit?.toFixed(2) || '0.00'} €
              </p>
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Lokalita:</p>
              <p className="text-muted-foreground">{record.location || '-'}</p>
            </div>
            <div>
              <p className="font-medium">Pracovník:</p>
              <p className="text-muted-foreground">{record.worker || '-'}</p>
            </div>
            <div>
              <p className="font-medium">Rozsah podľa obj.:</p>
              <p className="text-muted-foreground">{record.scope_by_order || '-'}</p>
            </div>
            <div>
              <p className="font-medium">Faktúra:</p>
              <p className="text-muted-foreground">{record.invoice_number || '-'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

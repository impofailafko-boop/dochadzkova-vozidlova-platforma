import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFinanceRecords } from '@/hooks/useFinanceRecords';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const formSchema = z.object({
  order_number: z.string().min(1, 'Číslo objednávky je povinné'),
  location: z.string().optional(),
  completion_deadline: z.string().optional(),
  worker: z.string().optional(),
  scope_by_order: z.string().optional(),
  total_vsd: z.string().optional(),
  paid_employees: z.string().optional(),
  profit: z.string().optional(),
  completion_date: z.string().optional(),
  invoice_number: z.string().optional(),
  scope_by_invoice: z.string().optional(),
  actual_scope: z.string().optional(),
  by_employee: z.string().optional(),
  notes: z.string().optional(),
  row_color: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateFinanceRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetId: string;
}

const STEPS = [
  {
    title: 'Základné údaje',
    fields: ['order_number', 'location', 'completion_deadline', 'worker'],
  },
  {
    title: 'Rozsahy a sumy',
    fields: ['scope_by_order', 'total_vsd', 'paid_employees', 'profit'],
  },
  {
    title: 'Faktúra a dokončenie',
    fields: ['completion_date', 'invoice_number', 'scope_by_invoice', 'actual_scope'],
  },
  {
    title: 'Poznámky a farba',
    fields: ['by_employee', 'notes', 'row_color'],
  },
];

export function CreateFinanceRecordDialog({ open, onOpenChange, sheetId }: CreateFinanceRecordDialogProps) {
  const [step, setStep] = useState(0);
  const { createRecord, isCreating } = useFinanceRecords();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      row_color: '#ffffff',
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      await createRecord({
        order_number: data.order_number,
        sheet_id: sheetId,
        location: data.location,
        completion_deadline: data.completion_deadline,
        worker: data.worker,
        scope_by_order: data.scope_by_order,
        total_vsd: data.total_vsd ? parseFloat(data.total_vsd) : undefined,
        paid_employees: data.paid_employees ? parseFloat(data.paid_employees) : undefined,
        profit: data.profit ? parseFloat(data.profit) : undefined,
        completion_date: data.completion_date,
        invoice_number: data.invoice_number,
        scope_by_invoice: data.scope_by_invoice,
        actual_scope: data.actual_scope,
        by_employee: data.by_employee,
        notes: data.notes,
        row_color: data.row_color,
      });
      form.reset();
      setStep(0);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating record:', error);
    }
  };

  const currentFields = STEPS[step].fields;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {STEPS[step].title} ({step + 1}/{STEPS.length})
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {currentFields.includes('order_number') && (
              <FormField
                control={form.control}
                name="order_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Číslo objednávky *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="napr. PA24/0025/24-01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('location') && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokalita</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="napr. Vranov" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('completion_deadline') && (
              <FormField
                control={form.control}
                name="completion_deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termín ukončenia</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('worker') && (
              <FormField
                control={form.control}
                name="worker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kto pracoval</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="napr. Juraj Meňo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('scope_by_order') && (
              <FormField
                control={form.control}
                name="scope_by_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rozsah podľa objednávky</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="napr. 1650m+2500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('total_vsd') && (
              <FormField
                control={form.control}
                name="total_vsd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celková suma VŠD (€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} placeholder="napr. 3370.93" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('paid_employees') && (
              <FormField
                control={form.control}
                name="paid_employees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zaplatené zamestnancom (€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} placeholder="napr. 4338.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('profit') && (
              <FormField
                control={form.control}
                name="profit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zisk (€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} placeholder="napr. -967.07" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('completion_date') && (
              <FormField
                control={form.control}
                name="completion_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dátum ukončenia</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('invoice_number') && (
              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Číslo faktúry (FA)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="napr. FA25/S0697" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('scope_by_invoice') && (
              <FormField
                control={form.control}
                name="scope_by_invoice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rozsah podľa FA</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="napr. 1870m" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('actual_scope') && (
              <FormField
                control={form.control}
                name="actual_scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rozsah reálny</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="napr. 1650m" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('by_employee') && (
              <FormField
                control={form.control}
                name="by_employee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Podľa zamestnanca</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Údaje podľa zamestnanca" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('notes') && (
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vypisnačky / Poznámky</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Poznámky k záznamu..." rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentFields.includes('row_color') && (
              <FormField
                control={form.control}
                name="row_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Farba riadku</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 items-center">
                        <Input type="color" {...field} className="w-20 h-10" />
                        <span className="text-sm text-muted-foreground">{field.value}</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Späť
              </Button>

              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setStep(s => s + 1)}
                >
                  Ďalej
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Ukladám...' : 'Vytvoriť záznam'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

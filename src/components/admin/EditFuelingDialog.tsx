import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const editFuelLogSchema = z.object({
  vehicle_id: z.string().min(1, 'Vyberte vozidlo'),
  project_id: z.string().min(1, 'Vyberte projekt'),
  liters: z.number()
    .min(1, 'Litre musia byť väčšie ako 0')
    .max(500, 'Litre nemôžu byť väčšie ako 500'),
  price: z.number()
    .min(0, 'Cena nemôže byť záporná')
    .max(10000, 'Cena nemôže byť väčšia ako 10000€')
    .nullable()
    .optional(),
  note: z.string()
    .max(500, 'Poznámka môže mať maximálne 500 znakov')
    .optional(),
});

type EditFuelLogFormData = z.infer<typeof editFuelLogSchema>;

interface EditFuelingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fueling: any;
  vehicles: any[];
  projects: any[];
  onSave: (id: string, data: any) => void;
  isUpdating: boolean;
}

export function EditFuelingDialog({ open, onOpenChange, fueling, vehicles, projects, onSave, isUpdating }: EditFuelingDialogProps) {
  const form = useForm<EditFuelLogFormData>({
    resolver: zodResolver(editFuelLogSchema),
    defaultValues: {
      liters: fueling?.liters || 0,
      price: fueling?.price || 0,
      note: fueling?.note || '',
      vehicle_id: fueling?.vehicle_id || '',
      project_id: fueling?.project_id || '',
    },
  });

  useEffect(() => {
    if (fueling) {
      form.reset({
        liters: fueling.liters || 0,
        price: fueling.price || 0,
        note: fueling.note || '',
        vehicle_id: fueling.vehicle_id || '',
        project_id: fueling.project_id || '',
      });
    }
  }, [fueling, form]);

  const handleSubmit = (data: EditFuelLogFormData) => {
    onSave(fueling.id, data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upraviť tankovanie</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="vehicle_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vozidlo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte vozidlo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover z-50">
                      {vehicles?.map((vehicle: any) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.spz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projekt</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte projekt" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover z-50">
                      {projects?.map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="liters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Litre</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cena (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poznámka</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Zrušiť
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Ukladám...' : 'Uložiť'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

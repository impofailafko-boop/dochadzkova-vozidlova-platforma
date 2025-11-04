import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { optionalPhotoFileSchema } from '@/lib/photoSchemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const adminFuelLogSchema = z.object({
  date: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selectedDate <= today;
  }, 'Dátum nemôže byť v budúcnosti'),
  vehicle_id: z.string().min(1, 'Vyberte vozidlo'),
  project_id: z.string().optional(),
  liters: z.coerce.number()
    .positive('Litre musia byť kladné číslo')
    .min(1, 'Minimálne 1 liter')
    .max(500, 'Príliš veľa litrov (max 500)'),
  price: z.coerce.number()
    .nonnegative('Cena nemôže byť záporná')
    .max(10000, 'Cena je príliš vysoká')
    .optional()
    .or(z.literal(0)),
  note: z.string()
    .max(500, 'Poznámka je príliš dlhá (max 500 znakov)')
    .optional(),
  photo_receipt: optionalPhotoFileSchema,
});

type AdminFuelLogFormData = z.infer<typeof adminFuelLogSchema>;

interface CreateFuelingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: any[];
  projects: any[];
  currentUserId: string;
  onCreate: (data: any) => void;
  isCreating: boolean;
}

export function CreateFuelingDialog({ open, onOpenChange, vehicles, projects, currentUserId, onCreate, isCreating }: CreateFuelingDialogProps) {
  const form = useForm<AdminFuelLogFormData>({
    resolver: zodResolver(adminFuelLogSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      vehicle_id: '',
      project_id: '',
      liters: 0,
      price: 0,
      note: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        vehicle_id: '',
        project_id: '',
        liters: 0,
        price: 0,
        note: '',
      });
    }
  }, [open, form]);

  const handleSubmit = (data: AdminFuelLogFormData) => {
    onCreate({
      ...data,
      user_id: currentUserId,
      liters: data.liters,
      price: data.price && data.price > 0 ? data.price : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pridať tankovanie</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dátum</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                      placeholder="Vyberte dátum"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>Projekt (voliteľné)</FormLabel>
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
                    <Input type="number" step="0.01" placeholder="50" {...field} />
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
                  <FormLabel>Cena (€) - voliteľné</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="75.50" {...field} />
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
                  <FormLabel>Poznámka - voliteľné</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Tankovanie na diaľnici..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo_receipt"
              render={({ field: { value, onChange } }) => (
                <FormItem>
                  <FormLabel>Foto účtenky - voliteľné</FormLabel>
                  <FormControl>
                    <PhotoUpload
                      value={value}
                      onChange={onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Zrušiť
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Vytváram...' : 'Vytvoriť'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

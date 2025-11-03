import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const createAttendanceSchema = z.object({
  user_id: z.string().min(1, 'Vyberte zamestnanca'),
  date: z.string().min(1, 'Zadajte dátum').refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selectedDate <= today;
  }, 'Dátum nemôže byť v budúcnosti'),
  arrival_time: z.string().min(1, 'Zadajte čas príchodu'),
  departure_time: z.string().optional(),
}).refine((data) => {
  if (data.departure_time && data.arrival_time) {
    return data.departure_time > data.arrival_time;
  }
  return true;
}, {
  message: 'Čas odchodu musí byť neskôr ako čas príchodu',
  path: ['departure_time'],
});

type CreateAttendanceFormData = z.infer<typeof createAttendanceSchema>;

interface CreateAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: any[];
  onCreate: (data: any) => void;
  isCreating: boolean;
}

export function CreateAttendanceDialog({ open, onOpenChange, employees, onCreate, isCreating }: CreateAttendanceDialogProps) {
  const form = useForm<CreateAttendanceFormData>({
    resolver: zodResolver(createAttendanceSchema),
    defaultValues: {
      user_id: '',
      date: new Date().toISOString().split('T')[0],
      arrival_time: '',
      departure_time: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        user_id: '',
        date: new Date().toISOString().split('T')[0],
        arrival_time: '',
        departure_time: '',
      });
    }
  }, [open, form]);

  const handleSubmit = (data: CreateAttendanceFormData) => {
    onCreate(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pridať dochádzku</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zamestnanec</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte zamestnanca" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover z-50">
                      {employees?.map((emp: any) => (
                        <SelectItem key={emp.user_id} value={emp.user_id}>
                          {emp.full_name}
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dátum</FormLabel>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onDateChange={(date) => {
                      field.onChange(date ? date.toISOString().split('T')[0] : '');
                    }}
                    placeholder="Vyberte dátum"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="arrival_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Čas príchodu</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="departure_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Čas odchodu</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
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

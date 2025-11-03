import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const editAttendanceSchema = z.object({
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

type EditAttendanceFormData = z.infer<typeof editAttendanceSchema>;

interface EditAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: any;
  onSave: (id: string, data: any) => void;
  isUpdating: boolean;
}

export function EditAttendanceDialog({ open, onOpenChange, attendance, onSave, isUpdating }: EditAttendanceDialogProps) {
  const form = useForm<EditAttendanceFormData>({
    resolver: zodResolver(editAttendanceSchema),
    defaultValues: {
      arrival_time: attendance?.arrival_time || '',
      departure_time: attendance?.departure_time || '',
    },
  });

  useEffect(() => {
    if (attendance) {
      form.reset({
        arrival_time: attendance.arrival_time || '',
        departure_time: attendance.departure_time || '',
      });
    }
  }, [attendance, form]);

  const handleSubmit = (data: EditAttendanceFormData) => {
    onSave(attendance.id, data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upraviť dochádzku</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

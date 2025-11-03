import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const employeeProfileSchema = z.object({
  full_name: z.string()
    .trim()
    .min(2, 'Meno musí mať aspoň 2 znaky')
    .max(100, 'Meno je príliš dlhé'),
  phone: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Neplatné telefónne číslo')
    .optional()
    .or(z.literal('')),
});

type EmployeeProfileFormData = z.infer<typeof employeeProfileSchema>;

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any;
  onSave: (userId: string, data: any) => void;
  isUpdating: boolean;
}

export function EditEmployeeDialog({ open, onOpenChange, employee, onSave, isUpdating }: EditEmployeeDialogProps) {
  const form = useForm<EmployeeProfileFormData>({
    resolver: zodResolver(employeeProfileSchema),
    defaultValues: {
      full_name: employee?.full_name || '',
      phone: employee?.phone || '',
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        full_name: employee.full_name || '',
        phone: employee.phone || '',
      });
    }
  }, [employee, form]);

  const handleSubmit = (data: EmployeeProfileFormData) => {
    onSave(employee.user_id, data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upraviť profil zamestnanca</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celé meno</FormLabel>
                  <FormControl>
                    <Input placeholder="Ján Novák" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefón</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+421 XXX XXX XXX" {...field} />
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

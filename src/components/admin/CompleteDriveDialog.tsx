import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const completeDriveSchema = z.object({
  km_end: z.number()
    .int('Kilómetre musia byť celé číslo')
    .min(0, 'Kilómetre nemôžu byť záporné')
    .max(9999999, 'Kilómetre nemôžu byť väčšie ako 9,999,999'),
});

type CompleteDriveFormData = z.infer<typeof completeDriveSchema>;

interface CompleteDriveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drive: any;
  onComplete: (id: string, km_end: number) => void;
  isCompleting: boolean;
}

export function CompleteDriveDialog({ open, onOpenChange, drive, onComplete, isCompleting }: CompleteDriveDialogProps) {
  const form = useForm<CompleteDriveFormData>({
    resolver: zodResolver(completeDriveSchema),
    defaultValues: {
      km_end: drive?.km_start || 0,
    },
  });

  useEffect(() => {
    if (drive) {
      form.reset({
        km_end: drive.km_start || 0,
      });
    }
  }, [drive, form]);

  const kmEnd = form.watch('km_end');

  const handleSubmit = (data: CompleteDriveFormData) => {
    if (data.km_end < drive?.km_start) {
      form.setError('km_end', {
        message: 'Km konca musí byť väčšie alebo rovné km začiatku',
      });
      return;
    }
    onComplete(drive.id, data.km_end);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dokončiť jazdu</DialogTitle>
          <DialogDescription>
            Ukončite jazdu zadaním konečného stavu tachometra
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Km začiatku</FormLabel>
              <Input type="number" value={drive?.km_start} disabled />
            </div>
            <FormField
              control={form.control}
              name="km_end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Km konca</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      min={drive?.km_start}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-sm text-muted-foreground">
              Prejdené km: {kmEnd - (drive?.km_start || 0)}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Zrušiť
              </Button>
              <Button type="submit" disabled={isCompleting}>
                {isCompleting ? 'Dokončujem...' : 'Dokončiť'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

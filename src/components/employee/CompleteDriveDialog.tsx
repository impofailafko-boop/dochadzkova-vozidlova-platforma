import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useVehicleLogs } from '@/hooks/useVehicleLogs';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import { optionalPhotoFileSchema } from '@/lib/photoSchemas';

const completeDriveSchema = z.object({
  km_end: z.number()
    .int('Kilómetre musia byť celé číslo')
    .min(0, 'Kilómetre nemôžu byť záporné')
    .max(9999999, 'Kilómetre nemôžu byť väčšie ako 9,999,999'),
  photo_km_end: optionalPhotoFileSchema,
});

type CompleteDriveFormData = z.infer<typeof completeDriveSchema>;

interface CompleteDriveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: {
    id: string;
    km_start: number;
    vehicles?: { spz: string };
  };
}

export function CompleteDriveDialog({ open, onOpenChange, log }: CompleteDriveDialogProps) {
  const { user } = useAuth();
  const { completeLog, isCompleting } = useVehicleLogs(user?.id);

  const form = useForm<CompleteDriveFormData>({
    resolver: zodResolver(completeDriveSchema),
    defaultValues: {
      km_end: log.km_start,
      photo_km_end: undefined,
    },
  });

  useEffect(() => {
    if (log) {
      form.reset({
        km_end: log.km_start,
        photo_km_end: undefined,
      });
    }
  }, [log, form]);

  const kmEnd = form.watch('km_end');

  const handleSubmit = (data: CompleteDriveFormData) => {
    if (data.km_end < log.km_start) {
      form.setError('km_end', {
        message: 'Konečné kilometre musia byť vyššie ako počiatočné',
      });
      return;
    }

    completeLog(
      {
        logId: log.id,
        km_end: data.km_end,
        photo_km_end: data.photo_km_end,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ukončiť jazdu</DialogTitle>
          <DialogDescription>
            Vozidlo: {log.vehicles?.spz} | Začiatok: {log.km_start} km
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="km_end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konečný stav kilometrov</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      placeholder="napr. 45150"
                      min={log.km_start}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Najazdené: <span className="font-bold">{kmEnd - log.km_start} km</span>
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo_km_end"
              render={({ field: { value, onChange } }) => (
                <FormItem>
                  <FormLabel>Foto konečného stavu - voliteľné</FormLabel>
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

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Zrušiť
              </Button>
              <Button type="submit" disabled={isCompleting} className="flex-1">
                {isCompleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ukončujem...
                  </>
                ) : (
                  'Ukončiť jazdu'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

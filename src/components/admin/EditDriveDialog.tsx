import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import { optionalPhotoFileSchema } from '@/lib/photoSchemas';

const editDriveSchema = z.object({
  vehicle_id: z.string().min(1, 'Vyberte vozidlo'),
  project_id: z.string().min(1, 'Vyberte projekt'),
  km_start: z.number()
    .int('Kilómetre musia byť celé číslo')
    .min(0, 'Kilómetre nemôžu byť záporné')
    .max(9999999, 'Kilómetre nemôžu byť väčšie ako 9,999,999'),
  km_end: z.number()
    .int('Kilómetre musia byť celé číslo')
    .min(0, 'Kilómetre nemôžu byť záporné')
    .max(9999999, 'Kilómetre nemôžu byť väčšie ako 9,999,999')
    .nullable()
    .optional(),
  photo_km_start: optionalPhotoFileSchema,
  photo_km_end: optionalPhotoFileSchema,
}).refine((data) => {
  if (data.km_end !== null && data.km_end !== undefined) {
    return data.km_end >= data.km_start;
  }
  return true;
}, {
  message: 'Km konca musí byť väčšie alebo rovné km začiatku',
  path: ['km_end'],
});

type EditDriveFormData = z.infer<typeof editDriveSchema>;

interface EditDriveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drive: any;
  vehicles: any[];
  projects: any[];
  onSave: (id: string, data: any) => void;
  isUpdating: boolean;
}

export function EditDriveDialog({ open, onOpenChange, drive, vehicles, projects, onSave, isUpdating }: EditDriveDialogProps) {
  const form = useForm<EditDriveFormData>({
    resolver: zodResolver(editDriveSchema),
    defaultValues: {
      km_start: drive?.km_start || 0,
      km_end: drive?.km_end || null,
      vehicle_id: drive?.vehicle_id || '',
      project_id: drive?.project_id || '',
    },
  });

  useEffect(() => {
    if (drive) {
      form.reset({
        km_start: drive.km_start || 0,
        km_end: drive.km_end || null,
        vehicle_id: drive.vehicle_id || '',
        project_id: drive.project_id || '',
        photo_km_start: undefined,
        photo_km_end: undefined,
      });
    }
  }, [drive, form]);

  const handleSubmit = (data: EditDriveFormData) => {
    onSave(drive.id, data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upraviť jazdu</DialogTitle>
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
                          <div className="flex flex-col gap-1 py-1">
                            <span className="font-medium">{project.name}</span>
                            {project.description && (
                              <span className="text-xs text-muted-foreground line-clamp-2">
                                {project.description}
                              </span>
                            )}
                          </div>
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
              name="km_start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Km začiatku</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {drive?.is_completed && (
              <FormField
                control={form.control}
                name="km_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Km konca</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="photo_km_start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto stavu kilometrov (štart) - voliteľné</FormLabel>
                  <FormControl>
                    <PhotoUpload
                      value={field.value}
                      onChange={field.onChange}
                      label="Foto tachometra na začiatku"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {drive?.is_completed && (
              <FormField
                control={form.control}
                name="photo_km_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foto stavu kilometrov (koniec) - voliteľné</FormLabel>
                    <FormControl>
                      <PhotoUpload
                        value={field.value}
                        onChange={field.onChange}
                        label="Foto tachometra na konci"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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

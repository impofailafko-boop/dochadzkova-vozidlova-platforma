import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const editFuelReceiptSchema = z.object({
  photo: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'Súbor je príliš veľký. Maximálna veľkosť je 10MB.')
    .refine((file) => file.type.startsWith('image/'), 'Neplatný formát súboru. Nahrajte obrázok.'),
});

type EditFuelReceiptFormData = z.infer<typeof editFuelReceiptSchema>;

interface EditFuelReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (fuelLogId: string, photo: File) => void;
  fuelLog: any;
  isUpdating: boolean;
}

export function EditFuelReceiptDialog({ 
  open, 
  onClose, 
  onUpdate, 
  fuelLog,
  isUpdating 
}: EditFuelReceiptDialogProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const form = useForm<EditFuelReceiptFormData>({
    resolver: zodResolver(editFuelReceiptSchema),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = editFuelReceiptSchema.safeParse({ photo: file });
      
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
      
      form.setValue('photo', file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: EditFuelReceiptFormData) => {
    onUpdate(fuelLog.id, data.photo);
    handleClose();
  };

  const handleClose = () => {
    setPhotoPreview(null);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pridať fotku bločku</DialogTitle>
          <DialogDescription>
            Tankovanie z {new Date(fuelLog?.date).toLocaleDateString('sk-SK')} - {fuelLog?.liters}L
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="photo"
              render={() => (
                <FormItem>
                  <FormControl>
                    <div className="space-y-4">
                      {/* Preview section */}
                      {photoPreview && (
                        <div className="relative w-full max-w-sm mx-auto">
                          <img 
                            src={photoPreview} 
                            alt="Náhľad účtenky" 
                            className="w-full h-auto rounded-lg border-2 border-primary"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setPhotoPreview(null);
                              form.resetField('photo');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Upload buttons */}
                      {!photoPreview && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => document.getElementById('edit-photo-gallery')?.click()}
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Vybrať z galérie
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => document.getElementById('edit-photo-camera')?.click()}
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Odfotiť
                          </Button>
                        </div>
                      )}
                      
                      {/* Hidden inputs */}
                      <input
                        id="edit-photo-gallery"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                      <input
                        id="edit-photo-camera"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isUpdating}>
                Zrušiť
              </Button>
              <Button type="submit" disabled={!form.formState.isValid || isUpdating}>
                {isUpdating ? 'Ukladá sa...' : 'Uložiť'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

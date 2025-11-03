import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Súbor je príliš veľký. Maximálna veľkosť je 10MB.');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Neplatný formát súboru. Nahrajte obrázok.');
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      toast.error('Vyberte prosím fotku');
      return;
    }
    onUpdate(fuelLog.id, selectedFile);
    handleClose();
  };

  const handleClose = () => {
    setPhotoPreview(null);
    setSelectedFile(null);
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
        
        <div className="space-y-4 py-4">
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
                  setSelectedFile(null);
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

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            Zrušiť
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedFile || isUpdating}>
            {isUpdating ? 'Ukladá sa...' : 'Uložiť'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

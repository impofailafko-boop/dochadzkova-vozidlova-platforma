import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoUploadProps {
  value?: File;
  onChange: (file: File | undefined) => void;
  disabled?: boolean;
  label?: string;
}

export function PhotoUpload({ value, onChange, disabled, label }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Súbor je príliš veľký. Maximálna veľkosť je 5MB.');
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
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(undefined);
  };

  return (
    <div className="space-y-4">
      {label && <div className="text-sm font-medium">{label}</div>}
      
      {/* Preview section */}
      {preview && (
        <div className="relative w-full max-w-sm mx-auto">
          <img
            src={preview}
            alt="Náhľad fotky"
            className="w-full h-auto rounded-lg border-2 border-primary"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload buttons */}
      {!preview && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => document.getElementById('photo-gallery-input')?.click()}
            disabled={disabled}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Vybrať z galérie
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => document.getElementById('photo-camera-input')?.click()}
            disabled={disabled}
          >
            <Camera className="mr-2 h-4 w-4" />
            Odfotiť
          </Button>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        id="photo-gallery-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <input
        id="photo-camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </div>
  );
}

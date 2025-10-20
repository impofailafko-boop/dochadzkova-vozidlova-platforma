import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useVehicleLogs } from '@/hooks/useVehicleLogs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const [kmEnd, setKmEnd] = useState<number>(log.km_start);
  const [photo, setPhoto] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (kmEnd <= log.km_start) {
      toast.error('Konečné kilometre musia byť vyššie ako počiatočné');
      return;
    }

    completeLog(
      {
        logId: log.id,
        km_end: kmEnd,
        photo_km_end: photo || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setKmEnd(log.km_start);
          setPhoto(null);
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="km_end">Konečný stav kilometrov</Label>
            <Input
              id="km_end"
              type="number"
              value={kmEnd}
              onChange={(e) => setKmEnd(Number(e.target.value))}
              placeholder="napr. 45150"
              required
            />
            <p className="text-sm text-muted-foreground">
              Najazdené: <span className="font-bold">{kmEnd - log.km_start} km</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Foto konečného stavu (voliteľné)</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
          </div>

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
      </DialogContent>
    </Dialog>
  );
}

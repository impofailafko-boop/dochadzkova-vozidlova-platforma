import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CompleteDriveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drive: any;
  onComplete: (id: string, km_end: number) => void;
  isCompleting: boolean;
}

export function CompleteDriveDialog({ open, onOpenChange, drive, onComplete, isCompleting }: CompleteDriveDialogProps) {
  const [kmEnd, setKmEnd] = useState(drive?.km_start || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(drive.id, kmEnd);
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Km začiatku</Label>
            <Input type="number" value={drive?.km_start} disabled />
          </div>
          <div className="space-y-2">
            <Label>Km konca</Label>
            <Input
              type="number"
              value={kmEnd}
              onChange={(e) => setKmEnd(parseInt(e.target.value) || 0)}
              required
              min={drive?.km_start}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Prejdené km: {kmEnd - (drive?.km_start || 0)}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button type="submit" disabled={isCompleting || kmEnd < drive?.km_start}>
              {isCompleting ? 'Dokončujem...' : 'Dokončiť'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

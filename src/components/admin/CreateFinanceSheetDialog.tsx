import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateFinanceSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
}

export function CreateFinanceSheetDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateFinanceSheetDialogProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim());
      setName('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nový hárok</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sheet-name">Názov hárku</Label>
            <Input
              id="sheet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Napr. Firma XYZ"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Zrušiť
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              Vytvoriť
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: any;
  onSave: (id: string, data: any) => void;
  isUpdating: boolean;
}

export function EditAttendanceDialog({ open, onOpenChange, attendance, onSave, isUpdating }: EditAttendanceDialogProps) {
  const [formData, setFormData] = useState({
    arrival_time: attendance?.arrival_time || '',
    departure_time: attendance?.departure_time || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(attendance.id, formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upraviť dochádzku</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Čas príchodu</Label>
            <Input
              type="time"
              value={formData.arrival_time}
              onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Čas odchodu</Label>
            <Input
              type="time"
              value={formData.departure_time}
              onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Ukladám...' : 'Uložiť'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

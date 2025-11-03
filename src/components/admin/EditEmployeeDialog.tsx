import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any;
  onSave: (userId: string, data: any) => void;
  isUpdating: boolean;
}

export function EditEmployeeDialog({ open, onOpenChange, employee, onSave, isUpdating }: EditEmployeeDialogProps) {
  const [formData, setFormData] = useState({
    full_name: employee?.full_name || '',
    phone: employee?.phone || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(employee.user_id, formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upraviť profil zamestnanca</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Celé meno</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Telefón</Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+421 XXX XXX XXX"
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

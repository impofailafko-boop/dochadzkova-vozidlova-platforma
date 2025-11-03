import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

interface CreateAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: any[];
  onCreate: (data: any) => void;
  isCreating: boolean;
}

export function CreateAttendanceDialog({ open, onOpenChange, employees, onCreate, isCreating }: CreateAttendanceDialogProps) {
  const [formData, setFormData] = useState({
    user_id: '',
    date: new Date().toISOString().split('T')[0],
    arrival_time: '',
    departure_time: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    setFormData({
      user_id: '',
      date: new Date().toISOString().split('T')[0],
      arrival_time: '',
      departure_time: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pridať dochádzku</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Zamestnanec</Label>
            <Select
              value={formData.user_id}
              onValueChange={(value) => setFormData({ ...formData, user_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte zamestnanca" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {employees?.map((emp: any) => (
                  <SelectItem key={emp.user_id} value={emp.user_id}>
                    {emp.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Dátum</Label>
            <DatePicker
              date={formData.date ? new Date(formData.date) : undefined}
              onDateChange={(date) => {
                setFormData({ ...formData, date: date ? date.toISOString().split('T')[0] : '' });
              }}
              placeholder="Vyberte dátum"
            />
          </div>
          <div className="space-y-2">
            <Label>Čas príchodu</Label>
            <Input
              type="time"
              value={formData.arrival_time}
              onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
              required
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
            <Button type="submit" disabled={isCreating || !formData.user_id}>
              {isCreating ? 'Vytváram...' : 'Vytvoriť'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

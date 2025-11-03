import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

interface CreateFuelingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: any[];
  projects: any[];
  currentUserId: string;
  onCreate: (data: any) => void;
  isCreating: boolean;
}

export function CreateFuelingDialog({ open, onOpenChange, vehicles, projects, currentUserId, onCreate, isCreating }: CreateFuelingDialogProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    project_id: '',
    liters: 0,
    price: 0,
    note: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      user_id: currentUserId,
      liters: parseFloat(formData.liters.toString()),
      price: formData.price ? parseFloat(formData.price.toString()) : null,
    });
    setFormData({
      date: new Date().toISOString().split('T')[0],
      vehicle_id: '',
      project_id: '',
      liters: 0,
      price: 0,
      note: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pridať tankovanie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label>Vozidlo</Label>
            <Select
              value={formData.vehicle_id}
              onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte vozidlo" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {vehicles?.map((vehicle: any) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.spz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Projekt</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => setFormData({ ...formData, project_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte projekt" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {projects?.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Litre</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.liters}
              onChange={(e) => setFormData({ ...formData, liters: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Cena (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Poznámka</Label>
            <Textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button type="submit" disabled={isCreating || !formData.vehicle_id}>
              {isCreating ? 'Vytváram...' : 'Vytvoriť'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

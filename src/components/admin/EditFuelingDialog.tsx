import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditFuelingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fueling: any;
  vehicles: any[];
  projects: any[];
  onSave: (id: string, data: any) => void;
  isUpdating: boolean;
}

export function EditFuelingDialog({ open, onOpenChange, fueling, vehicles, projects, onSave, isUpdating }: EditFuelingDialogProps) {
  const [formData, setFormData] = useState({
    liters: fueling?.liters || 0,
    price: fueling?.price || 0,
    note: fueling?.note || '',
    vehicle_id: fueling?.vehicle_id || '',
    project_id: fueling?.project_id || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(fueling.id, {
      ...formData,
      liters: parseFloat(formData.liters.toString()),
      price: formData.price ? parseFloat(formData.price.toString()) : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upraviť tankovanie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Ukladám...' : 'Uložiť'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

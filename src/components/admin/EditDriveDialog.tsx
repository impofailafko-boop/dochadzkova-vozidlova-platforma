import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditDriveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drive: any;
  vehicles: any[];
  projects: any[];
  onSave: (id: string, data: any) => void;
  isUpdating: boolean;
}

export function EditDriveDialog({ open, onOpenChange, drive, vehicles, projects, onSave, isUpdating }: EditDriveDialogProps) {
  const [formData, setFormData] = useState({
    km_start: drive?.km_start || 0,
    km_end: drive?.km_end || 0,
    vehicle_id: drive?.vehicle_id || '',
    project_id: drive?.project_id || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(drive.id, {
      ...formData,
      km_start: parseInt(formData.km_start.toString()),
      km_end: parseInt(formData.km_end.toString()),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upraviť jazdu</DialogTitle>
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
            <Label>Km začiatku</Label>
            <Input
              type="number"
              value={formData.km_start}
              onChange={(e) => setFormData({ ...formData, km_start: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
          {drive?.is_completed && (
            <div className="space-y-2">
              <Label>Km konca</Label>
              <Input
                type="number"
                value={formData.km_end}
                onChange={(e) => setFormData({ ...formData, km_end: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          )}
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

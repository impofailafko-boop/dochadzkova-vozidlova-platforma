import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useProjects } from '@/hooks/useProjects';
import { useVehicleLogs } from '@/hooks/useVehicleLogs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const VehicleUse = () => {
  const { user } = useAuth();
  const { data: vehicles, isLoading: loadingVehicles } = useVehicles();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { createLog, isCreating } = useVehicleLogs(user?.id);

  const [formData, setFormData] = useState({
    vehicle_id: '',
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    km_start: '',
    km_end: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_id || !formData.project_id || !formData.km_start || !formData.km_end) {
      return;
    }

    createLog({
      vehicle_id: formData.vehicle_id,
      project_id: formData.project_id,
      date: formData.date,
      km_start: parseInt(formData.km_start),
      km_end: parseInt(formData.km_end),
    });

    // Reset form
    setFormData({
      vehicle_id: '',
      project_id: '',
      date: new Date().toISOString().split('T')[0],
      km_start: '',
      km_end: '',
    });
  };

  const isLoading = loadingVehicles || loadingProjects;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Použitie auta</h1>
        <p className="text-muted-foreground">
          Zaznamenajte údaje o jazde služobným vozidlom
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nová jazda</CardTitle>
          <CardDescription>Vyplňte údaje o použití vozidla</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vozidlo (SPZ)</Label>
                  <Select
                    value={formData.vehicle_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, vehicle_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte vozidlo" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {vehicles?.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.spz} - {vehicle.brand} {vehicle.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Projekt</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, project_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte projekt" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Dátum</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="km_start">Kilometre na začiatku</Label>
                  <Input
                    id="km_start"
                    type="number"
                    placeholder="napr. 45000"
                    value={formData.km_start}
                    onChange={(e) =>
                      setFormData({ ...formData, km_start: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="km_end">Kilometre na konci</Label>
                  <Input
                    id="km_end"
                    type="number"
                    placeholder="napr. 45150"
                    value={formData.km_end}
                    onChange={(e) =>
                      setFormData({ ...formData, km_end: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2 flex items-end">
                  <div className="w-full">
                    <p className="text-sm text-muted-foreground">
                      Najazdené kilometre:{' '}
                      <span className="font-bold text-foreground">
                        {formData.km_start && formData.km_end
                          ? parseInt(formData.km_end) - parseInt(formData.km_start)
                          : 0}{' '}
                        km
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ukladám...
                  </>
                ) : (
                  'Uložiť záznam'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleUse;

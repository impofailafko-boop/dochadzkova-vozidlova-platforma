import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useFuelLogs } from '@/hooks/useFuelLogs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const Fueling = () => {
  const { user } = useAuth();
  const { data: vehicles, isLoading: loadingVehicles } = useVehicles();
  const { createLog, isCreating } = useFuelLogs(user?.id);

  const [formData, setFormData] = useState({
    vehicle_id: '',
    date: new Date().toISOString().split('T')[0],
    liters: '',
    price: '',
    note: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_id || !formData.liters) {
      return;
    }

    createLog({
      vehicle_id: formData.vehicle_id,
      date: formData.date,
      liters: parseFloat(formData.liters),
      price: formData.price ? parseFloat(formData.price) : undefined,
      note: formData.note || undefined,
    });

    // Reset form
    setFormData({
      vehicle_id: '',
      date: new Date().toISOString().split('T')[0],
      liters: '',
      price: '',
      note: '',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tankovanie</h1>
        <p className="text-muted-foreground">
          Zaznamenajte údaje o tankovaní služobného vozidla
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nové tankovanie</CardTitle>
          <CardDescription>Vyplňte údaje o tankovaní</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingVehicles ? (
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
                  <Label htmlFor="liters">Počet litrov</Label>
                  <Input
                    id="liters"
                    type="number"
                    step="0.01"
                    placeholder="napr. 45.5"
                    value={formData.liters}
                    onChange={(e) =>
                      setFormData({ ...formData, liters: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Cena (€) - voliteľné</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="napr. 75.50"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Poznámka - voliteľná</Label>
                <Textarea
                  id="note"
                  placeholder="Prípadné poznámky k tankovaniu..."
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  rows={3}
                />
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

export default Fueling;

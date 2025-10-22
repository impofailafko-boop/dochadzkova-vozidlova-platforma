import { useState } from 'react';
import { useAdminVehicles } from '@/hooks/useAdminVehicles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Edit, Power } from 'lucide-react';

const Vehicles = () => {
  const { vehicles, isLoading, createVehicle, updateVehicle, toggleVehicleStatus, isCreating } = useAdminVehicles();
  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [formData, setFormData] = useState({
    spz: '',
    brand: '',
    type: '',
    current_km: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const vehicleData = {
      spz: formData.spz,
      brand: formData.brand,
      type: formData.type,
      current_km: parseInt(formData.current_km),
    };

    if (editingVehicle) {
      updateVehicle({ id: editingVehicle.id, ...vehicleData });
    } else {
      createVehicle(vehicleData);
    }

    setFormData({ spz: '', brand: '', type: '', current_km: '' });
    setEditingVehicle(null);
    setOpen(false);
  };

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setFormData({
      spz: vehicle.spz,
      brand: vehicle.brand,
      type: vehicle.type,
      current_km: vehicle.current_km.toString(),
    });
    setOpen(true);
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleVehicleStatus({ id, isActive: !currentStatus });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Vozidlá</h1>
          <p className="text-muted-foreground">Správa služobných vozidiel</p>
        </div>

        <Dialog open={open} onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setEditingVehicle(null);
            setFormData({ spz: '', brand: '', type: '', current_km: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nové vozidlo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? 'Upraviť vozidlo' : 'Pridať vozidlo'}
              </DialogTitle>
              <DialogDescription>
                {editingVehicle ? 'Upravte údaje vozidla' : 'Vytvorte nový záznam vozidla'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="spz">SPZ</Label>
                <Input
                  id="spz"
                  value={formData.spz}
                  onChange={(e) => setFormData({ ...formData, spz: e.target.value })}
                  placeholder="napr. BA123AB"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Značka</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="napr. Škoda"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Model</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="napr. Octavia"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_km">Aktuálny stav km</Label>
                <Input
                  id="current_km"
                  type="number"
                  value={formData.current_km}
                  onChange={(e) => setFormData({ ...formData, current_km: e.target.value })}
                  placeholder="napr. 45000"
                  required
                />
              </div>
              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? 'Ukladám...' : editingVehicle ? 'Uložiť zmeny' : 'Vytvoriť'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zoznam vozidiel</CardTitle>
          <CardDescription>Všetky evidované vozidlá</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">SPZ</TableHead>
                    <TableHead className="whitespace-nowrap">Značka</TableHead>
                    <TableHead className="whitespace-nowrap">Model</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Km</TableHead>
                    <TableHead className="whitespace-nowrap">Stav</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles && vehicles.length > 0 ? (
                    vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium whitespace-nowrap">{vehicle.spz}</TableCell>
                        <TableCell className="whitespace-nowrap">{vehicle.brand}</TableCell>
                        <TableCell className="whitespace-nowrap">{vehicle.type}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">{vehicle.current_km.toLocaleString()}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={vehicle.is_active ? 'default' : 'secondary'}>
                            {vehicle.is_active ? 'Aktívne' : 'Neaktívne'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(vehicle)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(vehicle.id, vehicle.is_active)}
                            >
                              <Power className={`h-4 w-4 ${vehicle.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Žiadne vozidlá
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Vehicles;

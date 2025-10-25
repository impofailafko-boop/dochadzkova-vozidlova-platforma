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
import { Plus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Vehicles = () => {
  const navigate = useNavigate();
  const { vehicles, isLoading, createVehicle, updateVehicle, isCreating } = useAdminVehicles();
  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [formData, setFormData] = useState({
    spz: '',
    brand: '',
    type: '',
    current_km: '',
    service_date: '',
    stk_date: '',
    insurance_date: '',
    emission_date: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const vehicleData = {
      spz: formData.spz,
      brand: formData.brand,
      type: formData.type,
      current_km: parseInt(formData.current_km),
      service_date: formData.service_date,
      stk_date: formData.stk_date,
      insurance_date: formData.insurance_date,
      emission_date: formData.emission_date,
    };

    if (editingVehicle) {
      updateVehicle({ id: editingVehicle.id, ...vehicleData });
    } else {
      createVehicle(vehicleData);
    }

    setFormData({ 
      spz: '', 
      brand: '', 
      type: '', 
      current_km: '',
      service_date: '',
      stk_date: '',
      insurance_date: '',
      emission_date: '',
    });
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
      service_date: vehicle.service_date || '',
      stk_date: vehicle.stk_date || '',
      insurance_date: vehicle.insurance_date || '',
      emission_date: vehicle.emission_date || '',
    });
    setOpen(true);
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
            setFormData({ 
              spz: '', 
              brand: '', 
              type: '', 
              current_km: '',
              service_date: '',
              stk_date: '',
              insurance_date: '',
              emission_date: '',
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nové vozidlo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? 'Upraviť vozidlo' : 'Pridať vozidlo'}
              </DialogTitle>
              <DialogDescription>
                {editingVehicle ? 'Upravte údaje vozidla' : 'Vytvorte nový záznam vozidla'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col">
              <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
                <div className="space-y-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold mb-3">Servisné údaje</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service_date">Servis vozidla</Label>
                      <Input
                        id="service_date"
                        value={formData.service_date}
                        onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                        placeholder="napr. 15.12.2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stk_date">STK</Label>
                      <Input
                        id="stk_date"
                        value={formData.stk_date}
                        onChange={(e) => setFormData({ ...formData, stk_date: e.target.value })}
                        placeholder="napr. 20.01.2025"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurance_date">Poistka</Label>
                      <Input
                        id="insurance_date"
                        value={formData.insurance_date}
                        onChange={(e) => setFormData({ ...formData, insurance_date: e.target.value })}
                        placeholder="napr. 30.03.2025"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emission_date">Emisná kontrola</Label>
                      <Input
                        id="emission_date"
                        value={formData.emission_date}
                        onChange={(e) => setFormData({ ...formData, emission_date: e.target.value })}
                        placeholder="napr. 10.06.2025"
                      />
                    </div>
                  </div>
                </div>
                </div>
              </ScrollArea>
              <div className="pt-4 border-t mt-4">
                <Button type="submit" disabled={isCreating} className="w-full">
                  {isCreating ? 'Ukladám...' : editingVehicle ? 'Uložiť zmeny' : 'Vytvoriť'}
                </Button>
              </div>
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
                    <TableHead className="text-center whitespace-nowrap">Servis vozidla</TableHead>
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
                        <TableCell className="text-center whitespace-nowrap">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/admin/vehicles/${vehicle.id}`)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Skontrolovať
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
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

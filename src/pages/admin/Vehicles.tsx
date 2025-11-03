import { useState } from 'react';
import { useAdminVehicles } from '@/hooks/useAdminVehicles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
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
import { Plus, FileText, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Vehicles = () => {
  const navigate = useNavigate();
  const { vehicles, isLoading, createVehicle, updateVehicle, deleteVehicle, isCreating, isDeleting } = useAdminVehicles();
  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    spz: '',
    brand: '',
    type: '',
    current_km: '',
    vin: '',
    highway_sticker_expiry: undefined as Date | undefined,
    service_date: undefined as Date | undefined,
    stk_date: undefined as Date | undefined,
    insurance_date: undefined as Date | undefined,
    emission_date: undefined as Date | undefined,
    service_note: '',
    stk_note: '',
    insurance_note: '',
    emission_note: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const vehicleData = {
      spz: formData.spz,
      brand: formData.brand,
      type: formData.type,
      current_km: parseInt(formData.current_km),
      vin: formData.vin || null,
      highway_sticker_expiry: formData.highway_sticker_expiry ? format(formData.highway_sticker_expiry, 'dd.MM.yyyy') : null,
      service_date: formData.service_date ? format(formData.service_date, 'dd.MM.yyyy') : null,
      stk_date: formData.stk_date ? format(formData.stk_date, 'dd.MM.yyyy') : null,
      insurance_date: formData.insurance_date ? format(formData.insurance_date, 'dd.MM.yyyy') : null,
      emission_date: formData.emission_date ? format(formData.emission_date, 'dd.MM.yyyy') : null,
      service_note: formData.service_note || null,
      stk_note: formData.stk_note || null,
      insurance_note: formData.insurance_note || null,
      emission_note: formData.emission_note || null,
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
      vin: '',
      highway_sticker_expiry: undefined,
      service_date: undefined,
      stk_date: undefined,
      insurance_date: undefined,
      emission_date: undefined,
      service_note: '',
      stk_note: '',
      insurance_note: '',
      emission_note: '',
    });
    setEditingVehicle(null);
    setOpen(false);
  };

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    
    const parseDate = (dateStr: string | null) => {
      if (!dateStr) return undefined;
      const [day, month, year] = dateStr.split('.');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    };
    
    setFormData({
      spz: vehicle.spz,
      brand: vehicle.brand,
      type: vehicle.type,
      current_km: vehicle.current_km.toString(),
      vin: vehicle.vin || '',
      highway_sticker_expiry: parseDate(vehicle.highway_sticker_expiry),
      service_date: parseDate(vehicle.service_date),
      stk_date: parseDate(vehicle.stk_date),
      insurance_date: parseDate(vehicle.insurance_date),
      emission_date: parseDate(vehicle.emission_date),
      service_note: vehicle.service_note || '',
      stk_note: vehicle.stk_note || '',
      insurance_note: vehicle.insurance_note || '',
      emission_note: vehicle.emission_note || '',
    });
    setOpen(true);
  };

  const handleDeleteClick = (vehicle: any) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (vehicleToDelete) {
      deleteVehicle(vehicleToDelete.id);
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };


  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
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
              vin: '',
              highway_sticker_expiry: undefined,
              service_date: undefined,
              stk_date: undefined,
              insurance_date: undefined,
              emission_date: undefined,
              service_note: '',
              stk_note: '',
              insurance_note: '',
              emission_note: '',
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nové vozidlo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-[95vw] sm:max-w-2xl">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="vin">VIN číslo</Label>
                    <Input
                      id="vin"
                      value={formData.vin}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                      placeholder="napr. WBADT43452G123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="highway_sticker">Diaľničná známka - platnosť do</Label>
                    <DatePicker
                      date={formData.highway_sticker_expiry}
                      onDateChange={(date) => setFormData({ ...formData, highway_sticker_expiry: date })}
                      placeholder="Vyberte dátum platnosti"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold mb-3">Servisné údaje</h4>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="service_date">Servis vozidla</Label>
                      <DatePicker
                        date={formData.service_date}
                        onDateChange={(date) => setFormData({ ...formData, service_date: date })}
                        placeholder="Vyberte dátum servisu"
                      />
                      <Textarea
                        id="service_note"
                        value={formData.service_note}
                        onChange={(e) => setFormData({ ...formData, service_note: e.target.value })}
                        placeholder="Poznámka k servisu (voliteľné)"
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stk_date">STK</Label>
                      <DatePicker
                        date={formData.stk_date}
                        onDateChange={(date) => setFormData({ ...formData, stk_date: date })}
                        placeholder="Vyberte dátum STK"
                      />
                      <Textarea
                        id="stk_note"
                        value={formData.stk_note}
                        onChange={(e) => setFormData({ ...formData, stk_note: e.target.value })}
                        placeholder="Poznámka k STK (voliteľné)"
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="insurance_date">Poistka</Label>
                      <DatePicker
                        date={formData.insurance_date}
                        onDateChange={(date) => setFormData({ ...formData, insurance_date: date })}
                        placeholder="Vyberte dátum poistky"
                      />
                      <Textarea
                        id="insurance_note"
                        value={formData.insurance_note}
                        onChange={(e) => setFormData({ ...formData, insurance_note: e.target.value })}
                        placeholder="Poznámka k poistke (voliteľné)"
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emission_date">Emisná kontrola</Label>
                      <DatePicker
                        date={formData.emission_date}
                        onDateChange={(date) => setFormData({ ...formData, emission_date: date })}
                        placeholder="Vyberte dátum emisnej kontroly"
                      />
                      <Textarea
                        id="emission_note"
                        value={formData.emission_note}
                        onChange={(e) => setFormData({ ...formData, emission_note: e.target.value })}
                        placeholder="Poznámka k emisnej kontrole (voliteľné)"
                        className="min-h-[60px]"
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
                    <TableHead className="text-center whitespace-nowrap">Akcie</TableHead>
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
                          <div className="flex gap-2 justify-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/admin/vehicles/${vehicle.id}`)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Skontrolovať
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteClick(vehicle)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vymazať vozidlo?</AlertDialogTitle>
            <AlertDialogDescription>
              Naozaj chcete vymazať vozidlo <strong>{vehicleToDelete?.spz}</strong>? Táto akcia sa nedá vrátiť späť.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušiť</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Vymazať
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vehicles;

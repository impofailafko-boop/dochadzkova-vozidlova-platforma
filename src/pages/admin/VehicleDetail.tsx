import { useParams, useNavigate } from 'react-router-dom';
import { useAdminVehicles } from '@/hooks/useAdminVehicles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const VehicleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, isLoading, updateVehicle, toggleVehicleStatus, isUpdating, isToggling } = useAdminVehicles();
  const [isEditing, setIsEditing] = useState(false);
  
  const vehicle = vehicles?.find(v => v.id === id);

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

  useEffect(() => {
    if (vehicle) {
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
    }
  }, [vehicle]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Vozidlo nenájdené
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    if (!id) return;
    
    updateVehicle({
      id,
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
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
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
    setIsEditing(false);
  };

  const handleToggleStatus = () => {
    if (!id) return;
    toggleVehicleStatus({ id, isActive: !vehicle.is_active });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Detail vozidla</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{vehicle.brand} {vehicle.type} - {vehicle.spz}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={vehicle.is_active ? 'default' : 'secondary'}>
            {vehicle.is_active ? 'Aktívne' : 'Neaktívne'}
          </Badge>
          <Button 
            variant="outline" 
            onClick={handleToggleStatus}
            disabled={isToggling}
            className="flex-1 sm:flex-none"
          >
            {vehicle.is_active ? 'Deaktivovať' : 'Aktivovať'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Informácie o vozidle</CardTitle>
              <CardDescription>Kompletné údaje a servisné informácie</CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Upraviť
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isUpdating}>
                  <Save className="mr-2 h-4 w-4" />
                  Uložiť
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Zrušiť
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="spz">SPZ</Label>
              {isEditing ? (
                <Input
                  id="spz"
                  value={formData.spz}
                  onChange={(e) => setFormData({ ...formData, spz: e.target.value })}
                />
              ) : (
                <p className="text-lg font-medium">{vehicle.spz}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Značka</Label>
              {isEditing ? (
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              ) : (
                <p className="text-lg font-medium">{vehicle.brand}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Model</Label>
              {isEditing ? (
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
              ) : (
                <p className="text-lg font-medium">{vehicle.type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_km">Aktuálny stav km</Label>
              {isEditing ? (
                <Input
                  id="current_km"
                  type="number"
                  value={formData.current_km}
                  onChange={(e) => setFormData({ ...formData, current_km: e.target.value })}
                />
              ) : (
                <p className="text-lg font-medium">{vehicle.current_km.toLocaleString()} km</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin">VIN číslo</Label>
              {isEditing ? (
                <Input
                  id="vin"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                  placeholder="napr. WBADT43452G123456"
                />
              ) : (
                <p className="text-lg font-medium">{vehicle.vin || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="highway_sticker">Diaľničná známka - platnosť do</Label>
              {isEditing ? (
                <DatePicker
                  date={formData.highway_sticker_expiry}
                  onDateChange={(date) => setFormData({ ...formData, highway_sticker_expiry: date })}
                  placeholder="Vyberte dátum platnosti"
                />
              ) : (
                <p className="text-lg font-medium">{vehicle.highway_sticker_expiry || '-'}</p>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Servisné údaje</h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <Label htmlFor="service_date">Servis vozidla</Label>
                {isEditing ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium">{vehicle.service_date || '-'}</p>
                    {vehicle.service_note && (
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {vehicle.service_note}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="stk_date">STK</Label>
                {isEditing ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium">{vehicle.stk_date || '-'}</p>
                    {vehicle.stk_note && (
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {vehicle.stk_note}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="insurance_date">Poistka</Label>
                {isEditing ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium">{vehicle.insurance_date || '-'}</p>
                    {vehicle.insurance_note && (
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {vehicle.insurance_note}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="emission_date">Emisná kontrola</Label>
                {isEditing ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium">{vehicle.emission_date || '-'}</p>
                    {vehicle.emission_note && (
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {vehicle.emission_note}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleDetail;

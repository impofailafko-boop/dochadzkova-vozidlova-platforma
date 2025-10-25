import { useParams, useNavigate } from 'react-router-dom';
import { useAdminVehicles } from '@/hooks/useAdminVehicles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';

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
    service_date: '',
    stk_date: '',
    insurance_date: '',
    emission_date: '',
  });

  useEffect(() => {
    if (vehicle) {
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
      service_date: formData.service_date,
      stk_date: formData.stk_date,
      insurance_date: formData.insurance_date,
      emission_date: formData.emission_date,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/vehicles')}>
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
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Servisné údaje</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="service_date">Servis vozidla</Label>
                {isEditing ? (
                  <Input
                    id="service_date"
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                    placeholder="napr. 15.12.2024"
                  />
                ) : (
                  <p className="text-lg font-medium">{vehicle.service_date || '-'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stk_date">STK</Label>
                {isEditing ? (
                  <Input
                    id="stk_date"
                    value={formData.stk_date}
                    onChange={(e) => setFormData({ ...formData, stk_date: e.target.value })}
                    placeholder="napr. 20.01.2025"
                  />
                ) : (
                  <p className="text-lg font-medium">{vehicle.stk_date || '-'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance_date">Poistka</Label>
                {isEditing ? (
                  <Input
                    id="insurance_date"
                    value={formData.insurance_date}
                    onChange={(e) => setFormData({ ...formData, insurance_date: e.target.value })}
                    placeholder="napr. 30.03.2025"
                  />
                ) : (
                  <p className="text-lg font-medium">{vehicle.insurance_date || '-'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emission_date">Emisná kontrola</Label>
                {isEditing ? (
                  <Input
                    id="emission_date"
                    value={formData.emission_date}
                    onChange={(e) => setFormData({ ...formData, emission_date: e.target.value })}
                    placeholder="napr. 10.06.2025"
                  />
                ) : (
                  <p className="text-lg font-medium">{vehicle.emission_date || '-'}</p>
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

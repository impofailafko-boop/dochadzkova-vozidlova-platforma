import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';

interface Vehicle {
  id: string;
  km_start: number;
  vehicles?: {
    spz: string;
    brand: string;
    type: string;
  };
  projects?: {
    name: string;
    description?: string;
  };
}

interface SelectVehicleToCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  onVehicleSelected: (vehicle: Vehicle) => void;
}

export function SelectVehicleToCompleteDialog({ 
  open, 
  onOpenChange, 
  vehicles,
  onVehicleSelected 
}: SelectVehicleToCompleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vyberte vozidlo na ukončenie</DialogTitle>
          <DialogDescription>
            Máte evidovaných {vehicles.length} vozidiel. Vyberte ktoré chcete ukončiť.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <Button
              key={vehicle.id}
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-start gap-1"
              onClick={() => onVehicleSelected(vehicle)}
            >
              <div className="flex items-center gap-2 font-semibold">
                <Car className="h-4 w-4" />
                {vehicle.vehicles?.spz}
              </div>
              <div className="text-sm text-muted-foreground">
                {vehicle.vehicles?.brand} {vehicle.vehicles?.type}
              </div>
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">
                  Projekt: {vehicle.projects?.name}
                </div>
                {vehicle.projects?.description && (
                  <div className="text-xs text-muted-foreground/80 line-clamp-1">
                    {vehicle.projects.description}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Začiatok: {vehicle.km_start} km
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

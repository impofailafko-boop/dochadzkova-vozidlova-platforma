import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';
import { useState } from 'react';
import { CompleteDriveDialog } from './CompleteDriveDialog';
import { SelectVehicleToCompleteDialog } from './SelectVehicleToCompleteDialog';

interface ActiveVehicle {
  id: string;
  km_start: number;
  vehicles?: {
    spz: string;
    brand: string;
    type: string;
  };
  projects?: {
    name: string;
  };
}

interface ActiveVehicleCardProps {
  activeVehicles: ActiveVehicle[];
}

export function ActiveVehicleCard({ activeVehicles }: ActiveVehicleCardProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<ActiveVehicle | null>(null);
  const [showSelectDialog, setShowSelectDialog] = useState(false);

  const handleCompleteClick = () => {
    if (activeVehicles.length === 1) {
      setSelectedVehicle(activeVehicles[0]);
    } else {
      setShowSelectDialog(true);
    }
  };

  const handleVehicleSelected = (vehicle: ActiveVehicle) => {
    setShowSelectDialog(false);
    setSelectedVehicle(vehicle);
  };

  if (activeVehicles.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5" />
            Používané {activeVehicles.length === 1 ? 'auto' : 'autá'}
          </CardTitle>
          <CardDescription className="text-sm">
            {activeVehicles.length === 1 
              ? 'Momentálne evidované vozidlo' 
              : `Momentálne evidovaných ${activeVehicles.length} vozidiel`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeVehicles.map((vehicle) => (
            <div key={vehicle.id} className="p-2.5 bg-muted/50 rounded-lg space-y-1.5">
              <div className="font-semibold text-base">
                {vehicle.vehicles?.spz}
              </div>
              <div className="text-sm text-muted-foreground">
                {vehicle.vehicles?.brand} {vehicle.vehicles?.type}
              </div>
              <div className="text-xs text-muted-foreground">
                Projekt: {vehicle.projects?.name || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                Začiatok: {vehicle.km_start} km
              </div>
            </div>
          ))}
          
          <Button 
            variant="destructive" 
            className="w-full h-9"
            onClick={handleCompleteClick}
          >
            Ukončiť {activeVehicles.length === 1 ? 'auto' : 'jazdu auta'}
          </Button>
        </CardContent>
      </Card>

      {selectedVehicle && (
        <CompleteDriveDialog
          open={!!selectedVehicle}
          onOpenChange={(open) => !open && setSelectedVehicle(null)}
          log={selectedVehicle}
        />
      )}

      {showSelectDialog && (
        <SelectVehicleToCompleteDialog
          open={showSelectDialog}
          onOpenChange={setShowSelectDialog}
          vehicles={activeVehicles}
          onVehicleSelected={handleVehicleSelected}
        />
      )}
    </>
  );
}

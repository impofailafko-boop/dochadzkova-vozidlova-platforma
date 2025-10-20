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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

const vehicleLogSchema = z.object({
  vehicle_id: z.string().min(1, 'Vyberte vozidlo'),
  project_id: z.string().min(1, 'Vyberte projekt'),
  date: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate <= today;
  }, 'Dátum nemôže byť v budúcnosti'),
  km_start: z.coerce.number().positive('Kilometre musia byť kladné číslo').int('Kilometre musia byť celé číslo'),
  km_end: z.coerce.number().positive('Kilometre musia byť kladné číslo').int('Kilometre musia byť celé číslo'),
}).refine((data) => data.km_end > data.km_start, {
  message: 'Konečné kilometre musia byť vyššie ako počiatočné',
  path: ['km_end'],
});

type VehicleLogFormData = z.infer<typeof vehicleLogSchema>;

const VehicleUse = () => {
  const { user } = useAuth();
  const { data: vehicles, isLoading: loadingVehicles } = useVehicles();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { createLog, isCreating } = useVehicleLogs(user?.id);

  const form = useForm<VehicleLogFormData>({
    resolver: zodResolver(vehicleLogSchema),
    defaultValues: {
      vehicle_id: '',
      project_id: '',
      date: new Date().toISOString().split('T')[0],
      km_start: 0,
      km_end: 0,
    },
  });

  const handleSubmit = (data: VehicleLogFormData) => {
    createLog(
      {
        vehicle_id: data.vehicle_id,
        project_id: data.project_id,
        date: data.date,
        km_start: data.km_start,
        km_end: data.km_end,
      },
      {
        onSuccess: () => {
          form.reset({
            vehicle_id: '',
            project_id: '',
            date: new Date().toISOString().split('T')[0],
            km_start: 0,
            km_end: 0,
          });
          toast.success('Záznam o jazde bol úspešne uložený');
        },
        onError: (error) => {
          toast.error('Chyba pri ukladaní záznamu: ' + error.message);
        },
      }
    );
  };

  const isLoading = loadingVehicles || loadingProjects;
  const kmDriven = form.watch('km_end') - form.watch('km_start');

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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="vehicle_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vozidlo (SPZ)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte vozidlo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover z-50">
                            {vehicles?.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.spz} - {vehicle.brand} {vehicle.type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="project_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projekt</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte projekt" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover z-50">
                            {projects?.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dátum</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="km_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kilometre na začiatku</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="napr. 45000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="km_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kilometre na konci</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="napr. 45150" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2 flex items-end">
                    <div className="w-full">
                      <p className="text-sm text-muted-foreground">
                        Najazdené kilometre:{' '}
                        <span className="font-bold text-foreground">
                          {kmDriven > 0 ? kmDriven : 0} km
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
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleUse;

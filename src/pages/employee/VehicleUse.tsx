import { useAuth } from '@/contexts/AuthContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useProjects } from '@/hooks/useProjects';
import { useVehicleLogs } from '@/hooks/useVehicleLogs';
import { useAttendance } from '@/hooks/useAttendance';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';

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
  photo_km_start: z.instanceof(File).optional(),
});

type VehicleLogFormData = z.infer<typeof vehicleLogSchema>;

const VehicleUse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: vehicles, isLoading: loadingVehicles } = useVehicles();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { createLog, isCreating } = useVehicleLogs(user?.id);
  const { todayAttendance, isLoading: loadingAttendance } = useAttendance(user?.id);

  const form = useForm<VehicleLogFormData>({
    resolver: zodResolver(vehicleLogSchema),
    defaultValues: {
      vehicle_id: '',
      project_id: '',
      date: new Date().toISOString().split('T')[0],
      km_start: 0,
    },
  });

  // Persist form data in localStorage (exclude photo file)
  const { clearPersistedData } = useFormPersistence(form, 'vehicle-use-form', ['photo_km_start']);

  const handleSubmit = (data: VehicleLogFormData) => {
    createLog(
      {
        vehicle_id: data.vehicle_id,
        project_id: data.project_id,
        date: data.date,
        km_start: data.km_start,
        photo_km_start: data.photo_km_start,
      },
      {
        onSuccess: () => {
          clearPersistedData();
          toast.success('Jazda začatá');
          navigate('/dashboard');
        },
        onError: (error) => {
          toast.error('Chyba pri ukladaní záznamu: ' + error.message);
        },
      }
    );
  };

  const isLoading = loadingVehicles || loadingProjects || loadingAttendance;
  const hasCheckedIn = todayAttendance && todayAttendance.arrival_time;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Použitie auta</h1>
        <p className="text-muted-foreground">
          Zaznamenajte údaje o jazde služobným vozidlom
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Začať jazdu</CardTitle>
          <CardDescription>Zaznamenajte začiatok jazdy a stav kilometrov</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !hasCheckedIn ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Príchod do práce nie je zaznamenaný</AlertTitle>
              <AlertDescription className="mt-2 space-y-3">
                <p>Pred evidenciou jazdy musíte najprv zaznamenať príchod do práce.</p>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/attendance">Zaznamenať príchod</Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
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
                          <DatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onDateChange={(date) => {
                              field.onChange(date ? date.toISOString().split('T')[0] : '');
                            }}
                            placeholder="Vyberte dátum jazdy"
                            disableFuture
                          />
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
                    name="photo_km_start"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Foto stavu kilometrov</FormLabel>
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) onChange(file);
                            }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={isCreating} className="w-full">
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Začínam...
                    </>
                  ) : (
                    'Začať jazdu'
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

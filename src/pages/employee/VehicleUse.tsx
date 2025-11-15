import { useAuth } from '@/contexts/AuthContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useProjects } from '@/hooks/useProjects';
import { useVehicleLogs } from '@/hooks/useVehicleLogs';
import { useAttendance } from '@/hooks/useAttendance';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { clearLastFormRoute } from '@/hooks/useRouteTracking';
import { useProfile } from '@/hooks/useProfile';
import { useDebounce } from '@/hooks/useDebounce';
import { useLastVehicleKm } from '@/hooks/useLastVehicleKm';
import { useMemo, useCallback, useEffect } from 'react';
import { OfflineIndicator } from '@/components/employee/OfflineIndicator';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import { useDailyProject } from '@/hooks/useDailyProject';
import { formatDateToLocalString, getTodayLocalString, parseDateString } from '@/lib/utils';
import { optionalPhotoFileSchema } from '@/lib/photoSchemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    const selectedDate = parseDateString(date);
    const today = parseDateString(getTodayLocalString());
    return selectedDate <= today;
  }, 'Dátum nemôže byť v budúcnosti'),
  km_start: z.coerce.number().positive('Kilometre musia byť kladné číslo').int('Kilometre musia byť celé číslo'),
  photo_km_start: optionalPhotoFileSchema,
});

type VehicleLogFormData = z.infer<typeof vehicleLogSchema>;

const VehicleUse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile(user?.id);
  const { data: vehicles, isLoading: loadingVehicles } = useVehicles();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { createLog, isCreating } = useVehicleLogs(user?.id);
  const { todayAttendance, isLoading: loadingAttendance } = useAttendance(user?.id);
  const { currentProjectId, isLoading: isLoadingDailyProject } = useDailyProject(user?.id);

  const form = useForm<VehicleLogFormData>({
    resolver: zodResolver(vehicleLogSchema),
    defaultValues: {
      vehicle_id: '',
      project_id: '',
      date: getTodayLocalString(),
      km_start: 0,
    },
  });

  const selectedVehicleId = form.watch('vehicle_id');
  const { data: lastKm } = useLastVehicleKm(selectedVehicleId);

  // Auto-fill project from daily selection
  useEffect(() => {
    if (currentProjectId && !form.getValues('project_id')) {
      form.setValue('project_id', currentProjectId);
    }
  }, [currentProjectId, form]);

  // Auto-fill km_start from last completed drive
  useEffect(() => {
    if (lastKm && selectedVehicleId) {
      const currentKmStart = form.getValues('km_start');
      if (!currentKmStart || currentKmStart === 0) {
        form.setValue('km_start', lastKm);
        toast.info(`Kilometre predvyplnené z poslednej jazdy: ${lastKm} km`);
      }
    }
  }, [lastKm, selectedVehicleId, form]);

  // Persist form data in localStorage (exclude photo file)
  const { clearPersistedData } = useFormPersistence(form, 'vehicle-use-form', ['photo_km_start']);

  const handleSubmitCore = useCallback((data: VehicleLogFormData) => {
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
          clearLastFormRoute();
          toast.success('Jazda začatá');
          navigate('/dashboard');
        },
        onError: (error) => {
          toast.error('Chyba pri ukladaní záznamu: ' + error.message);
        },
      }
    );
  }, [createLog, clearPersistedData, navigate]);

  const { debouncedFn: debouncedSubmit } = useDebounce(handleSubmitCore, 2000);
  
  const handleSubmit = (data: VehicleLogFormData) => {
    debouncedSubmit(data);
  };

  // Sort vehicles - last used vehicle first
  const sortedVehicles = useMemo(() => {
    if (!vehicles || !profile?.last_used_vehicle_id) {
      return vehicles || [];
    }
    
    const lastUsedIndex = vehicles.findIndex(
      v => v.id === profile.last_used_vehicle_id
    );
    
    if (lastUsedIndex === -1) {
      return vehicles;
    }
    
    const lastUsed = vehicles[lastUsedIndex];
    const others = vehicles.filter(v => v.id !== profile.last_used_vehicle_id);
    
    return [lastUsed, ...others];
  }, [vehicles, profile?.last_used_vehicle_id]);

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

      <OfflineIndicator />

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
          ) : (
            <div className="space-y-4">
              {!hasCheckedIn && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Príchod do práce nie je zaznamenaný</AlertTitle>
                  <AlertDescription className="mt-2 space-y-3">
                    <p>Pred evidenciou jazdy musíte najprv zaznamenať príchod do práce.</p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/attendance?returnUrl=/vehicle-use">Zaznamenať príchod</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <fieldset disabled={!hasCheckedIn} className="space-y-4">
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="vehicle_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vozidlo (SPZ)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!hasCheckedIn}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Vyberte vozidlo" />
                                </SelectTrigger>
                              </FormControl>
                  <SelectContent className="bg-popover z-50">
                    {sortedVehicles?.map((vehicle, index) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        <div className="flex items-center gap-2">
                          <span>{vehicle.spz} - {vehicle.brand} {vehicle.type}</span>
                          {index === 0 && profile?.last_used_vehicle_id === vehicle.id && (
                            <span className="text-xs text-muted-foreground">
                              (Naposledy použité)
                            </span>
                          )}
                        </div>
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
                            <Select onValueChange={field.onChange} value={field.value} disabled={!hasCheckedIn}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Vyberte projekt" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-popover z-50">
                                {projects?.map((project) => (
                                  <SelectItem key={project.id} value={project.id}>
                                    <div className="flex flex-col gap-1 py-1">
                                      <span className="font-medium">{project.name}</span>
                                      {project.description && (
                                        <span className="text-xs text-muted-foreground line-clamp-2">
                                          {project.description}
                                        </span>
                                      )}
                                    </div>
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
                                date={field.value ? parseDateString(field.value) : undefined}
                                onDateChange={(date) => {
                                  field.onChange(date ? formatDateToLocalString(date) : '');
                                }}
                                placeholder="Vyberte dátum jazdy"
                                disableFuture
                                disabled={!hasCheckedIn}
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
                        render={({ field: { value, onChange } }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Foto stavu kilometrov - voliteľné</FormLabel>
                            <FormControl>
                              <PhotoUpload
                                value={value}
                                onChange={onChange}
                                disabled={!hasCheckedIn}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" disabled={isCreating || !hasCheckedIn} className="w-full">
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Začínam...
                        </>
                      ) : (
                        'Začať jazdu'
                      )}
                    </Button>
                  </fieldset>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleUse;

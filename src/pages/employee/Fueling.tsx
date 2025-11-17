import { useAuth } from '@/contexts/AuthContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useFuelLogs } from '@/hooks/useFuelLogs';
import { useProjects } from '@/hooks/useProjects';
import { useAttendance } from '@/hooks/useAttendance';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { clearLastFormRoute } from '@/hooks/useRouteTracking';
import { useDebounce } from '@/hooks/useDebounce';
import { OfflineIndicator } from '@/components/employee/OfflineIndicator';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import { useDailyProject } from '@/hooks/useDailyProject';
import { formatDateToLocalString, getTodayLocalString, parseDateString } from '@/lib/utils';
import { optionalPhotoFileSchema } from '@/lib/photoSchemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';

const fuelLogSchema = z.object({
  vehicle_id: z.string().min(1, 'Vyberte vozidlo'),
  project_id: z.string().optional(),
  date: z.string().refine((date) => {
    const selectedDate = parseDateString(date);
    const today = parseDateString(getTodayLocalString());
    return selectedDate <= today;
  }, 'Dátum nemôže byť v budúcnosti'),
  liters: z.coerce.number().positive('Počet litrov musí byť kladné číslo').max(500, 'Počet litrov je príliš vysoký'),
  price: z.coerce.number().positive('Cena musí byť kladné číslo').max(10000, 'Cena je príliš vysoká').optional().or(z.literal(0)),
  note: z.string().max(500, 'Poznámka je príliš dlhá').optional(),
  photo_receipt: optionalPhotoFileSchema,
});

type FuelLogFormData = z.infer<typeof fuelLogSchema>;

const Fueling = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: vehicles, isLoading: loadingVehicles } = useVehicles();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { createLog, isCreating } = useFuelLogs(user?.id);
  const { todayAttendance, isLoading: loadingAttendance } = useAttendance(user?.id);
  const { currentProjectId, isLoading: isLoadingDailyProject } = useDailyProject(user?.id);

  const form = useForm<FuelLogFormData>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      vehicle_id: '',
      project_id: '',
      date: getTodayLocalString(),
      liters: 0,
      price: 0,
      note: '',
    },
  });

  // Auto-fill project from daily selection
  useEffect(() => {
    if (currentProjectId && !form.getValues('project_id')) {
      form.setValue('project_id', currentProjectId);
    }
  }, [currentProjectId, form]);

  // Persist form data in localStorage (exclude photo file)
  const { clearPersistedData } = useFormPersistence(form, 'fueling-form', ['photo_receipt']);

  const handleSubmitCore = useCallback((data: FuelLogFormData) => {
    createLog(
      {
        vehicle_id: data.vehicle_id,
        project_id: data.project_id || undefined,
        date: data.date,
        liters: data.liters,
        price: data.price && data.price > 0 ? data.price : undefined,
        note: data.note || undefined,
        photo_receipt: data.photo_receipt,
      },
      {
        onSuccess: () => {
          clearPersistedData();
          clearLastFormRoute();
          form.reset({
            vehicle_id: '',
            project_id: '',
            date: getTodayLocalString(),
            liters: 0,
            price: 0,
            note: '',
          });
          toast.success('Záznam o tankovaní bol úspešne uložený');
          navigate('/dashboard');
        },
        onError: (error) => {
          toast.error('Chyba pri ukladaní záznamu: ' + error.message);
        },
      }
    );
  }, [createLog, clearPersistedData, form]);

  const { debouncedFn: debouncedSubmit } = useDebounce(handleSubmitCore, 500);
  
  const handleSubmit = (data: FuelLogFormData) => {
    debouncedSubmit(data);
  };

  const isLoading = loadingVehicles || loadingProjects || loadingAttendance;
  const hasCheckedIn = todayAttendance && todayAttendance.arrival_time;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tankovanie</h1>
        <p className="text-muted-foreground">
          Zaznamenajte údaje o tankovaní služobného vozidla
        </p>
      </div>

      <OfflineIndicator />

      <Card>
        <CardHeader>
          <CardTitle>Nové tankovanie</CardTitle>
          <CardDescription>Vyplňte údaje o tankovaní</CardDescription>
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
                    <p>Pred evidenciou tankovania musíte najprv zaznamenať príchod do práce.</p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/attendance?returnUrl=/fueling">Zaznamenať príchod</Link>
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
                            <FormLabel>Projekt - voliteľný</FormLabel>
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
                                placeholder="Vyberte dátum tankovania"
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
                        name="liters"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Počet litrov</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="napr. 45.5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cena (€) - voliteľné</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="napr. 75.50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poznámka - voliteľná</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Prípadné poznámky k tankovaniu..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="photo_receipt"
                      render={({ field: { value, onChange } }) => (
                        <FormItem>
                          <FormLabel>Foto účtenky - voliteľné</FormLabel>
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

                    <Button type="submit" disabled={isCreating || !hasCheckedIn} className="w-full">
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Ukladám...
                        </>
                      ) : (
                        'Uložiť záznam'
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

export default Fueling;

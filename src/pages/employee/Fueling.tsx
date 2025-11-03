import { useAuth } from '@/contexts/AuthContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useFuelLogs } from '@/hooks/useFuelLogs';
import { useProjects } from '@/hooks/useProjects';
import { useAttendance } from '@/hooks/useAttendance';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { clearLastFormRoute } from '@/hooks/useRouteTracking';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateToLocalString, getTodayLocalString, parseDateString } from '@/lib/utils';
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
import { Loader2, AlertCircle, Camera, ImageIcon, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

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
  photo_receipt: z.instanceof(File).optional(),
});

type FuelLogFormData = z.infer<typeof fuelLogSchema>;

const Fueling = () => {
  const { user } = useAuth();
  const { data: vehicles, isLoading: loadingVehicles } = useVehicles();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { createLog, isCreating } = useFuelLogs(user?.id);
  const { todayAttendance, isLoading: loadingAttendance } = useAttendance(user?.id);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

  // Persist form data in localStorage (exclude photo file)
  const { clearPersistedData } = useFormPersistence(form, 'fueling-form', ['photo_receipt']);

  const handlePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (file: File | undefined) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Súbor je príliš veľký. Maximálna veľkosť je 10MB.');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Neplatný formát súboru. Nahrajte obrázok.');
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      onChange(file);
    }
  };

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
          setPhotoPreview(null);
          form.reset({
            vehicle_id: '',
            project_id: '',
            date: getTodayLocalString(),
            liters: 0,
            price: 0,
            note: '',
          });
          toast.success('Záznam o tankovaní bol úspešne uložený');
        },
        onError: (error) => {
          toast.error('Chyba pri ukladaní záznamu: ' + error.message);
        },
      }
    );
  }, [createLog, clearPersistedData, form]);

  const { debouncedFn: debouncedSubmit } = useDebounce(handleSubmitCore, 2000);
  
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
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Foto účtenky - voliteľné</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              {/* Preview section */}
                              {photoPreview && (
                                <div className="relative w-full max-w-sm mx-auto">
                                  <img 
                                    src={photoPreview} 
                                    alt="Náhľad účtenky" 
                                    className="w-full h-auto rounded-lg border-2 border-primary"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                      setPhotoPreview(null);
                                      onChange(undefined);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              
                              {/* Upload buttons */}
                              {!photoPreview && (
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => document.getElementById('photo-gallery')?.click()}
                                  >
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Vybrať z galérie
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => document.getElementById('photo-camera')?.click()}
                                  >
                                    <Camera className="mr-2 h-4 w-4" />
                                    Odfotiť
                                  </Button>
                                </div>
                              )}
                              
                              {/* Hidden inputs */}
                              <input
                                id="photo-gallery"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoChange(e, onChange)}
                                {...field}
                              />
                              <input
                                id="photo-camera"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => handlePhotoChange(e, onChange)}
                                {...field}
                              />
                            </div>
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

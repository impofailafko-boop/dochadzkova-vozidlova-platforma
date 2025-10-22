import { useAuth } from '@/contexts/AuthContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useFuelLogs } from '@/hooks/useFuelLogs';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
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

const fuelLogSchema = z.object({
  vehicle_id: z.string().min(1, 'Vyberte vozidlo'),
  project_id: z.string().optional(),
  date: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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

  const form = useForm<FuelLogFormData>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      vehicle_id: '',
      project_id: '',
      date: new Date().toISOString().split('T')[0],
      liters: 0,
      price: 0,
      note: '',
    },
  });

  const handleSubmit = (data: FuelLogFormData) => {
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
          form.reset({
            vehicle_id: '',
            project_id: '',
            date: new Date().toISOString().split('T')[0],
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
  };

  return (
    <div className="p-6 space-y-6">
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
          {loadingVehicles || loadingProjects ? (
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
                        <FormLabel>Projekt - voliteľný</FormLabel>
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
                            placeholder="Vyberte dátum tankovania"
                            disableFuture
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

export default Fueling;

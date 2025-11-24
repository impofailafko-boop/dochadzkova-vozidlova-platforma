import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { Loader2, WifiOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const selectProjectSchema = z.object({
  project_id: z.string().min(1, 'Vyberte projekt alebo kliknite na Preskočiť'),
});

type SelectProjectFormData = z.infer<typeof selectProjectSchema>;

interface SelectProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (projectId: string | null) => void;
}

export function SelectProjectDialog({ open, onClose, onSelect }: SelectProjectDialogProps) {
  const { data: projects, isLoading } = useProjects();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedProjects, setCachedProjects] = useState<any[]>([]);
  
  const form = useForm<SelectProjectFormData>({
    resolver: zodResolver(selectProjectSchema),
    defaultValues: {
      project_id: '',
    },
  });

  // Network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cache projects for offline use
  useEffect(() => {
    if (projects && projects.length > 0) {
      localStorage.setItem('cached_projects', JSON.stringify(projects));
      setCachedProjects(projects);
    } else {
      // Load from cache if offline
      const cached = localStorage.getItem('cached_projects');
      if (cached) {
        setCachedProjects(JSON.parse(cached));
      }
    }
  }, [projects]);

  useEffect(() => {
    if (open) {
      form.reset({ project_id: '' });
    }
  }, [open, form]);

  const onSubmit = (data: SelectProjectFormData) => {
    onSelect(data.project_id);
    onClose();
  };

  const handleSkip = () => {
    onSelect(null);
    onClose();
  };

  const displayProjects = projects || cachedProjects;
  const showOfflineIndicator = !isOnline && cachedProjects.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Výber projektu</DialogTitle>
          <DialogDescription>
            Na ktorom projekte budete dnes pracovať?
          </DialogDescription>
        </DialogHeader>

        {showOfflineIndicator && (
          <Alert className="border-yellow-500 bg-yellow-500/10">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Offline režim - zobrazujú sa uložené projekty
            </AlertDescription>
          </Alert>
        )}

        {isLoading && isOnline ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte projekt" />
                        </SelectTrigger>
                        <SelectContent>
                          {displayProjects?.map((project) => (
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleSkip}>
                  Preskočiť
                </Button>
                <Button type="submit" disabled={isLoading}>
                  Potvrdiť
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

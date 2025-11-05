import { useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  
  const form = useForm<SelectProjectFormData>({
    resolver: zodResolver(selectProjectSchema),
    defaultValues: {
      project_id: '',
    },
  });

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Výber projektu</DialogTitle>
          <DialogDescription>
            Na ktorom projekte budete dnes pracovať?
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
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

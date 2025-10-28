import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { Loader2 } from 'lucide-react';

interface SelectProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (projectId: string | null) => void;
}

export function SelectProjectDialog({ open, onClose, onSelect }: SelectProjectDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { data: projects, isLoading } = useProjects();

  const handleConfirm = () => {
    onSelect(selectedProjectId || null);
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
          <div className="py-4">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte projekt" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Preskočiť
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            Potvrdiť
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

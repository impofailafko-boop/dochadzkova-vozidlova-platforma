import { useState } from 'react';
import { useAdminProjects } from '@/hooks/useAdminProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Power } from 'lucide-react';

const Projects = () => {
  const { projects, isLoading, createProject, updateProject, toggleProjectStatus, isCreating } = useAdminProjects();
  const [open, setOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProject) {
      updateProject({ id: editingProject.id, ...formData });
    } else {
      createProject(formData);
    }

    setFormData({ name: '', description: '' });
    setEditingProject(null);
    setOpen(false);
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
    });
    setOpen(true);
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleProjectStatus({ id, isActive: !currentStatus });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projekty</h1>
          <p className="text-muted-foreground">Správa firemných projektov</p>
        </div>

        <Dialog open={open} onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setEditingProject(null);
            setFormData({ name: '', description: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nový projekt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Upraviť projekt' : 'Pridať projekt'}
              </DialogTitle>
              <DialogDescription>
                {editingProject ? 'Upravte údaje projektu' : 'Vytvorte nový projekt'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Názov projektu</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="napr. Výstavba Bratislava"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Popis (voliteľný)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Podrobnejší popis projektu..."
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? 'Ukladám...' : editingProject ? 'Uložiť zmeny' : 'Vytvoriť'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zoznam projektov</CardTitle>
          <CardDescription>Všetky evidované projekty</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Názov</TableHead>
                  <TableHead>Popis</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead className="text-right">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects && projects.length > 0 ? (
                  projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {project.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={project.is_active ? 'default' : 'secondary'}>
                          {project.is_active ? 'Aktívny' : 'Neaktívny'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(project)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(project.id, project.is_active)}
                          >
                            <Power className={`h-4 w-4 ${project.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Žiadne projekty
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Projects;

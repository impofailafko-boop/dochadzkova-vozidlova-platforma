import { useState } from 'react';
import { useAdminProjects } from '@/hooks/useAdminProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Edit, Power } from 'lucide-react';

const Projects = () => {
  const { projects, isLoading, createProject, updateProject, updateProjectStatus, isCreating, isUpdating } = useAdminProjects();
  const [open, setOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planned' as 'planned' | 'active' | 'completed',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProject) {
      updateProject({ id: editingProject.id, ...formData });
    } else {
      createProject(formData);
    }

    setFormData({ name: '', description: '', status: 'planned' });
    setEditingProject(null);
    setOpen(false);
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status || 'planned',
    });
    setOpen(true);
  };

  const handleStatusChange = (id: string, newStatus: 'planned' | 'active' | 'completed') => {
    updateProjectStatus({ id, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      planned: { variant: 'secondary' as const, label: 'Naplánované' },
      active: { variant: 'default' as const, label: 'Aktívne' },
      completed: { variant: 'outline' as const, label: 'Hotové' },
    };
    return variants[status as keyof typeof variants] || variants.planned;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projekty</h1>
          <p className="text-muted-foreground">Správa firemných projektov</p>
        </div>

        <Dialog open={open} onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setEditingProject(null);
            setFormData({ name: '', description: '', status: 'planned' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nový projekt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
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
              <div className="space-y-2">
                <Label htmlFor="status">Stav projektu</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Naplánované</SelectItem>
                    <SelectItem value="active">Aktívne</SelectItem>
                    <SelectItem value="completed">Hotové</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isCreating || isUpdating} className="w-full">
                {(isCreating || isUpdating) ? 'Ukladám...' : editingProject ? 'Uložiť zmeny' : 'Vytvoriť'}
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
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Názov</TableHead>
                    <TableHead className="whitespace-nowrap">Popis</TableHead>
                    <TableHead className="whitespace-nowrap">Stav</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects && projects.length > 0 ? (
                    projects.map((project) => {
                      const statusInfo = getStatusBadge(project.status);
                      return (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium whitespace-nowrap">{project.name}</TableCell>
                          <TableCell className="max-w-md truncate whitespace-nowrap">
                            {project.description || '-'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Select 
                              value={project.status} 
                              onValueChange={(value: any) => handleStatusChange(project.id, value)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue>
                                  <Badge variant={statusInfo.variant}>
                                    {statusInfo.label}
                                  </Badge>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planned">Naplánované</SelectItem>
                                <SelectItem value="active">Aktívne</SelectItem>
                                <SelectItem value="completed">Hotové</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(project)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Žiadne projekty
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Projects;

import { useState } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { useAdminProjects } from '@/hooks/useAdminProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Employees = () => {
  const { employees, isLoading, createEmployee, deleteEmployee, updateEmployeeType, updateEmployeeRole, isCreating } = useEmployees();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployee(formData);
    setFormData({ email: '', password: '', full_name: '', phone: '' });
    setOpen(false);
  };

  const handleTypeChange = (userId: string, employmentType: string) => {
    updateEmployeeType({ userId, employmentType: employmentType as 'zivnost' | 'dohoda' });
  };

  const handleRoleChange = (userId: string, role: string) => {
    updateEmployeeRole({ userId, role: role as 'admin' | 'employee' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Zamestnanci</h1>
          <p className="text-muted-foreground">Správa používateľských účtov</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nový zamestnanec
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pridať zamestnanca</DialogTitle>
              <DialogDescription>
                Vytvorte nový používateľský účet
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Celé meno</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefón</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="+421 XXX XXX XXX"
                />
              </div>
              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? 'Vytváram...' : 'Vytvoriť'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zoznam zamestnancov</CardTitle>
          <CardDescription>Všetci registrovaní používatelia</CardDescription>
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
                    <TableHead className="whitespace-nowrap">Meno</TableHead>
                    <TableHead className="whitespace-nowrap">Telefón</TableHead>
                    <TableHead className="whitespace-nowrap">Typ pracovného vzťahu</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees && employees.length > 0 ? (
                    employees.map((employee: any) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium whitespace-nowrap">{employee.full_name}</TableCell>
                        <TableCell className="whitespace-nowrap">{employee.phone || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Select 
                            value={employee.employment_type || 'zivnost'} 
                            onValueChange={(value) => handleTypeChange(employee.user_id, value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Typ vzťahu" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="zivnost">Živnosť</SelectItem>
                              <SelectItem value="dohoda">Dohoda</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Odstrániť zamestnanca?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Táto akcia sa nedá vrátiť späť. Účet zamestnanca bude permanentne odstránený.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Zrušiť</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteEmployee(employee.user_id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Odstrániť
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Žiadni zamestnanci
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

export default Employees;

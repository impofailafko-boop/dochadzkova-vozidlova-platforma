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
import { Plus, Trash2, Edit } from 'lucide-react';
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
import { EditEmployeeDialog } from '@/components/admin/EditEmployeeDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Employees = () => {
  const { employees, isLoading, createEmployee, deleteEmployee, updateEmployeeType, updateEmployeeRole, updateEmployeeProfile, isCreating, isUpdatingProfile } = useEmployees();
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
  });

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setEditDialogOpen(true);
  };

  const handleSaveProfile = (userId: string, data: any) => {
    updateEmployeeProfile({ userId, ...data });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployee(formData);
    setFormData({ email: '', password: '', full_name: '', phone: '' });
    setOpen(false);
  };

  const handleTypeChange = (userId: string, employmentType: string | null) => {
    if (employmentType === 'unset') {
      updateEmployeeType({ userId, employmentType: null });
    } else {
      updateEmployeeType({ userId, employmentType: employmentType as 'zivnost' | 'dohoda_25' | 'dohoda_50' | 'tpp' | 'administrativa' | null });
    }
  };

  const handleRoleChange = (userId: string, role: string) => {
    updateEmployeeRole({ userId, role: role as 'admin' | 'employee' });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Zamestnanci</h1>
          <p className="text-muted-foreground">Správa používateľských účtov</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nový zamestnanec
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
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
                      value={employee.employment_type || 'unset'} 
                      onValueChange={(value) => handleTypeChange(employee.user_id, value === 'unset' ? null : value)}
                    >
                      <SelectTrigger className="w-[200px] bg-background">
                        <SelectValue placeholder="Vyberte typ" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="unset">Nezaznamenané</SelectItem>
                        <SelectItem value="zivnost">Živnosť</SelectItem>
                        <SelectItem value="dohoda_25">Dohoda 25%</SelectItem>
                        <SelectItem value="dohoda_50">Dohoda 50%</SelectItem>
                        <SelectItem value="tpp">TPP</SelectItem>
                        <SelectItem value="administrativa">Administratíva</SelectItem>
                      </SelectContent>
                    </Select>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                •••
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-popover z-50" align="end">
                              <DropdownMenuItem onClick={() => handleEdit(employee)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Upraviť profil
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <div className="flex items-center cursor-pointer text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Odstrániť
                                    </div>
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
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {selectedEmployee && (
        <EditEmployeeDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          employee={selectedEmployee}
          onSave={handleSaveProfile}
          isUpdating={isUpdatingProfile}
        />
      )}
    </div>
  );
};

export default Employees;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Plus, Trash2, Edit, Eye } from 'lucide-react';
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
  const navigate = useNavigate();
  const { employees, isLoading, createEmployee, deleteEmployee, updateEmployeeType, updateEmployeeRole, updateEmployeeProfile, updateEmployeePosition, updateEmployeeHourlyRate, isCreating, isUpdatingProfile } = useEmployees();
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

  const handlePositionChange = (userId: string, jobPosition: string | null) => {
    if (jobPosition === 'unset') {
      updateEmployeePosition({ userId, jobPosition: null });
    } else {
      updateEmployeePosition({ userId, jobPosition: jobPosition as 'pilcik' | 'strojnik' | 'elektrikar' | 'sofer' | 'administrativa' | null });
    }
  };

  const handleHourlyRateChange = (userId: string, value: string) => {
    const hourlyRate = value === '' ? null : parseFloat(value);
    updateEmployeeHourlyRate({ userId, hourlyRate });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Zamestnanci</h1>
          <p className="text-muted-foreground">Správa používateľských účtov</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
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
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="min-w-[1200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Meno</TableHead>
                    <TableHead className="w-[200px]">Email</TableHead>
                    <TableHead className="w-[140px]">Telefón</TableHead>
                    <TableHead className="w-[180px]">Typ vzťahu</TableHead>
                    <TableHead className="w-[160px]">Pozícia</TableHead>
                    <TableHead className="w-[140px]">Sadzba</TableHead>
                    <TableHead className="w-[100px] text-right">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees && employees.length > 0 ? (
                    employees.map((employee: any) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => navigate(`/admin/employees/${employee.user_id}`)}
                            className="text-primary hover:underline cursor-pointer text-left"
                          >
                            {employee.full_name}
                          </button>
                        </TableCell>
                        <TableCell className="text-sm">{employee.email || '-'}</TableCell>
                        <TableCell className="text-sm">{employee.phone || '-'}</TableCell>
                        <TableCell>
                          <Select 
                            value={employee.employment_type || 'unset'} 
                            onValueChange={(value) => handleTypeChange(employee.user_id, value === 'unset' ? null : value)}
                          >
                            <SelectTrigger className="h-9 bg-background">
                              <SelectValue placeholder="Typ" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              <SelectItem value="unset">-</SelectItem>
                              <SelectItem value="zivnost">Živnosť</SelectItem>
                              <SelectItem value="dohoda_25">Dohoda 25%</SelectItem>
                              <SelectItem value="dohoda_50">Dohoda 50%</SelectItem>
                              <SelectItem value="tpp">TPP</SelectItem>
                              <SelectItem value="administrativa">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={employee.job_position || 'unset'} 
                            onValueChange={(value) => handlePositionChange(employee.user_id, value === 'unset' ? null : value)}
                          >
                            <SelectTrigger className="h-9 bg-background">
                              <SelectValue placeholder="Pozícia" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              <SelectItem value="unset">-</SelectItem>
                              <SelectItem value="pilcik">Pilčík</SelectItem>
                              <SelectItem value="strojnik">Strojník</SelectItem>
                              <SelectItem value="elektrikar">Elektrikár</SelectItem>
                              <SelectItem value="sofer">Šofér</SelectItem>
                              <SelectItem value="administrativa">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="999.99"
                              placeholder="0.00"
                              value={employee.hourly_rate || ''}
                              onChange={(e) => handleHourlyRateChange(employee.user_id, e.target.value)}
                              onBlur={(e) => {
                                if (e.target.value !== '') {
                                  const value = parseFloat(e.target.value);
                                  if (!isNaN(value)) {
                                    e.target.value = value.toFixed(2);
                                  }
                                }
                              }}
                              className="h-9 w-[85px]"
                            />
                            <span className="text-xs text-muted-foreground">€/h</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                •••
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/employees/${employee.user_id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Skontrolovať
                              </DropdownMenuItem>
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
                      <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                        Žiadni zamestnanci
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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

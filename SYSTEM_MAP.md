# SYSTEM MAP - Architektúra a Flow

*Single Source of Truth pre to AKO aplikácia funguje*

---

## 🗺️ ROUTING ŠTRUKTÚRA

### Public Routes
```
/ (redirect)         → /auth
/auth                → Login/Signup page
```

### Employee Routes (role: "employee")
```
/dashboard           → Employee Dashboard (AttendanceButton + 3 quick action linky)
/attendance          → Dochádzka (AttendanceButton + tabuľka histórie 30 dní)
/vehicle-use         → Pridanie jazdy (formulár: vozidlo, projekt, dátum, km start/end)
/fueling             → Pridanie tankovania (formulár: vozidlo, dátum, litre, cena, poznámka)
/history             → História všetkého (3 taby: Dochádzka, Jazdy, Tankovania - každý 30 záznamov)
```

### Admin Routes (role: "admin")
```
/admin                          → Admin Dashboard (4 štatistiky karty)
/admin/employees                → CRUD zamestnancov (tabuľka + create/delete dialogy + aktuálny projekt dropdown)
/admin/vehicles                 → CRUD vozidiel (tabuľka + create/edit dialog + toggle status)
/admin/projects                 → CRUD projektov (tabuľka + create/edit dialog + 3 stavy: Naplánované/Aktívne/Hotové)
/admin/attendance-overview      → Prehľad dochádzky (filtre: dátum, zamestnanec) + tabuľka + CSV export
/admin/drives-overview          → Prehľad jázd (filtre: dátum, zamestnanec, vozidlo, projekt) + štatistiky + CSV export
/admin/fuelings-overview        → Prehľad tankovaní (filtre: dátum, zamestnanec, vozidlo) + štatistiky + CSV export
/admin/reports                  → Komplexné reporty (4 štatistiky karty + sumár + CSV export všetkého)
```

---

## 🧩 KOMPONENTY ŠTRUKTÚRA

### Layouts
- `AdminLayout` - Wrapper pre admin stránky (AdminSidebar + Navbar + Outlet)
- `EmployeeLayout` - Wrapper pre employee stránky (EmployeeSidebar + Navbar + Outlet)

### Common Components
- `Navbar` - Top navigation bar s logout buttonom
- `ProtectedRoute` - Wrapper ktorý vyžaduje prihlásenie
- `RoleGuard` - Wrapper ktorý kontroluje rolu (`allowedRole` prop)

### Admin Components
- `AdminSidebar` - Sidebar navigácia pre admina

### Employee Components
- `EmployeeSidebar` - Sidebar navigácia pre employeea
- `AttendanceButton` - Widget na check-in/check-out (používa sa v Dashboard + Attendance page)

### UI Components (shadcn/ui)
- Button, Card, Input, Label, Dialog, Table, Skeleton, Tabs, atď.
- `Sidebar` (shadcn) - Collapsible sidebar system

---

## 🎣 HOOKY A ICH POUŽITIE

### Auth & User Management
| Hook | Kde sa používa | Čo robí | Cache Key |
|------|----------------|---------|-----------|
| `useAuth` | Všade kde treba user/role | Context pre auth state, signIn/signUp/signOut | - |
| `useEmployees` | `/admin/employees` | Fetch/create/delete employeea + update current_project | `['employees']` |

### Dochádzka (Attendance)
| Hook | Kde sa používa | Čo robí | Cache Key |
|------|----------------|---------|-----------|
| `useAttendance` | `/attendance`, `Dashboard` | Fetch dnešnej dochádzky + história, recordArrival/Departure | `['attendance', 'today', userId]` |
| `useAdminAttendance` | `/admin/attendance-overview` | Fetch dochádzky všetkých (s filtrami) | `['admin-attendance', filters]` |

### Vozidlá
| Hook | Kde sa používa | Čo robí | Cache Key |
|------|----------------|---------|-----------|
| `useVehicles` | Employee stránky | Fetch aktívnych vozidiel | `['vehicles']` |
| `useAdminVehicles` | `/admin/vehicles` | CRUD vozidiel | `['admin-vehicles']` |
| `useVehicleLogs` | `/vehicle-use`, `/history` | Create/fetch záznamov jázd | `['vehicle-logs', userId]` |
| `useAdminDrives` | `/admin/drives-overview` | Fetch jázd všetkých (s filtrami) | `['admin-drives', filters]` |

### Tankovanie
| Hook | Kde sa používa | Čo robí | Cache Key |
|------|----------------|---------|-----------|
| `useFuelLogs` | `/fueling`, `/history` | Create/fetch záznamov tankovania | `['fuel-logs', userId]` |
| `useAdminFuelings` | `/admin/fuelings-overview` | Fetch tankovaní všetkých (s filtrami) | `['admin-fuelings', filters]` |

### Projekty
| Hook | Kde sa používa | Čo robí | Cache Key |
|------|----------------|---------|-----------|
| `useProjects` | `/vehicle-use` (select projekt) | Fetch projektov so statusom 'active' | `['projects']` |
| `useAdminProjects` | `/admin/projects` | CRUD projektov + update status (planned/active/completed) | `['admin-projects']` |

---

## 🔐 AUTH FLOW

### 1. Registrácia (Signup)
```
User zadá email + password + full_name
  ↓
supabase.auth.signUp({ email, password, options: { data: { full_name } } })
  ↓
Supabase vytvorí user v auth.users
  ↓
TRIGGER: handle_new_user() sa spustí
  ↓
Vytvorí sa záznam v profiles (user_id, full_name)
  ↓
Vytvorí sa záznam v user_roles (user_id, role: 'employee')
  ↓
Toast: "Účet vytvorený! Prosím, prihláste sa."
```

### 2. Prihlásenie (Login)
```
User zadá email + password
  ↓
supabase.auth.signInWithPassword({ email, password })
  ↓
onAuthStateChange event: SIGNED_IN
  ↓
AuthContext: setSession(session), setUser(user)
  ↓
fetchUserRole(user.id) z user_roles tabuľky
  ↓
setRole('admin' | 'employee')
  ↓
Redirect:
  - Ak admin → navigate('/admin')
  - Ak employee → navigate('/dashboard')
```

### 3. Session Persistence
```
App Load
  ↓
useEffect v AuthContext
  ↓
supabase.auth.onAuthStateChange() (listener)
  ↓
supabase.auth.getSession() (check existing)
  ↓
Ak session existuje:
  - fetchUserRole()
  - setLoading(false)
Ak nie:
  - setLoading(false)
```

### 4. Logout
```
User klikne Logout v Navbar
  ↓
AuthContext.signOut()
  ↓
supabase.auth.signOut()
  ↓
setUser(null), setSession(null), setRole(null)
  ↓
navigate('/auth')
```

---

## 🔒 ROLE SYSTEM & PERMISSIONS

### Role Typy
- **`admin`** - Plný prístup, môže:
  - Vytvárať/mazať employeea
  - CRUD vozidlá, projekty
  - Vidieť všetky dochádzky, jazdy, tankovania
  - Generovať reporty
  
- **`employee`** - Obmedzený prístup, môže:
  - Zaznamenaváť svoju dochádzku
  - Pridávať svoje jazdy a tankovania
  - Vidieť len svoju históriu

### Security Definer Funkcia
```sql
has_role(_user_id uuid, _role app_role) RETURNS boolean
```
- Používa sa v RLS policies
- Kontroluje či user má danú rolu v `user_roles` tabuľke
- SECURITY DEFINER = beží s elevated privileges (obchádza RLS rekurziu)

### RLS Pattern
Každá tabuľka má podobné policies:
```sql
-- Employees môžu vidieť len svoje
SELECT: auth.uid() = user_id

-- Employees môžu vkladať len svoje
INSERT: auth.uid() = user_id

-- Employees môžu updatovať len svoje
UPDATE: auth.uid() = user_id

-- Admin môže všetko
ALL: has_role(auth.uid(), 'admin')
```

---

## 📊 DATA FLOWS

### Dochádzka (Attendance) Flow
```
1. Employee Dashboard → AttendanceButton widget
   ↓
2. Klik na "Zaznamenať príchod"
   ↓
3. useAttendance.recordArrival()
   ↓
4. supabase.insert('attendance', {
      user_id: userId,
      date: today,
      arrival_time: now
   })
   ↓
5. RLS policy: CHECK auth.uid() = user_id ✅
   ↓
6. Success → invalidate cache ['attendance']
   ↓
7. Toast: "Príchod zaznamenaný"
   ↓
8. UI sa updatne → zobrazí tlačidlo "Zaznamenať odchod"

---

9. Klik na "Zaznamenať odchod"
   ↓
10. useAttendance.recordDeparture()
   ↓
11. Vypočíta total_hours (departure_time - arrival_time)
   ↓
12. supabase.update('attendance', {
       departure_time: now,
       total_hours: calculated
    }).eq('id', todayAttendance.id)
   ↓
13. RLS policy: USING auth.uid() = user_id ✅
   ↓
14. Success → invalidate cache
   ↓
15. Toast: "Odchod zaznamenaný"
```

### Pridanie Jazdy (Vehicle Use) Flow - FÁZA 2 WORKFLOW

**A) Začatie Jazdy:**
```
1. Employee → /vehicle-use
   ↓
2. Formulár: Vyberie vozidlo, projekt, dátum, km_start
   ↓
3. Vyberie fotku tachometra (POVINNÁ)
   ↓
4. Submit → uploadVehiclePhoto(file, userId)
   ↓
5. Supabase Storage: upload do bucket 'vehicle-photos'
   Path: ${userId}/${timestamp}_${fileName}
   RLS: CHECK auth.uid() = ${userId} ✅
   ↓
6. Získa publicUrl fotky
   ↓
7. useVehicleLogs.createLog({
      vehicle_id,
      project_id,
      date,
      km_start,
      photo_km_start: publicUrl,
      is_completed: false,  // KĽÚČOVÉ!
      km_end: null,         // Vyplní sa neskôr
      km_driven: null       // Vypočíta sa neskôr
   })
   ↓
8. supabase.insert('vehicle_logs', { ...input, user_id })
   ↓
9. RLS: CHECK auth.uid() = user_id ✅
   ↓
10. Success → invalidate ['vehicle-logs']
    ↓
11. Toast: "Jazda začatá"
```

**B) Ukončenie Jazdy:**
```
1. Employee → /history → Tab "Jazdy"
   ↓
2. Vidí jazdy so statusom "Prebieha" (červený badge)
   ↓
3. Klik na tlačidlo "Ukončiť jazdu"
   ↓
4. CompleteDriveDialog sa otvorí
   ↓
5. Formulár: km_end (required), fotka (optional)
   ↓
6. Validácia: km_end > km_start (client-side Zod)
   ↓
7. Ak fotka existuje → uploadVehiclePhoto(file, userId)
   ↓
8. useVehicleLogs.completeLog({
      id: driveId,
      km_end,
      photo_km_end: photoUrl | null,
      is_completed: true,
      km_driven: km_end - km_start  // Vypočítané
   })
   ↓
9. supabase.update('vehicle_logs', { ...input })
      .eq('id', id)
      .eq('user_id', userId)  // Extra security
   ↓
10. RLS: USING auth.uid() = user_id ✅
    ↓
11. TRIGGER: trigger_update_vehicle_km sa spustí
    ↓
12. UPDATE vehicles SET current_km = km_end WHERE id = vehicle_id
    ↓
13. Success → invalidate ['vehicle-logs']
    ↓
14. Toast: "Jazda ukončená. Aktuálny stav vozidla: {km_end} km"
```

### Admin Vytvorenie Employeea
```
1. Admin → /admin/employees → "Nový zamestnanec"
   ↓
2. Dialog s formulárom (email, password, full_name, phone)
   ↓
3. useEmployees.createEmployee({ email, password, full_name, phone })
   ↓
4. supabase.auth.signUp({ email, password, options: { data: { full_name } } })
   ↓
5. Trigger: handle_new_user() vytvorí profile + user_roles
   ↓
6. Ak phone existuje → update profiles.phone
   ↓
7. Success → invalidate ['employees']
   ↓
8. Toast: "Zamestnanec vytvorený"
```

---

## 🎨 UI PATTERNS

### Loading States
- `isLoading` z useQuery → Skeleton komponenty
- `isPending` z useMutation → Disabled button + "Loading..." text

### Error Handling
- Supabase error → `toast.error(error.message)`
- Neexistujúce dáta → Empty state v table

### Forms
- Riadené formuláre (controlled inputs s `value` + `onChange`)
- Submit → preventDefault → mutácia → reset form

### Dialogs
- shadcn Dialog pre create/edit akcie
- AlertDialog pre delete confirmations

### Tables
- shadcn Table komponent
- Empty state: "Žiadne záznamy"
- Akcie: Edit (Dialog), Delete (AlertDialog)

---

## 🚀 STATE MANAGEMENT

### React Query (TanStack Query)
- **Všetky server state** cez useQuery/useMutation
- Cache invalidation pattern:
  ```typescript
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] });
  }
  ```

### React Context
- **Auth state** - AuthContext (user, session, role, loading)
- Žiadny iný global state (všetko cez React Query)

### Local State
- Formuláre: `useState` pre form fields
- UI state: `useState` pre dialogs, tabs, atď.

---

## 📦 DEPENDENCIES

### Core
- React 18 + TypeScript
- Vite (build tool)
- React Router v6

### Backend
- @supabase/supabase-js (Lovable Cloud)
- @tanstack/react-query (data fetching)

### UI
- shadcn/ui komponenty (Radix UI primitives)
- Tailwind CSS (utility-first styling)
- lucide-react (icons)
- sonner (toast notifications)

### Forms & Validation
- react-hook-form
- zod (validation - nie je zatiaľ použitý!)

---

## 🔧 BUSINESS PRAVIDLÁ

### Dochádzka
1. **Jeden check-in za deň** - User môže mať len 1 attendance záznam pre daný date
2. **Arrival pred departure** - Nemožno zaznamenať departure bez arrival
3. **Total hours calculation** - Automaticky počíta (departure_time - arrival_time)

### Jazdy (Vehicle Logs)
1. **km_end > km_start** - Konečný stav musí byť vyšší ako začiatočný (✅ CLIENT-SIDE Zod validácia)
2. **Len aktívne vozidlá** - Môžu sa používať len is_active = true vozidlá
3. **Len aktívne projekty** - Jazda musí byť priradená k projektom so statusom 'active'
4. **✅ FÁZA 2:** Fotka km_start je POVINNÁ pri začatí jazdy
5. **✅ FÁZA 2:** Fotka km_end je VOLITEĽNÁ pri ukončení jazdy
6. **✅ FÁZA 2:** Jazda môže byť v stave "Prebieha" (is_completed = false, km_end = null)
7. **✅ FÁZA 2:** Automatický update vehicles.current_km len pri ukončení jazdy (trigger)

### Tankovanie (Fuel Logs)
1. **liters > 0** - Musí byť kladné číslo (CHÝBA VALIDÁCIA!)
2. **price >= 0** - Cena nesmie byť záporná (CHÝBA VALIDÁCIA!)
3. **Len aktívne vozidlá** - Tankovať sa môžu len is_active = true vozidlá

### Zamestnanci (Profiles)
1. **Unique email** - Email je primary key v auth.users
2. **Default role: employee** - Každý nový user dostane employee rolu
3. **Admin nemožno vymazať** - CHÝBA ochrana (by sa malo checknúť pred deletom)

---

## 🛠️ TECH PATTERNS & BEST PRACTICES

### React Query Pattern
```typescript
// useQuery - data fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['key', dependencies],
  queryFn: async () => { /* fetch logic */ },
  enabled: !!dependency, // conditional fetching
});

// useMutation - create/update/delete
const mutation = useMutation({
  mutationFn: async (input) => { /* mutation logic */ },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] });
    toast.success('Success message');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

### Supabase Query Pattern
```typescript
// Basic select
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('user_id', userId);

// Select s join
const { data, error } = await supabase
  .from('vehicle_logs')
  .select(`
    *,
    vehicles (spz, brand),
    projects (name)
  `)
  .eq('user_id', userId);

// Insert
const { error } = await supabase
  .from('table')
  .insert({ ...data, user_id: userId });

// Update
const { error } = await supabase
  .from('table')
  .update({ field: value })
  .eq('id', id);
```

### Auth Context Pattern
```typescript
// Setup listener FIRST
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Defer async calls with setTimeout(0)
      if (session?.user) {
        setTimeout(async () => {
          const role = await fetchUserRole(session.user.id);
          setRole(role);
        }, 0);
      }
    }
  );

  // THEN check existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    // ...
  });

  return () => subscription.unsubscribe();
}, []);
```

---

## 📄 FILE ŠTRUKTÚRA

```
src/
├── components/
│   ├── admin/
│   │   └── AdminSidebar.tsx
│   ├── common/
│   │   ├── Navbar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleGuard.tsx
│   ├── employee/
│   │   ├── AttendanceButton.tsx
│   │   └── EmployeeSidebar.tsx
│   ├── layouts/
│   │   ├── AdminLayout.tsx
│   │   └── EmployeeLayout.tsx
│   └── ui/ (shadcn komponenty)
│
├── contexts/
│   └── AuthContext.tsx
│
├── hooks/
│   ├── useAuth.ts (re-export z AuthContext)
│   ├── useAttendance.ts (employee attendance)
│   ├── useAdminAttendance.ts (admin view)
│   ├── useVehicles.ts (employee view)
│   ├── useAdminVehicles.ts (admin CRUD)
│   ├── useVehicleLogs.ts (employee)
│   ├── useAdminDrives.ts (admin view)
│   ├── useFuelLogs.ts (employee)
│   ├── useAdminFuelings.ts (admin view)
│   ├── useProjects.ts (employee view)
│   ├── useAdminProjects.ts (admin CRUD)
│   └── useEmployees.ts (admin CRUD)
│
├── integrations/supabase/
│   ├── client.ts (auto-generated)
│   └── types.ts (auto-generated)
│
├── pages/
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── Employees.tsx
│   │   ├── Vehicles.tsx
│   │   ├── Projects.tsx
│   │   ├── AttendanceOverview.tsx
│   │   ├── DrivesOverview.tsx
│   │   ├── FuelingsOverview.tsx
│   │   └── Reports.tsx
│   ├── employee/
│   │   ├── Dashboard.tsx
│   │   ├── Attendance.tsx
│   │   ├── VehicleUse.tsx
│   │   ├── Fueling.tsx
│   │   └── History.tsx
│   ├── Auth.tsx
│   └── NotFound.tsx
│
├── lib/
│   └── utils.ts (cn() helper)
│
├── App.tsx (routing)
├── main.tsx (entry point)
└── index.css (Tailwind + design tokens)
```

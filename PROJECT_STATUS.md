# PROJECT STATUS - Živý stav aplikácie

*Posledná aktualizácia: 2025-01-20*

---

## ✅ HOTOVÉ FEATURES

### Autentifikácia & Používatelia
- [x] **Login/Signup flow** - Email + heslo autentifikácia
- [x] **Role systém** - Admin vs Employee (separátne tabuľka `user_roles`)
- [x] **Auto-redirect** - Po prihlásení presmerovanie podľa role
- [x] **Protected routes** - Ochrana admin/employee route pomocou ProtectedRoute + RoleGuard
- [x] **Session management** - Správna implementácia s `session` objektom (nie len `user`)

### Admin Funkcie
- [x] **Admin Dashboard** - Štatistiky (počet zamestnancov, vozidiel, projektov, dnešná dochádzka)
- [x] **Employees Management** - Pridávanie/mazanie zamestnancov cez UI
- [x] **Vehicles (čiastočné)** - Základná stránka existuje (stále treba dokončiť)
- [x] **Projects (čiastočné)** - Základná stránka existuje (stále treba dokončiť)
- [x] **AttendanceOverview stránka** - Existuje v routingu (obsah nezistený)
- [x] **DrivesOverview stránka** - Existuje v routingu (obsah nezistený)
- [x] **FuelingsOverview stránka** - Existuje v routingu (obsah nezistený)
- [x] **Reports stránka** - Existuje v routingu (obsah nezistený)

### Employee Funkce
- [x] **Employee Dashboard** - AttendanceButton widget + rýchle linky
- [x] **Attendance check-in/check-out** - Zaznamenávanie príchodu a odchodu
- [x] **Attendance history** - Posledných 30 dní (v `/attendance` stránke)
- [x] **VehicleUse stránka** - Existuje v routingu (obsah nezistený)
- [x] **Fueling stránka** - Existuje v routingu (obsah nezistený)
- [x] **History stránka** - Existuje v routingu (obsah nezistený)

### Databáza
- [x] **Tabuľky vytvorené** - attendance, fuel_logs, profiles, projects, user_roles, vehicle_logs, vehicles
- [x] **RLS policies** - Všetky tabuľky majú základné RLS (users own + admin all)
- [x] **has_role() funkcia** - Security definer funkcia pre kontrolu rolí
- [x] **Auto-create profile** - Trigger `handle_new_user()` po registrácii

### UI/UX
- [x] **Sidebar navigácia** - AdminSidebar + EmployeeSidebar (shadcn/ui sidebar)
- [x] **Navbar** - Top navigation s logout tlačidlom
- [x] **Responsive design** - Základná responsivita implementovaná
- [x] **Toast notifikácie** - Sonner pre user feedback

---

## ⏳ ROZROBENÉ / ČIASTOČNE HOTOVÉ

### Admin Stránky
- [ ] **Vehicles page** - Stránka existuje ale nepoznáme obsah (pravdepodobne treba CRUD pre vozidlá)
- [ ] **Projects page** - Stránka existuje ale nepoznáme obsah (pravdepodobne treba CRUD pre projekty)
- [ ] **AttendanceOverview** - Nepoznáme obsah (pravdepodobne tabuľka všetkých dochádzok)
- [ ] **DrivesOverview** - Nepoznáme obsah (pravdepodobne tabuľka všetkých jázd)
- [ ] **FuelingsOverview** - Nepoznáme obsah (pravdepodobne tabuľka všetkých tankovaní)
- [ ] **Reports** - Nepoznáme obsah (pravdepodobne grafy a štatistiky)

### Employee Stránky
- [ ] **VehicleUse page** - Stránka existuje ale nepoznáme obsah (pravdepodobne formulár na pridanie jazdy)
- [ ] **Fueling page** - Stránka existuje ale nepoznáme obsah (pravdepodobne formulár na pridanie tankovania)
- [ ] **History page** - Stránka existuje ale nepoznáme obsah (pravdepodobne kompletná história)

---

## ❌ CHÝBA / NEFUNGUJE

### Validácie & Business Pravidlá
- [ ] **Viacnásobný check-in** - CHÝBA ochrana proti viacnásobným check-inom v ten istý deň
- [ ] **Validácia kilometrov** - CHÝBA kontrola že `km_end > km_start` pri záznamoch jázd
- [ ] **Validácia tankovania** - CHÝBA kontrola že `liters > 0` a `price >= 0`
- [ ] **Input validácie** - CHÝBA Zod schéma validácia pre formuláre
- [ ] **Obmedzenie času dochádzky** - CHÝBA pravidlo pre max hodiny/deň

### Features
- [ ] **Employee profile editing** - Zamestnanec nemôže upraviť svoj profil (telefón, meno)
- [ ] **Admin role assignment** - Nie je možné zmeniť rolu používateľa (len default employee)
- [ ] **Vehicle current_km tracking** - `current_km` sa pravdepodobne neaktualizuje automaticky
- [ ] **Filter & search** - CHÝBA filtrovanie v admin overview stránkach
- [ ] **Pagination** - CHÝBA na veľké datasety (momentálne limit 30-100)
- [ ] **Export do Excel** - CHÝBA export dát do CSV/Excel

### Security & Error Handling
- [ ] **Error boundaries** - CHÝBA React error boundary pre graceful fails
- [ ] **Loading states** - Niektoré mutácie nemajú proper loading UI
- [ ] **Optimistic updates** - CHÝBA v niektorých mutáciách
- [ ] **Rate limiting** - CHÝBA ochrana proti spamu (napr. viacnásobné submity)

### UI/UX
- [ ] **Dark/Light mode toggle** - CHÝBA prepínač témy
- [ ] **Sidebar collapse** - Sidebar sa nedá zminimalizovať na mobile
- [ ] **Empty states** - Niektoré stránky nemajú pekné empty states
- [ ] **Confirmation dialogs** - CHÝBA pri niektorých delete akciách
- [ ] **Form reset** - Formuláre sa neresetujú po úspešnom submite

---

## 🐛 ZNÁME BUGY

1. **Dochádzka - viacnásobný check-in možný** 
   - User môže zavolať `recordArrival` viackrát v ten istý deň
   - **Fix:** Pridať DB unique constraint na `(user_id, date)` + UI disablovať tlačidlo

2. **Attendance history limit**
   - V `useAttendance` je `.limit(30)` ale v UI nie je pagination
   - **Fix:** Pridať "Load more" alebo pagination

3. **Auth redirect loop možný**
   - Ak user má session ale nemá role v DB, môže nastať loop
   - **Fix:** Pridať fallback v AuthContext ak `fetchUserRole` vráti `null`

4. **Toast duplicity**
   - Pri rýchlych klikoch sa môžu zobraziť viacnásobné toasty
   - **Fix:** Debounce button clicks alebo pridať `toast.dismiss()`

---

## 📊 DATABÁZA - AKTUÁLNY STAV

### Tabuľky
- ✅ `attendance` (7 stĺpcov, RLS ✅)
- ✅ `fuel_logs` (8 stĺpcov, RLS ✅)
- ✅ `profiles` (5 stĺpcov, RLS ✅)
- ✅ `projects` (5 stĺpcov, RLS ✅)
- ✅ `user_roles` (4 stĺpce, RLS ✅)
- ✅ `vehicle_logs` (9 stĺpcov, RLS ✅)
- ✅ `vehicles` (7 stĺpcov, RLS ✅)

### Funkcie
- ✅ `has_role(_user_id, _role)` - Security definer kontrola role
- ✅ `handle_new_user()` - Trigger na auto-vytvorenie profilu

### Chýbajúce indexy
- ⚠️ `attendance.user_id` - Neindexovaný (dotazy môžu byť pomalé)
- ⚠️ `fuel_logs.user_id` - Neindexovaný
- ⚠️ `vehicle_logs.user_id` - Neindexovaný

---

## 🎯 PRIORITY (čo urobiť ďalej)

### HIGH PRIORITY
1. **Opraviť viacnásobný check-in bug**
2. **Dokončiť admin overview stránky** (AttendanceOverview, DrivesOverview, FuelingsOverview)
3. **Dokončiť employee stránky** (VehicleUse, Fueling, History)
4. **Pridať input validácie** (Zod schémy)

### MEDIUM PRIORITY
5. **Dokončiť Vehicles CRUD** (admin page)
6. **Dokončiť Projects CRUD** (admin page)
7. **Implementovať Reports stránku** (grafy a štatistiky)
8. **Pridať DB indexy** pre performance

### LOW PRIORITY
9. **Dark/Light mode** toggle
10. **Export do Excel** funkcionalita
11. **Pagination** na veľké datasety
12. **Profile editing** pre employeea

---

## 📝 POZNÁMKY

- **Auto-confirm email** - Pravdepodobne zapnutý (production by mal mať vypnutý)
- **Supabase URL redirect** - Site URL a Redirect URLs musia byť správne nastavené
- **TypeScript** - Celý projekt je v TypeScript ✅
- **Tailwind** - Design system používa semantic tokens z `index.css`
- **React Query** - Všetky data fetching cez TanStack Query ✅

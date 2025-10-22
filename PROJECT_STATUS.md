# PROJECT STATUS - Živý stav aplikácie

*Posledná aktualizácia: 2025-01-21 - Pagination a date filtering pre Employee History*

---

## ✅ HOTOVÉ FEATURES

### Autentifikácia & Používatelia
- [x] **Login/Signup flow** - Email + heslo autentifikácia
- [x] **Role systém** - Admin vs Employee (separátne tabuľka `user_roles`)
- [x] **Auto-redirect** - Po prihlásení presmerovanie podľa role
- [x] **Protected routes** - Ochrana admin/employee route pomocou ProtectedRoute + RoleGuard
- [x] **Session management** - Správna implementácia s `session` objektom (nie len `user`)

### Admin Funkcie (Fáza 1)
- [x] **Admin Dashboard** - Štatistiky (počet zamestnancov, vozidiel, projektov, dnešná dochádzka)
- [x] **Employees Management** - CRUD: pridávanie/mazanie zamestnancov + priradenie aktuálneho projektu (bez zmeny role v UI)
- [x] **Vehicles Management** - Plný CRUD: create, edit (SPZ, značka, model, km), toggle status
- [x] **Projects Management** - Plný CRUD: create, edit (názov, popis) + 3 stavy (Naplánované/Aktívne/Hotové)
- [x] **AttendanceOverview** - Tabuľka všetkých dochádzok s filtrami (dátum, zamestnanec) + CSV export
- [x] **FuelingsOverview** - Tabuľka tankovaní s filtrami (dátum, zamestnanec, vozidlo, projekt) + štatistiky (litre, cena) + CSV export
- [x] **Reports** - Komplexný dashboard: sumárne štatistiky (hodiny, km, náklady, spotreba) + CSV export všetkého

### Admin Funkcie (Fáza 2 - Workflow Jázd)
- [x] **DrivesOverview Enhanced** - Status badge (Prebieha/Ukončená), štatistiky počítajú len ukončené jazdy, CSV export

### Employee Funkcie (Fáza 1)
- [x] **Employee Dashboard** - AttendanceButton widget + rýchle linky na všetky funkcie
- [x] **Attendance check-in/check-out** - Zaznamenávanie príchodu a odchodu s výpočtom hodín + GPS poloha pri príchode
- [x] **GPS tracking** - Pri príchode do práce sa automaticky zaznamená GPS poloha (latitude/longitude) pomocou Geolocation API
- [x] **Attendance history** - Posledných 30 dní v `/attendance` stránke + v `/history` tabe
- [x] **Fueling** - Plný formulár: výber vozidla, dátum, litre, cena (voliteľná), projekt (voliteľný), poznámka (voliteľná)

### Employee Funkcie (Fáza 2 - Workflow Jázd s Fotkami)
- [x] **VehicleUse - Začať Jazdu** - Formulár: vozidlo, projekt, dátum, km_start + POVINNÁ fotka tachometra + GPS sledovanie polohy začiatku
- [x] **Upload Fotky** - Supabase Storage bucket `vehicle-photos` s RLS políciami
- [x] **History Tab - Prebieha/Ukončená** - Status badge pre každú jazdu, červené "Prebieha" + tlačidlo "Ukončiť"
- [x] **CompleteDriveDialog** - Dialog na ukončenie: km_end + VOLITEĽNÁ fotka konečného stavu + GPS sledovanie polohy konca
- [x] **Validácia km_end** - Client-side kontrola `km_end > km_start`
- [x] **Auto-update vehicle.current_km** - DB trigger pri ukončení jazdy
- [x] **GPS tracking pre jazdy** - Pri začatí a ukončení jazdy sa zachytáva GPS poloha (start_latitude/longitude, end_latitude/longitude)

### Databáza (Fáza 1)
- [x] **Tabuľky vytvorené** - attendance, fuel_logs, profiles, projects, user_roles, vehicle_logs, vehicles
- [x] **RLS policies** - Všetky tabuľky majú základné RLS (users own + admin all)
- [x] **has_role() funkcia** - Security definer funkcia pre kontrolu rolí
- [x] **Auto-create profile** - Trigger `handle_new_user()` po registrácii
- [x] **Project status enum** - project_status enum (planned/active/completed)
- [x] **Current project tracking** - profiles.current_project_id foreign key
- [x] **Indexy pre performance** - user_id, vehicle_id, date indexy na všetky relevantné tabuľky
- [x] **Automatic current_km update** - Trigger `trigger_update_vehicle_km` po update vehicle_logs
- [x] **GPS tracking fields** - attendance.arrival_latitude a arrival_longitude pre sledovanie polohy pri príchode

### Databáza (Fáza 2 - Storage & Workflow)
- [x] **Storage bucket** - `vehicle-photos` bucket pre fotky kilometrov
- [x] **Storage RLS** - Vlastník môže upload/view svoje fotky, admin view all
- [x] **vehicle_logs.is_completed** - Boolean flag pre rozlíšenie prebieha/ukončená
- [x] **vehicle_logs.photo_km_start** - Text pole (cesta k fotke začiatočného stavu)
- [x] **vehicle_logs.photo_km_end** - Text pole (cesta k fotke konečného stavu, nullable)
- [x] **vehicle_logs.km_end nullable** - Umožnuje vytvoriť jazdu bez km_end (doplní sa neskôr)
- [x] **vehicle_logs.km_driven nullable** - Počíta sa až pri ukončení (km_end - km_start)
- [x] **GPS tracking fields pre jazdy** - vehicle_logs.start_latitude/longitude a end_latitude/longitude pre sledovanie polohy pri začatí a ukončení jazdy

### UI/UX
- [x] **Sidebar navigácia** - AdminSidebar + EmployeeSidebar (shadcn/ui sidebar)
- [x] **Navbar** - Top navigation s logout tlačidlom + PIKOLO logo, responsive (logo menší na mobile, text skrytý na malých obrazovkách)
- [x] **Responsive design** - Plná mobilná responzivita implementovaná
- [x] **Sidebar mobile** - Na mobile sa sidebar zobrazuje ako drawer (overlay), na desktope collapsible s ikonami
- [x] **Toast notifikácie** - Sonner pre user feedback
- [x] **Branding** - PIKOLO logo (transparent background) v navbar + zelená firemná farba
- [x] **Design system** - Primárna biela, sekundárna zelená (#2d4a2d), sidebar zelený motív

---

## ⏳ ROZROBENÉ / ČIASTOČNE HOTOVÉ

**NIČ!** Všetky hlavné stránky a funkcie sú hotové.

---

## ❌ CHÝBA / NEFUNGUJE

### Validácie & Business Pravidlá
- [x] **Viacnásobný check-in** - ✅ OPRAVENÉ: DB unique constraint na `(user_id, date)`
- [x] **Validácia kilometrov** - ✅ OPRAVENÉ: Zod validácia `km_end > km_start` + pozitívne km
- [x] **Validácia tankovania** - ✅ OPRAVENÉ: Zod validácia `liters > 0` a `price >= 0`
- [x] **Input validácie** - ✅ OPRAVENÉ: Zod schémy pre VehicleUse a Fueling formuláre
- [ ] **Obmedzenie času dochádzky** - CHÝBA pravidlo pre max hodiny/deň

### Features
- [x] **Employee profile editing** - ✅ IMPLEMENTOVANÉ: Zamestnanec môže upraviť svoj profil (telefón, meno) v stránke /profile
- [ ] **Admin role assignment UI** - CHÝBA: Admin nemôže zmeniť rolu cez UI, len cez SQL alebo API (tabuľka Employees zobrazuje len Aktuálny projekt)
- [x] **Vehicle current_km tracking** - ✅ OPRAVENÉ: Automatický update cez DB trigger
- [x] **Employee deletion** - ✅ OPRAVENÉ: Admin môže mazať zamestnancov (DELETE policy pridaná)
- [ ] **Delete functionality** - Vehicles a Projects nemajú delete (len toggle status)
- [x] **Pagination for History** - ✅ IMPLEMENTOVANÉ (2025-01-21): 20 záznamov na stránku + date filtering pre všetky tabuľky
- [ ] **Charts in Reports** - Reports stránka má len číselné štatistiky, chýbajú grafy

### Security & Error Handling
- [x] **Error boundaries** - ✅ IMPLEMENTOVANÉ: React Error Boundary pre graceful fails
- [x] **Loading states** - ✅ IMPLEMENTOVANÉ (2025-01-20): Všetky mutácie majú loading UI
- [ ] **Optimistic updates** - CHÝBA v niektorých mutáciách
- [ ] **Rate limiting** - CHÝBA ochrana proti spamu (napr. viacnásobné submity)

### UI/UX
- [ ] **Dark/Light mode toggle** - CHÝBA prepínač témy
- [x] **Sidebar collapse** - ✅ IMPLEMENTOVANÉ (2025-01-21): Na mobile drawer, na desktope collapsible sidebar
- [ ] **Empty states** - Niektoré stránky nemajú pekné empty states
- [x] **Confirmation dialogs** - ✅ IMPLEMENTOVANÉ: Pri delete akciách (employees)
- [x] **Form reset** - ✅ IMPLEMENTOVANÉ (2025-01-20): Formuláre sa resetujú po úspešnom submite

---

## 🐛 ZNÁME BUGY

Všetky bugy opravené! ✅

~~1. **Dochádzka - viacnásobný check-in možný**~~ ✅ OPRAVENÉ
~~2. **Attendance history limit**~~ ✅ OPRAVENÉ - Pagination tlačidlo "Načítať ďalších 30" pridané
~~3. **Auth redirect loop možný**~~ ✅ OPRAVENÉ - Fallback na 'employee' role pridaný
~~4. **Toast duplicity**~~ ✅ OPRAVENÉ - toast.dismiss() pridaný pred mutáciami

---

## 📊 DATABÁZA - AKTUÁLNY STAV

### Tabuľky
- ✅ `attendance` (9 stĺpcov, RLS ✅) - ✅ PRIDANÉ: arrival_latitude, arrival_longitude (GPS tracking)
- ✅ `fuel_logs` (9 stĺpcov, RLS ✅) - ✅ PRIDANÉ: project_id (voliteľný)
- ✅ `profiles` (6 stĺpcov, RLS ✅) - ✅ PRIDANÉ: current_project_id
- ✅ `projects` (6 stĺpcov, RLS ✅) - ✅ PRIDANÉ: status enum (planned/active/completed)
- ✅ `user_roles` (4 stĺpce, RLS ✅)
- ✅ `vehicle_logs` (16 stĺpcov, RLS ✅) - ✅ PRIDANÉ: photo_km_start, photo_km_end, is_completed, start_latitude, start_longitude, end_latitude, end_longitude (GPS tracking)
- ✅ `vehicles` (7 stĺpcov, RLS ✅)

### Storage Buckets
- ✅ `vehicle-photos` - Fotky stavov kilometrov (RLS: vlastník upload/view, admin view all)

### Funkcie
- ✅ `has_role(_user_id, _role)` - Security definer kontrola role
- ✅ `handle_new_user()` - Trigger na auto-vytvorenie profilu

### Indexy
- ✅ `attendance.user_id`, `attendance.date` - Indexované
- ✅ `fuel_logs.user_id`, `fuel_logs.vehicle_id`, `fuel_logs.date` - Indexované
- ✅ `vehicle_logs.user_id`, `vehicle_logs.vehicle_id`, `vehicle_logs.date` - Indexované

### Triggers
- ✅ `trigger_update_vehicle_km` - Automaticky aktualizuje `vehicles.current_km` po insert/update vehicle_logs

---

## 🎯 PRIORITY (čo urobiť ďalej)

### ✅ FÁZA 1 HOTOVÁ (2025-01-20)
**Cieľ:** Základná funkcionalita + pokročilé featury (projekt status, current_project)

1. ✅ **Stavy projektov** - Implementované 3 stavy (Naplánované/Aktívne/Hotové) namiesto boolean
2. ✅ **Aktuálny projekt pre zamestnancov** - Pridaný stĺpec current_project_id + UI dropdown v admin
3. ✅ **Form reset** - Všetky formuláre sa resetujú po úspešnom uložení
4. ✅ **Loading states** - Všetky mutácie majú proper loading UI (disabled button + text)
5. ✅ **Opraviť viacnásobný check-in bug** - DB constraint + unique index implementovaný
6. ✅ **Pridať input validácie** - Zod schémy pre VehicleUse a Fueling formuláre
7. ✅ **Pridať DB indexy** - Všetky kritické indexy vytvorené (user_id, vehicle_id, date)
8. ✅ **Implementovať automatic current_km update** - Trigger `trigger_update_vehicle_km` vytvorený
9. ✅ **Employee deletion fix** - DELETE policy na profiles pridaná

### ✅ FÁZA 2 HOTOVÁ (2025-01-20)
**Cieľ:** Workflow jázd s fotkami tachometra (začať → ukončiť)

**Backend (Database & Storage):**
1. ✅ **Storage bucket vytvorený** - `vehicle-photos` s RLS políciami
2. ✅ **Schema update** - `vehicle_logs` + stĺpce: `is_completed`, `photo_km_start`, `photo_km_end`
3. ✅ **Nullable km_end** - Umožnuje vytvoriť jazdu bez konečného stavu
4. ✅ **RLS policies pre storage** - Vlastník upload/view, admin view all

**Frontend (Employee):**
5. ✅ **VehicleUse refactor** - Formulár "Začať jazdu" s km_start + POVINNÁ fotka
6. ✅ **Upload handler** - Supabase storage upload funkcia s error handlingom
7. ✅ **History tab update** - Status badge (Prebieha/Ukončená) + conditional rendering
8. ✅ **CompleteDriveDialog** - Nový dialog na ukončenie s km_end + VOLITEĽNÁ fotka
9. ✅ **Validácia** - Client-side `km_end > km_start` kontrola

**Frontend (Admin):**
10. ✅ **DrivesOverview update** - Status badge v tabuľke
11. ✅ **Statistics fix** - Štatistiky počítajú len ukončené jazdy (`is_completed = true`)
12. ✅ **CSV export update** - Export obsahuje status + foto URLs

### ✅ FÁZA 3 - HOTOVÉ featury (2025-01-20)
7. ✅ **Filter projekty v Tankovaniach** - Pridaný project_id stĺpec + filter v Admin FuelingsOverview + voliteľný select v Employee Fueling formulári
8. ✅ **Projekty v History** - Projekty sa zobrazujú v `/history` → tab "Jazdy" aj "Tankovania" (stĺpec "Projekt" + JOIN v useVehicleLogs a useFuelLogs)
9. ✅ **Admin sekcie upravené**:
   - **Zamestnanci** - Odstránený "Rola" stĺpec, zostal len "Aktuálny projekt" dropdown (role sa naďalej spravujú cez backend)
   - **Projekty** - Stav zmenený na 3 možnosti: "Naplánované" / "Aktívne" / "Hotové" (namiesto planned/active/completed enum)
10. ✅ **Evidencia vozidiel - workflow s fotkami (body 10-12)**:
   - **Bod 11:** `/vehicle-use` obsahuje pole na fotku km_start (voliteľná) → upload do storage `vehicle-photos`
   - **Bod 10:** km_end pole je SKRYTÉ pri začatí jazdy, zobrazí sa len po ukončení v `/history`
   - **Bod 12:** `/history` → Tab "Jazdy" → tlačidlo "Ukončiť jazdu" otvorí dialog s km_end (povinné) + fotka km_end (voliteľná) + real-time výpočet km_driven
11. ✅ **Dizajn update (bod 2)** - Farby prispôsobené Pikolo dizajnu:
   - Nahradené sivé tóny (gray/slate) zelenými v celom design systéme
   - `index.css` - všetky HSL farby používajú zelené tóny (hue 150°)
   - Light mode: zelené cards, borders, muted, sidebar backgrounds
   - Dark mode: tmavo-zelené pozadie a komponenty
   - Konzistentná zelená farebná schéma naprieč celou aplikáciou
12. ✅ **Foto účtenky pri tankovaní (bod 5)** - Pridané pole `photo_receipt` do `fuel_logs` tabuľky + upload v Employee Fueling formulári (voliteľné)

### ✅ FÁZA 4 - Mobilná responzivita (2025-01-21)
13. ✅ **Sidebar mobile drawer** - Sidebar na mobile funguje ako overlay drawer, na desktope collapsible
14. ✅ **Navbar responsive** - Logo menšie na mobile, názov aplikácie skrytý na malých obrazovkách
15. ✅ **Sidebar variant správne** - Použitý správny `variant="sidebar"` pre correct mobile behavior

### ✅ FÁZA 5 - Pagination a filtrovanie (2025-01-21)
16. ✅ **Employee History pagination** - 20 záznamov na stránku pre všetky tri tabuľky (Dochádzka, Jazdy, Tankovania)
17. ✅ **Date filtering** - Od/Do date picker pre filtrovanie záznamov podľa dátumu
18. ✅ **Hook refactoring** - useAttendance, useVehicleLogs, useFuelLogs podporujú pagination + filtering
19. ✅ **Count tracking** - Zobrazenie "Zobrazených X z Y záznamov" pre každú tabuľku

### MEDIUM PRIORITY (Fáza 4)
12. **Dodatočný príchod (bod 4)** - Tlačidlo v `/attendance` s povinnou poznámkou prečo zabudol prísť včas
13. **Notifikácie (bod 3)** - Upozornenie ak zamestnanec nezaznamenal odchod (napr. o 18:00)
14. **CSV/Excel Export (bod 9)** - Jedno tlačidlo na export všetkých dát (dochádzka + jazdy + tankovania) s filtrami (dátumy, projekt, zamestnanec)

### LOW PRIORITY (Fáza 5+)
15. **Dashboard kalendár (bod 8)** - Kalendár v `/dashboard` alebo `/admin` s dennými reportmi (attendance + drives + fuelings) po kliknutí na deň + filter projektov
16. **Dark/Light mode** toggle
17. ~~**Profile editing** pre employeea~~ ✅ HOTOVÉ
18. **Admin role assignment UI** - Vrátiť možnosť zmeny role cez UI (Employee/Admin dropdown v tabuľke Employees)
19. **Pridať grafy do Reports** (recharts - line charts pre trends)
17. **Delete pre Vehicles/Projects** (momentálne len toggle status)
18. **Pagination** pre admin overview tabuľky (momentálne limit 100)

---

## 📝 POZNÁMKY

- **Auto-confirm email** - Pravdepodobne zapnutý (production by mal mať vypnutý)
- **Supabase URL redirect** - Site URL a Redirect URLs musia byť správne nastavené
- **TypeScript** - Celý projekt je v TypeScript ✅
- **Tailwind** - Design system používa semantic tokens z `index.css`
- **React Query** - Všetky data fetching cez TanStack Query ✅
- **Branding** - PIKOLO s.r.o. logo + zelená firemná farba (HSL: 150 30% 25%) implementované

## 🎨 DESIGN SYSTEM

### Farby (HSL)
- **Primárna**: Biela (`0 0% 100%`) - hlavná farba pozadia
- **Sekundárna**: Zelená (`150 30% 25%`) - firemná farba PIKOLO
- **Accent**: Tmavo zelená (`150 35% 35%`) - zvýraznenie
- **Sidebar**: Tmavo zelená (`150 30% 15%` dark mode) / Svetlá (`0 0% 98%` light mode)

### Assets
- **Logo**: `src/assets/pikolo-logo.png` - Transparent PNG, importované v Navbar

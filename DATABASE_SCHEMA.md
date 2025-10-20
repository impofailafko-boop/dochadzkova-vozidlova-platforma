# DATABASE SCHEMA - Kompletná Databáza

*Single Source of Truth pre databázovú štruktúru*

---

## 📊 PREHĽAD TABULIEK

| Tabuľka | Účel | RLS | Riadkov (cca) |
|---------|------|-----|---------------|
| `attendance` | Evidencia dochádzky | ✅ | Rastie denne |
| `fuel_logs` | Evidencia tankovaní | ✅ | Rastie podľa použitia |
| `profiles` | Profily používateľov | ✅ | = počet userov |
| `projects` | Zoznam projektov | ✅ | Statický |
| `user_roles` | Role používateľov | ✅ | = počet userov |
| `vehicle_logs` | Evidencia jázd | ✅ | Rastie denne |
| `vehicles` | Zoznam vozidiel | ✅ | Statický |

---

## 1️⃣ ATTENDANCE (Dochádzka)

### Stĺpce

| Stĺpec | Typ | Nullable | Default | Popis |
|--------|-----|----------|---------|-------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Foreign key na auth.users |
| `date` | date | No | - | Dátum dochádzky |
| `arrival_time` | time | Yes | - | Čas príchodu (HH:MM:SS) |
| `departure_time` | time | Yes | - | Čas odchodu (HH:MM:SS) |
| `total_hours` | numeric | Yes | - | Odpracované hodiny (decimal) |
| `created_at` | timestamptz | No | `now()` | Timestamp vytvorenia |

### Indexes
```sql
-- PRIMARY KEY index (automatický)
✅ CREATE INDEX idx_attendance_user_id ON attendance(user_id);
✅ CREATE INDEX idx_attendance_date ON attendance(date);
```

### RLS Policies

| Policy Name | Command | Using | With Check |
|-------------|---------|-------|------------|
| Users can view their own attendance | SELECT | `auth.uid() = user_id` | - |
| Users can insert their own attendance | INSERT | - | `auth.uid() = user_id` |
| Users can update their own attendance | UPDATE | `auth.uid() = user_id` | - |
| Admins can view all attendance | SELECT | `has_role(auth.uid(), 'admin')` | - |
| Admins can manage all attendance | ALL | `has_role(auth.uid(), 'admin')` | - |

### Business Pravidlá
- ✅ **CONSTRAINT:** `attendance_user_date_unique` - user môže mať len 1 záznam za deň
- ⚠️ **CHÝBA:** Check constraint `departure_time > arrival_time` (ak oba vyplnené)
- ✅ `total_hours` sa počíta v aplikačnom kóde (nie DB trigger)

### Vzťahy
- `user_id` → (implicitne) `auth.users.id` (nie je foreign key kvôli Supabase odporúčaniu)

---

## 2️⃣ FUEL_LOGS (Tankovania)

### Stĺpce

| Stĺpec | Typ | Nullable | Default | Popis |
|--------|-----|----------|---------|-------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Kto tankoval |
| `vehicle_id` | uuid | No | - | Ktoré vozidlo |
| `date` | date | No | - | Dátum tankovania |
| `liters` | numeric | No | - | Počet litrov |
| `price` | numeric | Yes | - | Celková cena |
| `note` | text | Yes | - | Poznámka |
| `created_at` | timestamptz | No | `now()` | Timestamp vytvorenia |

### Indexes
```sql
✅ CREATE INDEX idx_fuel_logs_user_id ON fuel_logs(user_id);
✅ CREATE INDEX idx_fuel_logs_vehicle_id ON fuel_logs(vehicle_id);
✅ CREATE INDEX idx_fuel_logs_date ON fuel_logs(date);
```

### RLS Policies

| Policy Name | Command | Using | With Check |
|-------------|---------|-------|------------|
| Users can view their own fuel logs | SELECT | `auth.uid() = user_id` | - |
| Users can insert their own fuel logs | INSERT | - | `auth.uid() = user_id` |
| Users can update their own fuel logs | UPDATE | `auth.uid() = user_id` | - |
| Admins can view all fuel logs | SELECT | `has_role(auth.uid(), 'admin')` | - |
| Admins can manage all fuel logs | ALL | `has_role(auth.uid(), 'admin')` | - |

### Business Pravidlá
- ✅ **CLIENT-SIDE:** Zod validácia `liters > 0` (max 500L)
- ✅ **CLIENT-SIDE:** Zod validácia `price >= 0` (max 10000€)
- ⚠️ **POZNÁMKA:** DB constraints neboli pridané (validácia len na frontend)

### Vzťahy
- `user_id` → (implicitne) `auth.users.id`
- `vehicle_id` → (nie je definovaný foreign key v schéme, ale je používaný v kóde)

---

## 3️⃣ PROFILES (Používateľské profily)

### Stĺpce

| Stĺpec | Typ | Nullable | Default | Popis |
|--------|-----|----------|---------|-------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Foreign key na auth.users (UNIQUE) |
| `full_name` | text | No | - | Celé meno používateľa |
| `phone` | text | Yes | - | Telefónne číslo |
| `current_project_id` | uuid | Yes | - | Aktuálny projekt zamestnanca |
| `created_at` | timestamptz | No | `now()` | Timestamp vytvorenia |

### Indexes
```sql
-- UNIQUE constraint na user_id (automatický index)
```

### RLS Policies

| Policy Name | Command | Using | With Check |
|-------------|---------|-------|------------|
| Users can view their own profile | SELECT | `auth.uid() = user_id` | - |
| Users can update their own profile | UPDATE | `auth.uid() = user_id` | - |
| Admins can view all profiles | SELECT | `has_role(auth.uid(), 'admin')` | - |
| Admins can insert profiles | INSERT | - | `has_role(auth.uid(), 'admin')` |
| Admins can update all profiles | UPDATE | `has_role(auth.uid(), 'admin')` | - |
| Admins can delete profiles | DELETE | `has_role(auth.uid(), 'admin')` | - |

### Business Pravidlá
- ✅ Auto-vytvorenie cez trigger `handle_new_user()` po signup
- ✅ **Admin môže DELETE** profily (policy pridaná)
- ❌ **Users nemôžu DELETE** svoj vlastný profil (správne!)
- ⚠️ Employee nemôže INSERT svoj profil (správne, admin/trigger musí)
- ✅ **IMPLEMENTOVANÉ (2025-01-20):** `current_project_id` - aktuálny projekt zamestnanca (nullable)

### Vzťahy
- `user_id` → (implicitne) `auth.users.id` (nie je foreign key v schéme)
- `current_project_id` → `projects.id` (foreign key)

---

## 4️⃣ PROJECTS (Projekty)

### Stĺpce

| Stĺpec | Typ | Nullable | Default | Popis |
|--------|-----|----------|---------|-------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | - | Názov projektu |
| `description` | text | Yes | - | Popis projektu |
| `status` | project_status | No | `'planned'` | Stav projektu (enum) |
| `is_active` | boolean | No | `true` | Aktívny/neaktívny (DEPRECATED, používa sa status) |
| `created_at` | timestamptz | No | `now()` | Timestamp vytvorenia |

### ENUM: project_status
```sql
CREATE TYPE project_status AS ENUM ('planned', 'active', 'completed');
```

### Indexes
```sql
-- ⚠️ ODPORÚČANÉ: CREATE INDEX idx_projects_status ON projects(status);
```

### RLS Policies

| Policy Name | Command | Using | With Check |
|-------------|---------|-------|------------|
| Employees can view active projects | SELECT | `status = 'active'` | - |
| Admins can manage all projects | ALL | `has_role(auth.uid(), 'admin')` | - |

### Business Pravidlá
- ✅ Employee vidí len `status = 'active'` projekty
- ✅ Admin môže meniť status projektu (planned/active/completed)
- ✅ **IMPLEMENTOVANÉ (2025-01-20):** Tri stavy namiesto boolean
- ⚠️ `is_active` stĺpec je ponechaný pre backward compatibility, ale NEPOUŽÍVA SA

### Vzťahy
- Žiadne foreign keys

---

## 5️⃣ USER_ROLES (Role používateľov)

### Stĺpce

| Stĺpec | Typ | Nullable | Default | Popis |
|--------|-----|----------|---------|-------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Foreign key na auth.users |
| `role` | app_role | No | `'employee'` | Rola (enum) |
| `created_at` | timestamptz | No | `now()` | Timestamp vytvorenia |

### ENUM: app_role
```sql
CREATE TYPE app_role AS ENUM ('admin', 'employee');
```

### Indexes
```sql
-- UNIQUE constraint na (user_id, role) - user nemôže mať duplicitnú rolu
```

### RLS Policies

| Policy Name | Command | Using | With Check |
|-------------|---------|-------|------------|
| Users can view their own role | SELECT | `auth.uid() = user_id` | - |
| Admins can view all roles | SELECT | `has_role(auth.uid(), 'admin')` | - |
| Admins can manage roles | ALL | `has_role(auth.uid(), 'admin')` | - |

### Business Pravidlá
- ✅ **KRITICKÉ:** Role sú v separátnej tabuľke (nie na profile!)
- ✅ Unique constraint `(user_id, role)` - user môže mať každú rolu max 1x
- ✅ Default rola je `'employee'`
- ⚠️ **CHÝBA UI:** Admin nemôže zmeniť rolu (iba cez SQL)

### Vzťahy
- `user_id` → (implicitne) `auth.users.id`

---

## 6️⃣ VEHICLE_LOGS (Evidencia jázd)

### Stĺpce

| Stĺpec | Typ | Nullable | Default | Popis |
|--------|-----|----------|---------|-------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Kto jazdil |
| `vehicle_id` | uuid | No | - | Ktoré vozidlo |
| `project_id` | uuid | No | - | Pre ktorý projekt |
| `date` | date | No | - | Dátum jazdy |
| `km_start` | integer | No | - | Začiatočný stav km |
| `km_end` | integer | No | - | Konečný stav km |
| `km_driven` | integer | Yes | - | Ujazdené km (vypočítané) |
| `created_at` | timestamptz | No | `now()` | Timestamp vytvorenia |

### Indexes
```sql
✅ CREATE INDEX idx_vehicle_logs_user_id ON vehicle_logs(user_id);
✅ CREATE INDEX idx_vehicle_logs_vehicle_id ON vehicle_logs(vehicle_id);
-- ⚠️ CHÝBA: CREATE INDEX idx_vehicle_logs_project_id ON vehicle_logs(project_id); (nebol pridaný)
✅ CREATE INDEX idx_vehicle_logs_date ON vehicle_logs(date);
```

### RLS Policies

| Policy Name | Command | Using | With Check |
|-------------|---------|-------|------------|
| Users can view their own vehicle logs | SELECT | `auth.uid() = user_id` | - |
| Users can insert their own vehicle logs | INSERT | - | `auth.uid() = user_id` |
| Users can update their own vehicle logs | UPDATE | `auth.uid() = user_id` | - |
| Admins can view all vehicle logs | SELECT | `has_role(auth.uid(), 'admin')` | - |
| Admins can manage all vehicle logs | ALL | `has_role(auth.uid(), 'admin')` | - |

### Business Pravidlá
- ✅ **CLIENT-SIDE:** Zod validácia `km_end > km_start` + pozitívne celé čísla
- ✅ **TRIGGER:** `trigger_update_vehicle_km` automaticky aktualizuje `vehicles.current_km`
- `km_driven` je nullable (pravdepodobne by sa malo počítať automaticky)

### Vzťahy
- `user_id` → (implicitne) `auth.users.id`
- `vehicle_id` → (nie je foreign key)
- `project_id` → (nie je foreign key)

---

## 7️⃣ VEHICLES (Vozidlá)

### Stĺpce

| Stĺpec | Typ | Nullable | Default | Popis |
|--------|-----|----------|---------|-------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `spz` | text | No | - | Štátna poznávacia značka |
| `brand` | text | No | - | Značka vozidla |
| `type` | text | No | - | Typ/model |
| `current_km` | integer | No | `0` | Aktuálny stav kilometrov |
| `is_active` | boolean | No | `true` | Aktívne/neaktívne |
| `created_at` | timestamptz | No | `now()` | Timestamp vytvorenia |

### Indexes
```sql
-- ⚠️ CHÝBA: CREATE INDEX idx_vehicles_is_active ON vehicles(is_active);
-- ⚠️ MOŽNOSŤ: CREATE UNIQUE INDEX idx_vehicles_spz ON vehicles(spz); (ak SPZ sú unikátne)
```

### RLS Policies

| Policy Name | Command | Using | With Check |
|-------------|---------|-------|------------|
| Employees can view active vehicles | SELECT | `is_active = true` | - |
| Admins can manage all vehicles | ALL | `has_role(auth.uid(), 'admin')` | - |

### Business Pravidlá
- ✅ Employee vidí len `is_active = true` vozidlá
- ✅ Admin môže deaktivovať vozidlo (toggle `is_active`)
- ✅ **TRIGGER:** Auto-update `current_km` po každej jazde implementovaný (funkcia `update_vehicle_current_km`)
- ⚠️ **CHÝBA:** Unique constraint na `spz` (ak to je požiadavka)

### Vzťahy
- Žiadne foreign keys

---

## 🔧 FUNKCIE (Functions)

### 1. `has_role(_user_id uuid, _role app_role) RETURNS boolean`

**Účel:** Bezpečná kontrola role pre RLS policies

**Kód:**
```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

**Prečo SECURITY DEFINER:**
- RLS policies by inak spôsobili rekurziu (policy → funkcia → policy → ...)
- SECURITY DEFINER beží s elevated privileges (obchádza RLS)

**Použitie:**
```sql
-- V RLS policy
CREATE POLICY "Admins can view all"
ON some_table
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
```

---

### 2. `handle_new_user() RETURNS trigger`

**Účel:** Automaticky vytvoriť profile + rolu pri signup

**Kód:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Assign default employee role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;
```

**Trigger:**
```sql
-- ⚠️ CHÝBA V SCHÉME (ale existuje v DB lebo funguje!)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Flow:**
1. User sa zaregistruje cez `supabase.auth.signUp()`
2. Supabase vytvorí záznam v `auth.users`
3. Trigger sa spustí
4. Funkcia vytvorí záznam v `profiles` a `user_roles`

---

## 🚨 CHÝBAJÚCE CONSTRAINTS & INDEXES

### ✅ Implementované (2025-01-20)
```sql
-- ✅ Dochádzka: Ochrana proti viacnásobným check-inom
ALTER TABLE attendance 
ADD CONSTRAINT attendance_user_date_unique UNIQUE (user_id, date);

-- ✅ Indexes pre performance (všetky vytvorené)
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_fuel_logs_user_id ON fuel_logs(user_id);
CREATE INDEX idx_fuel_logs_vehicle_id ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_logs_date ON fuel_logs(date);
CREATE INDEX idx_vehicle_logs_user_id ON vehicle_logs(user_id);
CREATE INDEX idx_vehicle_logs_vehicle_id ON vehicle_logs(vehicle_id);
CREATE INDEX idx_vehicle_logs_date ON vehicle_logs(date);

-- ✅ Trigger pre automatic current_km update
CREATE FUNCTION update_vehicle_current_km() ...
CREATE TRIGGER trigger_update_vehicle_km ...

-- ✅ DELETE policy pre profiles (admins)
CREATE POLICY "Admins can delete profiles" ...
```

### Nie je implementované (len client-side validácia)
```sql
-- ⚠️ Tankovania: Validácia litrov (len Zod)
-- ALTER TABLE fuel_logs 
-- ADD CONSTRAINT check_liters_positive CHECK (liters > 0);

-- ⚠️ Jazdy: Validácia km (len Zod)
-- ALTER TABLE vehicle_logs 
-- ADD CONSTRAINT check_km_end_greater CHECK (km_end > km_start);
```

### Optional (nice to have)
```sql
-- Unique SPZ
ALTER TABLE vehicles 
ADD CONSTRAINT unique_spz UNIQUE (spz);

-- Validácia ceny tankovania
ALTER TABLE fuel_logs 
ADD CONSTRAINT check_price_non_negative CHECK (price IS NULL OR price >= 0);

-- Validácia arrival < departure
ALTER TABLE attendance 
ADD CONSTRAINT check_departure_after_arrival 
CHECK (departure_time IS NULL OR arrival_time IS NULL OR departure_time > arrival_time);
```

---

## 🔗 FOREIGN KEYS (nie sú definované, ale používané)

### Prečo nie sú foreign keys?
- Supabase odporúča **nevytvárať foreign keys na `auth.users`** tabuľku
- Dôvod: `auth.users` je managed by Supabase, môže sa zmeniť
- Riešenie: Používame `user_id` ako UUID bez foreign key

### Implicitné vzťahy (používané v kóde)
```
attendance.user_id              → auth.users.id
fuel_logs.user_id               → auth.users.id
fuel_logs.vehicle_id            → vehicles.id
profiles.user_id                → auth.users.id (UNIQUE)
profiles.current_project_id     → projects.id (FK)
user_roles.user_id              → auth.users.id
vehicle_logs.user_id            → auth.users.id
vehicle_logs.vehicle_id         → vehicles.id
vehicle_logs.project_id         → projects.id
```

### Možné foreign keys (ak chceme)
```sql
-- Len pre non-auth tabuľky
ALTER TABLE fuel_logs 
ADD FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;

ALTER TABLE vehicle_logs 
ADD FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
ADD FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
```

---

## 📊 DIAGRAM VZŤAHOV

```mermaid
erDiagram
    AUTH_USERS ||--o{ PROFILES : "user_id"
    AUTH_USERS ||--o{ USER_ROLES : "user_id"
    AUTH_USERS ||--o{ ATTENDANCE : "user_id"
    AUTH_USERS ||--o{ FUEL_LOGS : "user_id"
    AUTH_USERS ||--o{ VEHICLE_LOGS : "user_id"
    
    VEHICLES ||--o{ FUEL_LOGS : "vehicle_id"
    VEHICLES ||--o{ VEHICLE_LOGS : "vehicle_id"
    
    PROJECTS ||--o{ VEHICLE_LOGS : "project_id"
    PROJECTS ||--o{ PROFILES : "current_project_id"
    
    AUTH_USERS {
        uuid id PK
        string email
        json raw_user_meta_data
    }
    
    PROFILES {
        uuid id PK
        uuid user_id UK
        text full_name
        text phone
        uuid current_project_id FK
    }
    
    USER_ROLES {
        uuid id PK
        uuid user_id
        app_role role
    }
    
    ATTENDANCE {
        uuid id PK
        uuid user_id
        date date
        time arrival_time
        time departure_time
        numeric total_hours
    }
    
    FUEL_LOGS {
        uuid id PK
        uuid user_id
        uuid vehicle_id
        date date
        numeric liters
        numeric price
        text note
    }
    
    VEHICLE_LOGS {
        uuid id PK
        uuid user_id
        uuid vehicle_id
        uuid project_id
        date date
        int km_start
        int km_end
        int km_driven
    }
    
    VEHICLES {
        uuid id PK
        text spz
        text brand
        text type
        int current_km
        bool is_active
    }
    
    PROJECTS {
        uuid id PK
        text name
        text description
        bool is_active
    }
```

---

## 🔐 RLS SUMMARY

### Pattern pre všetky tabuľky
```sql
-- Employee: Môže vidieť/upraviť len svoje
SELECT/INSERT/UPDATE: auth.uid() = user_id

-- Admin: Môže všetko
ALL: has_role(auth.uid(), 'admin')
```

### Výnimky
- **projects, vehicles:** Employee môže vidieť len `is_active = true`
- **profiles:** Employee nemôže INSERT (admin/trigger musí)
- **profiles:** Employee nemôže DELETE (nikto nemôže)

---

## 📝 POZNÁMKY

1. **Žiadne foreign keys na auth.users** - Supabase best practice
2. **SECURITY DEFINER funkcie** - Kritické pre RLS (obchádza rekurziu)
3. **Auto-increment nie je UUID** - Všetky ID sú UUID (gen_random_uuid())
4. **Soft delete pattern** - `is_active` flag namiesto DELETE
5. **Timestamps** - Všetky tabuľky majú `created_at`
6. **Chýbajú updated_at** - Žiadna tabuľka nemá `updated_at` stĺpec + trigger

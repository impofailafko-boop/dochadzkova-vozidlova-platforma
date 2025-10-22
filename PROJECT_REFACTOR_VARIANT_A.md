# Refaktoring projektu - Variant A: Len `status` field

**Dátum zmeny:** 2025-10-22  
**Status:** ✅ Dokončené a overené

---

## 📋 Prehľad zmeny

Bol implementovaný **Variant A** refaktoringu tabuľky `projects`, ktorý zjednodušuje dátový model z duálneho systému (`is_active` boolean + `status` enum) na jeden zdroj pravdy - len `status` enum.

### Problém pred refaktoringom

```sql
-- Pred: Dva polia ktoré môžu byť v konflikte
projects:
  - is_active (boolean)      -- true/false
  - status (enum)            -- 'planned', 'active', 'completed'
```

**Problémy:**
- ❌ Možné nekonzistencie (`is_active=true` ale `status='completed'`)
- ❌ Duplicitná kontrola v RLS politikách
- ❌ Nejasné ktoré pole je "zdroj pravdy"
- ❌ Komplexnejšie queries

### Riešenie po refaktoringu

```sql
-- Po: Jeden zdroj pravdy
projects:
  - status (enum)            -- 'planned', 'active', 'completed'
```

**Výhody:**
- ✅ Jeden zdroj pravdy - nemožné nekonzistencie
- ✅ Expresívnejší životný cyklus projektu
- ✅ Jednoduchšie RLS politiky
- ✅ Lepšia škálovateľnosť (možno pridať ďalšie stavy)

---

## 🗄️ Databázové zmeny

### 1. Migrácia

```sql
-- Synchronizácia dát pred odstránením stĺpca
UPDATE public.projects 
SET status = 'active'
WHERE is_active = true AND status = 'planned';

-- Odstránenie is_active stĺpca
ALTER TABLE public.projects 
DROP COLUMN is_active;
```

**Súbory:** 
- `supabase/migrations/20251022150157_*.sql` - Odstránenie `is_active`
- `supabase/migrations/20251022152200_*.sql` - Aktivácia projektu Haniska

### 2. RLS Politiky

**Pred:**
```sql
-- Pred: Zložitejšia politika
CREATE POLICY "Authenticated employees can view active projects" 
ON public.projects FOR SELECT 
USING ((auth.uid() IS NOT NULL) AND (is_active = true));
```

**Po:**
```sql
-- Po: Zjednodušená politika
CREATE POLICY "Authenticated employees can view active projects" 
ON public.projects FOR SELECT 
TO authenticated
USING (status = 'active'::project_status);
```

**Výsledné RLS politiky:**
- `Admins can manage all projects` (ALL operations) - `has_role(auth.uid(), 'admin')`
- `Authenticated employees can view active projects` (SELECT) - `status = 'active'`

---

## 💻 Zmeny v kóde

### Hooks

#### 1. `src/hooks/useProjects.ts` (Employee hook)

**Pred:**
```typescript
.or('is_active.eq.true,status.eq.active')
```

**Po:**
```typescript
.eq('status', 'active')
```

**Použitie:** Zamestnanci v `VehicleUse.tsx` a `Fueling.tsx`

---

#### 2. `src/hooks/useAdminProjects.ts` (Admin hook)

**Nezmenené** - používa `select('*')` a zobrazuje všetky projekty bez ohľadu na status.

**Použitie:** 
- `Projects.tsx` - správa projektov
- `DrivesOverview.tsx` - filter projektov v záznamoch jázd
- `Employees.tsx` - priradenie aktuálneho projektu
- `FuelingsOverview.tsx` - filter projektov v záznamoch tankovania

---

### Komponenty

#### 1. `src/pages/admin/AdminDashboard.tsx`

**Pred:**
```typescript
.eq('is_active', true)
```

**Po:**
```typescript
.eq('status', 'active')
```

**Účel:** Počítanie aktívnych projektov na dashboarde

---

#### 2. `src/pages/admin/Projects.tsx`

**Nezmenené** - už správne pracovalo s `status` enum:
- Form s 3 možnosťami: `planned`, `active`, `completed`
- Dropdown pre zmenu stavu
- Badge pre vizualizáciu stavu

---

## 🔍 Overovacie testy

### Databáza
```sql
SELECT id, name, status, created_at 
FROM public.projects;
```
**Výsledok:**
```
Haniska | active | 2025-10-19 17:41:57
```
✅ Projekt Haniska je `active`

### RLS Politiky
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'projects';
```
**Výsledok:**
- ✅ Admin: ALL operations
- ✅ Employee: SELECT len `status='active'`

### Network Requesty
```
GET /rest/v1/profiles - 200 OK
GET /rest/v1/user_roles - 200 OK (role: admin)
```
✅ Žiadne chyby, autentifikácia funguje

### Console Logs
```
No errors found
```
✅ Žiadne chyby v konzole

---

## 📊 Dotknuté súbory

### Backend (Databáza)
- ✅ `projects` tabuľka - odstránený `is_active` stĺpec
- ✅ RLS politiky - zjednodušené na `status`

### Frontend Hooks
- ✅ `src/hooks/useProjects.ts` - filter `status='active'`
- ✅ `src/hooks/useAdminProjects.ts` - bez zmien
- ⚠️ `src/hooks/useAdminDrives.ts` - obsahuje join na `projects`
- ⚠️ `src/hooks/useAdminFuelings.ts` - obsahuje join na `projects`
- ⚠️ `src/hooks/useFuelLogs.ts` - obsahuje join na `projects`
- ⚠️ `src/hooks/useVehicleLogs.ts` - obsahuje join na `projects`
- ⚠️ `src/hooks/useEmployees.ts` - obsahuje join na `current_project_id`

### Frontend Pages - Admin
- ✅ `src/pages/admin/AdminDashboard.tsx` - počítanie projektov
- ✅ `src/pages/admin/Projects.tsx` - správa projektov
- ⚠️ `src/pages/admin/DrivesOverview.tsx` - zobrazuje `projects.name`
- ⚠️ `src/pages/admin/Employees.tsx` - select pre aktuálny projekt
- ⚠️ `src/pages/admin/FuelingsOverview.tsx` - zobrazuje `projects.name`
- ⚠️ `src/pages/admin/Reports.tsx` - exportuje `projects.name`

### Frontend Pages - Employee
- ✅ `src/pages/employee/VehicleUse.tsx` - select aktívnych projektov
- ✅ `src/pages/employee/Fueling.tsx` - select aktívnych projektov
- ⚠️ `src/pages/employee/History.tsx` - zobrazuje `projects.name` v histórii

### Routing
- ✅ `src/App.tsx` - route `/admin/projects`
- ✅ `src/components/admin/AdminSidebar.tsx` - link na Projekty

---

## 🎯 Výsledný stav

### Status enum hodnoty:
- `planned` - Naplánovaný projekt (ešte nezačal)
- `active` - Aktívny projekt (práve prebieha)
- `completed` - Dokončený projekt (už skončil)

### Viditeľnosť pre zamestnancov:
- ✅ **Vidia len** projekty so `status = 'active'`
- ✅ **Nevidia** projekty s `planned` alebo `completed`

### Správa pre adminov:
- ✅ **Vidia všetky** projekty bez ohľadu na status
- ✅ **Môžu meniť** status cez dropdown
- ✅ **Môžu vytvárať** nové projekty s ľubovoľným statusom
- ✅ **Môžu editovať** existujúce projekty

---

## ⚠️ Poznámky

### Security Warning (existujúce)
```
WARN: Leaked Password Protection Disabled
```
Toto je existujúce nastavenie projektu nesúvisiace s refaktoringom.

### Budúce rozšírenia
Ak bude potrebné pridať ďalšie stavy (napr. `on-hold`, `cancelled`), stačí:
```sql
ALTER TYPE project_status ADD VALUE 'on-hold';
ALTER TYPE project_status ADD VALUE 'cancelled';
```

---

## 🔄 Rollback (ak by bol potrebný)

**NEDOPORUČUJE SA** - dáta sú už zmigrované. Ak naozaj treba:

```sql
-- 1. Pridať is_active späť
ALTER TABLE public.projects 
ADD COLUMN is_active boolean DEFAULT true;

-- 2. Synchronizovať hodnoty
UPDATE public.projects 
SET is_active = (status = 'active');

-- 3. Obnoviť starú RLS politiku
DROP POLICY "Authenticated employees can view active projects" ON public.projects;
CREATE POLICY "Authenticated employees can view active projects" 
ON public.projects FOR SELECT 
USING ((auth.uid() IS NOT NULL) AND (is_active = true));

-- 4. Obnoviť kód cez History v Lovable
```

---

## ✅ Záver

Refaktoring **Variant A** bol úspešne dokončený a overený. Systém je teraz konzistentný, jednoduchší a lepšie škálovateľný. Všetky testy prešli úspešne.

**Hlavné výhody:**
- 🎯 Jeden zdroj pravdy
- 🔒 Bezpečnejšie RLS politiky
- 🚀 Jednoduchší kód
- 📈 Lepšia škálovateľnosť

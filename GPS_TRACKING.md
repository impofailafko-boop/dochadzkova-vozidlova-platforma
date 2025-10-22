# GPS Tracking - Dokumentácia

*Automatické sledovanie polohy pri dochádzke a jazdách*

---

## 📍 Prehľad

GPS tracking je implementovaný pre **dochádzku** (attendance) a **jazdy vozidiel** (vehicle_logs), automaticky zachytáva GPS polohu pri kľúčových udalostiach.

---

## 🎯 Funkcie

### 1. Dochádzka (Attendance)

**Kedy sa zachytáva poloha:**
- ✅ Pri **príchode do práce** (arrival)

**Databázové stĺpce:**
- `arrival_latitude` - GPS šírka pri príchode
- `arrival_longitude` - GPS dĺžka pri príchode

**Používateľské rozhranie:**
- **Employee:** Vidí link "📍 Zobraziť polohu na mape" pod časom príchodu (ak je GPS dostupné)
- **Admin:** V "Prehľad dochádzky" stĺpec "Poloha" s linkom "📍 Mapa" pre každý záznam

### 2. Jazdy vozidiel (Vehicle Logs)

**Kedy sa zachytáva poloha:**
- ✅ Pri **začatí jazdy** (start)
- ✅ Pri **ukončení jazdy** (end)

**Databázové stĺpce:**
- `start_latitude` / `start_longitude` - GPS poloha začiatku
- `end_latitude` / `end_longitude` - GPS poloha konca

**Používateľské rozhranie:**
- **Admin:** V "Prehľad jázd" stĺpec "GPS" s linkami:
  - "📍 Start" - odkiaľ zamestnanec začal jazdu
  - "📍 Koniec" - kde skončil (zobrazí sa len po ukončení jazdy)

---

## 🔧 Technická implementácia

### Geolocation API

```typescript
if ('geolocation' in navigator) {
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,  // Použiť GPS namiesto WiFi/IP
      timeout: 10000,             // Max 10 sekúnd čakanie
      maximumAge: 0               // Nevrátiť cache, vždy fresh polohu
    });
  });
  
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
}
```

### Povolenia

**Prvé použitie:**
- Prehliadač zobrazí prompt: "Povoliť tejto stránke prístup k polohe?"
- Používateľ klikne "Povoliť"

**Následné použitie:**
- GPS sa automaticky zachytí bez ďalších otázok
- Povolenie je uložené pre danú doménu

**Ak GPS nie je dostupné:**
- Záznam sa uloží **aj bez GPS polohy** (stĺpce zostanú NULL)
- Console warning: `GPS location not available`

### Zobrazenie na mape

**Google Maps link:**
```
https://www.google.com/maps?q={latitude},{longitude}
```

**Príklad:**
```
https://www.google.com/maps?q=48.1486,17.1077
```

---

## 📊 Databázová schéma

### Attendance tabuľka
```sql
ALTER TABLE public.attendance
ADD COLUMN arrival_latitude numeric,
ADD COLUMN arrival_longitude numeric;
```

### Vehicle Logs tabuľka
```sql
ALTER TABLE public.vehicle_logs
ADD COLUMN start_latitude numeric,
ADD COLUMN start_longitude numeric,
ADD COLUMN end_latitude numeric,
ADD COLUMN end_longitude numeric;
```

---

## 🔒 Bezpečnosť & Súkromie

### Súkromie
- GPS poloha sa zbiera **len pri kľúčových udalostiach** (príchod, začatie/ukončenie jazdy)
- **Nie je kontinuálne sledovanie** polohy počas pracovného dňa alebo jazdy
- Používateľ **musí explicitne povoliť** prístup k polohe v prehliadači

### Prístup k dátam
- **Employee:** Vidí len svoje GPS polohy
- **Admin:** Vidí GPS polohy všetkých zamestnancov (potrebné pre verifikáciu)

### RLS Policies
- Attendance: Employee môže INSERT/UPDATE len svoje záznamy
- Vehicle Logs: Employee môže INSERT/UPDATE len svoje jazdy
- Admin má prístup ku všetkým záznamom

---

## 🚀 Použitie

### Pre Zamestnancov

**Dochádzka:**
1. Kliknúť "Príchod do práce" v dashboarde
2. Prehliadač sa spýta na povolenie (prvý krát)
3. Po povolení sa automaticky uloží GPS poloha + čas príchodu
4. Link "📍 Zobraziť polohu na mape" sa zobrazí pod časom

**Jazdy:**
1. Kliknúť "Začať jazdu" vo VehicleUse
2. Automaticky sa zachytí GPS poloha začiatku
3. Neskôr kliknúť "Ukončiť jazdu" v History
4. Automaticky sa zachytí GPS poloha konca

### Pre Adminov

**Kontrola polohy:**
1. Otvoriť "Prehľad dochádzky" alebo "Prehľad jázd"
2. V stĺpci "Poloha" / "GPS" kliknúť na link "📍 Mapa"
3. Google Maps sa otvorí s presnou polohou

**CSV Export:**
- GPS súradnice sú súčasťou CSV exportu
- Stĺpce: `GPS Start Lat`, `GPS Start Lon`, `GPS End Lat`, `GPS End Lon`

---

## ⚠️ Limitácie

### Dostupnosť GPS
- **Mobile zariadenia:** GPS je zvyčajne veľmi presný (2-5 metrov)
- **Desktop:** Používa WiFi/IP lokalizáciu, menej presné (50-500 metrov)
- **Bez povolenia:** Ak používateľ zakáže polohu, záznamy sa uložia bez GPS

### Prehliadače
- **Chrome/Edge:** Plná podpora ✅
- **Firefox:** Plná podpora ✅
- **Safari:** Plná podpora ✅
- **IE11:** Nepodporované ❌ (ale IE11 je deprecated)

### HTTPS Required
- Geolocation API funguje **len na HTTPS** doménach
- Na `localhost` funguje aj bez HTTPS (development)

---

## 🐛 Troubleshooting

### GPS sa nezachytí
1. **Skontrolovať povolenia:** Settings → Privacy → Location (v prehliadači)
2. **Skontrolovať HTTPS:** URL musí začínať `https://`
3. **Skontrolovať konzolu:** Console warning: `GPS location not available`
4. **Timeout:** Ak GPS trvá > 10 sekúnd, automaticky sa preskočí

### Nesprávna poloha
- **Desktop:** Používa WiFi/IP, môže byť nepresné
- **Riešenie:** Použiť mobilné zariadenie s GPS

### Link na mapu nefunguje
- **Skontrolovať dáta:** SQL query či `latitude` a `longitude` nie sú NULL
- **Skontrolovať formát:** Link musí byť `https://www.google.com/maps?q=lat,lon`

---

## 📈 Budúce vylepšenia

- [ ] **Mapové zobrazenie v UI** - Vlastná mapa namiesto linku na Google Maps
- [ ] **Trasa jazdy** - Real-time tracking počas jazdy (nie len začiatok/koniec)
- [ ] **Geofencing** - Automatické check-in/check-out pri vstupe/výstupe z oblasti
- [ ] **Offline podpora** - Uložiť GPS polohu offline, synchronizovať neskôr
- [ ] **Podrobnejšie logy** - História GPS polohy pre analýzu (heatmapy, trendy)

---

## 📝 Záver

GPS tracking je teraz plne funkčný pre dochádzku aj jazdy. Automaticky zachytáva polohu pri kľúčových udalostiach, poskytuje adminom možnosť verifikácie a je implementovaný s ohľadom na súkromie používateľov.

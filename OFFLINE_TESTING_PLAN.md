# 🧪 OFFLINE Testovací Plán - PIKOLO Platforma

## Príprava na testovanie

### Prerekvizity
- [ ] Chrome/Edge DevTools (F12)
- [ ] Prihlásiť sa ako employee s platným účtom
- [ ] Mať pripravené foto súbory pre testovanie (simulácia km foto)

### Nástroje na simuláciu offline
1. **Chrome DevTools**: F12 → Network tab → Throttling → Offline
2. **IndexedDB viewer**: F12 → Application → IndexedDB → OfflineDB
3. **Service Worker**: F12 → Application → Service Workers
4. **Cache Storage**: F12 → Application → Cache Storage

---

## TEST 1️⃣: Dochádzka offline (Attendance)

### Príprava
1. ✅ Prihlásiť sa do aplikácie
2. ✅ Prejsť na `/attendance`
3. ✅ Overiť, že ste ešte nepríchod dnes (alebo použiť čistý deň)

### Krok 1: Zaznamenanie príchodu ONLINE
```
Akcia: Kliknúť "Príchod" tlačidlo
Očakávané:
  ✓ Toast: "Príchod zaznamenaný"
  ✓ Zobrazí sa čas príchodu
  ✓ GPS súradnice (ak povolené)
  ✓ Možnosť zadať projekt
```

### Krok 2: Prejsť OFFLINE
```
Akcia: DevTools → Network → Offline
Očakávané:
  ✓ Zobrazí sa "Offline režim aktívny" indikátor
  ✓ Žltý alert nahor
```

### Krok 3: Pokus o odchod OFFLINE
```
Akcia: Kliknúť "Odchod" tlačidlo
Očakávané:
  ✓ Toast: "Odchod uložený - synchronizuje sa po pripojení"
  ✓ Záznam sa NEULOŽÍ do DB hneď
  ✓ Uloží sa do IndexedDB
```

### Overenie v IndexedDB
```
DevTools → Application → IndexedDB → OfflineDB → pendingMutations

Očakávaný záznam:
{
  id: "uuid...",
  entityType: "attendance",
  action: "update",
  data: {
    attendanceId: "...",
    departureTime: "...",
    latitude: ...,
    longitude: ...
  },
  timestamp: "...",
  synced: false,
  retries: 0,
  userId: "..."
}
```

### Krok 4: Prejsť ONLINE a overiť synchronizáciu
```
Akcia: DevTools → Network → No throttling
Očakávané:
  ✓ Automatická synchronizácia do 2-3 sekúnd
  ✓ Toast: "Synchronizované X záznamov"
  ✓ "Offline režim" indikátor zmizne
  ✓ PendingSyncBadge sa aktualizuje (0 pending)
```

### Overenie v Supabase DB
```
Skontrolovať attendance tabuľku:
  ✓ departure_time je vyplnený
  ✓ departure_latitude/longitude sú vyplnené
  ✓ total_hours je vypočítaný
```

---

## TEST 2️⃣: Jazda s vozidlom offline (Vehicle Log)

### Príprava
1. ✅ Prihlásiť sa ako employee
2. ✅ Prejsť na `/vehicle-use`
3. ✅ Mať zaznamenané check-in (arrival) pre dnešný deň

### Krok 1: Začať jazdu ONLINE
```
Akcia: Vyplniť formulár
  - Vozidlo: [vybrať]
  - Projekt: [vybrať]
  - Začiatočný km: [zadať]
  - Foto: [priložiť]
  - Kliknúť "Začať jazdu"

Očakávané:
  ✓ Toast: "Jazda začatá"
  ✓ Redirect na /dashboard
  ✓ Zobrazí sa active vehicle card
```

### Krok 2: Prejsť OFFLINE
```
Akcia: DevTools → Network → Offline
```

### Krok 3: Pokus dokončiť jazdu OFFLINE
```
Akcia: Dashboard → ActiveVehicleCard → "Dokončiť jazdu"
  - Konečný km: [zadať]
  - Foto: [priložiť]
  - Poznámka: [voliteľné]
  - Kliknúť "Dokončiť"

Očakávané:
  ✓ Toast: "Jazda uložená - synchronizuje sa po pripojení"
  ✓ Card zmizne (optimistic update)
```

### Overenie v IndexedDB
```
pendingMutations:
{
  entityType: "vehicle_log",
  action: "update",
  data: {
    logId: "...",
    kmEnd: ...,
    photoKmEnd: "data:image/jpeg;base64,...", // Base64!
    note: "..."
  },
  synced: false
}
```

### Krok 4: ONLINE - synchronizácia
```
Akcia: Zapnúť online
Očakávané:
  ✓ Automatická synchronizácia
  ✓ Base64 → File konverzia
  ✓ Upload foto do Supabase Storage
  ✓ Update vehicle_logs tabuľky
  ✓ Update vehicles.current_km
  ✓ Update profiles.last_used_vehicle_id
```

---

## TEST 3️⃣: Tankovanie offline (Fuel Log)

### Príprava
1. ✅ Prihlásiť sa ako employee  
2. ✅ Prejsť na `/fueling`
3. ✅ Mať zaznamenané check-in pre dnešok

### Krok 1: Prejsť OFFLINE
```
Akcia: DevTools → Network → Offline
```

### Krok 2: Vyplniť formulár OFFLINE
```
Akcia:
  - Vozidlo: [vybrať z cache]
  - Projekt: [vybrať z cache] 
  - Dátum: [dnes]
  - Litre: 50
  - Cena: 80.50
  - Poznámka: "Test offline"
  - Foto účtenky: [priložiť]
  - Kliknúť "Uložiť"

Očakávané:
  ✓ Toast: "Tankovanie uložené - synchronizuje sa po pripojení"
  ✓ Formulár sa vyčistí
  ✓ Možnosť pridať ďalší záznam
```

### Overenie v IndexedDB
```
pendingMutations:
{
  entityType: "fuel_log",
  action: "create",
  data: {
    vehicleId: "...",
    projectId: "...",
    date: "...",
    liters: 50,
    price: 80.50,
    note: "Test offline",
    photoReceipt: "data:image/jpeg;base64,..." // Base64
  },
  synced: false
}
```

### Krok 3: Pridať ďalšie tankovanie OFFLINE
```
Akcia: Pridať ešte 2-3 záznamy offline
Očakávané:
  ✓ Všetky sa uložia do IndexedDB
  ✓ PendingSyncBadge zobrazuje počet (napr. "3 záznamy čakajú")
```

### Krok 4: Manuálna synchronizácia
```
Akcia:
  1. Zapnúť online
  2. Kliknúť na PendingSyncBadge → "Synchronizovať"

Očakávané:
  ✓ Loading indicator počas syncu
  ✓ Toast: "Synchronizované 3 záznamov"
  ✓ Všetky fotky nahrané do storage
  ✓ Všetky záznamy v fuel_logs tabuľke
```

---

## TEST 4️⃣: Cache Storage - Offline čítanie dát

### Test 4A: Vozidlá a projekty offline
```
Príprava:
  1. Online: Načítať /vehicle-use (vozidlá + projekty sa načítajú)
  2. Offline: Reload stránku
  
Očakávané:
  ✓ Stránka sa načíta (service worker)
  ✓ Select pre vozidlá zobrazuje cache-ované vozidlá
  ✓ Select pre projekty zobrazuje cache-ované projekty
  ✗ Nové vozidlá pridané adminom NEBUDÚ viditeľné (OK, čakáme na online)
```

### Test 4B: História offline
```
Príprava:
  1. Online: Načítať /history (attendance, vehicle logs, fuel logs)
  2. Offline: Reload /history

Očakávané:
  ✓ História sa zobrazuje z cache (posledných 2 min cache)
  ✗ Čerstvé zmeny NEBUDÚ viditeľné (OK)
  ✓ "Offline režim" indikátor je viditeľný
```

---

## TEST 5️⃣: Konfliktné scenáre

### Test 5A: Duplicitný záznam
```
Scenár:
  1. Offline: Zaznamenať príchod
  2. Online: Automatická synchronizácia
  3. Offline: Zaznamenať príchod znovu (rovnaký deň)
  4. Online: Synchronizovať

Očakávané správanie:
  ✓ Druhý príchod by NEMAL vytvoriť duplicitu
  ✓ Kontrola v syncManager.ts či už existuje attendance pre daný deň
  ⚠️ MOŽNÝ PROBLÉM: Súčasná implementácia to nekontroluje!
```

### Test 5B: Admin zmení dáta počas offline
```
Scenár:
  1. Employee offline: Zaznamená odchod o 17:00
  2. Admin online: Upraví odchod na 16:30
  3. Employee online: Sync pending mutation (odchod 17:00)

Očakávané správanie:
  ⚠️ KONFLIKT: Ktorý čas má zostať?
  ⚠️ Súčasná implementácia: Last write wins (17:00 prepíše 16:30)
  
Riešenie:
  - Potrebná conflict resolution stratégia
  - Timestamp-based alebo admin má prednosť
```

---

## TEST 6️⃣: Edge Cases

### Test 6A: Veľký počet pending mutations
```
Akcia: Vytvoriť 20+ pending záznamov offline
Očakávané:
  ✓ Všetky sa uložia do IndexedDB
  ✓ Všetky sa synchronizujú po online
  ⚠️ Možné problémy s memory pri Base64 fotkách
```

### Test 6B: Zlyhanie synchronizácie
```
Simulácia:
  1. Offline: Vytvoriť záznam s neplatným projectId
  2. Online: Sync zlyhá (foreign key constraint)

Očakávané:
  ✓ incrementRetries() sa zavolá
  ✓ Záznam ostane v IndexedDB
  ✓ Toast: "Nepodarilo sa synchronizovať X záznamov"
  ⚠️ Užívateľ nevie, ktorý konkrétny záznam zlyhal
```

### Test 6C: App zatvorená počas offline
```
Akcia:
  1. Offline: Vytvoriť pending mutations
  2. Zavrieť browser tab
  3. Otvoriť app neskôr (online)

Očakávané:
  ✓ IndexedDB persistent (data stále tam)
  ✓ Po prihlásení sa spustí setupAutoSync()
  ✓ Automatická synchronizácia pending dát
```

---

## TEST 7️⃣: UI/UX testovanie

### Indikátory a feedback
- [ ] Offline indikátor je VIDITEĽNÝ (žltý alert)
- [ ] PendingSyncBadge zobrazuje SPRÁVNY počet
- [ ] Toast správy sú JASNÉ a INFORMATÍVNE
- [ ] Loading states počas synchronizácie
- [ ] Tlačidlá sú DISABLED počas offline (kde je to potrebné)

### Responzívnosť
- [ ] Offline funkcionalita funguje na mobile (PWA)
- [ ] Touch eventy fungujú správne
- [ ] Fotenie cez mobil funguje offline

---

## 🔍 Zistené problémy a odporúčania

### 🔴 Kritické problémy
1. **Chýba deduplikácia** - možné duplicitné záznamy
2. **Žiadna conflict resolution** - last write wins môže prepísať admin zmeny
3. **Chýba validácia** pred sync - neplatné dáta môžu zlyhať pri sync

### 🟡 Dôležité vylepšenia
1. **Viditeľnosť pending sync** - badge by mal byť v navbar/sidebar
2. **Detailnejšie error messages** - užívateľ nevie, ktorý záznam zlyhal
3. **Offline indikátor** - mal by byť fixne viditeľný, nie len alert
4. **Manual sync button** - už existuje, ale nie je dostupný všade

### 🟢 Nice-to-have
1. **Background Sync API** - sync aj keď je app zatvorená
2. **Compression Base64 images** - úspora storage
3. **Offline analytics** - tracking offline usage
4. **Export pending data** - backup do CSV/JSON

---

## ✅ Success Criteria

Offline funkcionalita je považovaná za funkčnú ak:
- [x] Employee môže zaznamenať príchod/odchod offline
- [x] Employee môže začať/dokončiť jazdu offline  
- [x] Employee môže pridať tankovanie offline
- [x] Fotky sa ukladajú ako Base64 offline
- [x] Automatická synchronizácia po online
- [x] Manuálna synchronizácia funguje
- [x] Cache umožňuje čítanie zoznamov (vozidlá, projekty)
- [x] PWA manifest správne nakonfigurovaný
- [x] Service Worker aktívny a funkčný

### Čo ešte treba otestovať MANUÁLNE:
1. ⚠️ Skutočný offline scenár (nie len DevTools)
2. ⚠️ PWA inštalácia na mobile
3. ⚠️ GPS lokácia offline
4. ⚠️ Fotenie cez mobil camera offline
5. ⚠️ Dlhodobý offline (niekoľko hodín/dní)

---

## 📊 Reporting

Po dokončení testovania vyplniť:

### Úspešné scenáre:
```
✅ [Scenár] - [Popis]
```

### Zistené chyby:
```
❌ [Scenár] - [Popis problému] - [Kroky na reprodukciu]
```

### Odporúčania na vylepšenie:
```
💡 [Vylepšenie] - [Odôvodnenie] - [Priorita]
```

---

**Poznámka**: Tento dokument je living document. Aktualizuj ho po každom testovaní s novými zisteniami.

import { useCallback } from 'react';

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

/**
 * Centralizovaný hook pre prácu s GPS lokalizáciou.
 * 
 * Používa Geolocation API s nasledovnými nastaveniami:
 * - enableHighAccuracy: true (použiť GPS namiesto WiFi/IP)
 * - timeout: 10000ms (max 10 sekúnd čakanie)
 * - maximumAge: 0 (vždy fresh poloha, žiadna cache)
 * 
 * @returns {getLocation} Funkcia na získanie GPS súradníc
 * 
 * @example
 * const { getLocation } = useGeolocation();
 * const coords = await getLocation(); // { latitude, longitude } alebo null
 */
export function useGeolocation() {
  /**
   * Získa aktuálnu GPS polohu používateľa.
   * 
   * @returns Promise<GeolocationCoords | null>
   *   - GeolocationCoords: { latitude, longitude } ak je GPS dostupné
   *   - null: ak GPS nie je dostupné, používateľ odmietol povolenie, alebo timeout
   * 
   * @throws Nikdy - chyby sú zachytené a vracia sa null
   */
  const getLocation = useCallback(async (): Promise<GeolocationCoords | null> => {
    // Kontrola dostupnosti Geolocation API
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation API is not supported by this browser');
      return null;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,  // Použiť GPS namiesto WiFi/IP lokalizácie
            timeout: 10000,             // Max 10 sekúnd čakanie
            maximumAge: 0               // Nevrátiť cache, vždy fresh polohu
          }
        );
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error) {
      // GPS nie je dostupné - môže byť z viacerých dôvodov:
      // 1. Používateľ odmietol povolenie
      // 2. GPS signál nie je dostupný
      // 3. Timeout (> 10 sekúnd)
      // 4. Iná chyba zariadenia
      
      const geoError = error as GeolocationPositionError;
      
      switch (geoError.code) {
        case 1: // PERMISSION_DENIED
          console.warn('GPS location permission denied by user');
          break;
        case 2: // POSITION_UNAVAILABLE
          console.warn('GPS location position unavailable');
          break;
        case 3: // TIMEOUT
          console.warn('GPS location request timed out');
          break;
        default:
          console.warn('GPS location not available:', geoError.message);
      }
      
      // Vrátiť null - záznam sa uloží aj bez GPS súradníc
      return null;
    }
  }, []);

  return {
    getLocation,
  };
}

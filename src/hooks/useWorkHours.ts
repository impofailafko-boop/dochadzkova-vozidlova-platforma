import { useCallback } from 'react';

/**
 * Hook na výpočet pracovných hodín medzi dvoma časmi.
 * 
 * Používa sa pri:
 * - Zázname odchodu v dochádzke
 * - Syncovaní offline záznamov
 * 
 * @returns {calculateHours} Funkcia na výpočet hodín
 * 
 * @example
 * const { calculateHours } = useWorkHours();
 * const hours = calculateHours('08:00:00', '16:30:00'); // 8.5
 */
export function useWorkHours() {
  /**
   * Vypočíta počet hodín medzi príchodom a odchodom.
   * 
   * @param arrivalTime - Čas príchodu vo formáte 'HH:MM:SS' alebo 'HH:MM'
   * @param departureTime - Čas odchodu vo formáte 'HH:MM:SS' alebo 'HH:MM'
   * @returns number - Počet hodín s presnosťou na 2 desatinné miesta, alebo null
   * 
   * @example
   * calculateHours('08:00:00', '16:30:00') // 8.50
   * calculateHours('08:00', '12:00') // 4.00
   * calculateHours('23:00', '01:00') // 2.00 (cez polnoc)
   */
  const calculateHours = useCallback((
    arrivalTime: string | null | undefined,
    departureTime: string | null | undefined
  ): number | null => {
    if (!arrivalTime || !departureTime) {
      return null;
    }

    try {
      // Použiť fiktívny dátum 1970-01-01 pre konzistentný výpočet času
      const arrivalDate = new Date(`1970-01-01T${arrivalTime}`);
      const departureDate = new Date(`1970-01-01T${departureTime}`);
      
      // Validácia, či sú dátumy platné
      if (isNaN(arrivalDate.getTime()) || isNaN(departureDate.getTime())) {
        console.warn('Invalid time format:', { arrivalTime, departureTime });
        return null;
      }

      // Výpočet rozdielu v milisekundách
      const diffMs = departureDate.getTime() - arrivalDate.getTime();
      
      // Konverzia na hodiny s presnosťou na 2 desatinné miesta
      const hours = diffMs / (1000 * 60 * 60);
      return parseFloat(hours.toFixed(2));
    } catch (error) {
      console.error('Error calculating work hours:', error);
      return null;
    }
  }, []);

  return {
    calculateHours,
  };
}

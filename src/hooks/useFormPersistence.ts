import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

/**
 * Custom hook to persist form data in localStorage
 * Automatically saves form data on change and restores it on mount
 * Clears data on successful submit
 */
export function useFormPersistence<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  storageKey: string,
  excludeFields: (keyof T)[] = []
) {
  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Only set non-excluded fields
        Object.keys(parsed).forEach((key) => {
          if (!excludeFields.includes(key as keyof T)) {
            form.setValue(key as any, parsed[key]);
          }
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to parse saved form data:', error);
        }
        localStorage.removeItem(storageKey);
      }
    }
  }, []);

  // Save data on form change
  useEffect(() => {
    const subscription = form.watch((data) => {
      // Filter out excluded fields and File objects
      const dataToSave: Record<string, any> = {};
      Object.keys(data).forEach((key) => {
        if (!excludeFields.includes(key as keyof T)) {
          const value = data[key];
          // Don't save File objects or undefined values
          if (!(value instanceof File) && value !== undefined) {
            dataToSave[key] = value;
          }
        }
      });
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    });
    return () => subscription.unsubscribe();
  }, [form, storageKey, excludeFields]);

  // Function to clear persisted data
  const clearPersistedData = () => {
    localStorage.removeItem(storageKey);
  };

  return { clearPersistedData };
}

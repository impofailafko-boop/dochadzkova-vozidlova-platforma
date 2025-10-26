import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const FORM_ROUTES = ['/vehicle-use', '/fueling'];
const STORAGE_KEY = 'pikolo-last-form-route';

/**
 * Hook to track and persist form routes
 * Saves the current route to localStorage if it's a form page
 * Clears it when navigating away from form pages
 */
export function useRouteTracking() {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    
    if (FORM_ROUTES.includes(currentPath)) {
      // Save form route to localStorage
      localStorage.setItem(STORAGE_KEY, currentPath);
    } else {
      // Clear saved route when navigating away from form pages
      const savedRoute = localStorage.getItem(STORAGE_KEY);
      if (savedRoute && FORM_ROUTES.includes(savedRoute)) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [location.pathname]);
}

/**
 * Get the last saved form route and clear it
 */
export function getAndClearLastFormRoute(): string | null {
  const savedRoute = localStorage.getItem(STORAGE_KEY);
  if (savedRoute && FORM_ROUTES.includes(savedRoute)) {
    localStorage.removeItem(STORAGE_KEY);
    return savedRoute;
  }
  return null;
}

/**
 * Clear the saved form route (useful after successful form submission)
 */
export function clearLastFormRoute() {
  localStorage.removeItem(STORAGE_KEY);
}

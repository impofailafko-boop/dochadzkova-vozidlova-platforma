import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupAutoSync } from "./lib/syncManager";

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Setup auto-sync for offline attendance
setupAutoSync();

createRoot(document.getElementById("root")!).render(<App />);

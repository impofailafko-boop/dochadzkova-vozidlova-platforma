import { createRoot } from "react-dom/client";
import { registerSW } from 'virtual:pwa-register';
import App from "./App.tsx";
import "./index.css";

// Register Service Worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA] Nová verzia dostupná, prosím obnovte stránku.');
  },
  onOfflineReady() {
    console.log('[PWA] Aplikácia je pripravená na offline použitie.');
  },
  onRegistered(registration) {
    console.log('[PWA] Service Worker zaregistrovaný:', registration);
  },
  onRegisterError(error) {
    console.error('[PWA] Chyba registrácie Service Worker:', error);
  },
});

createRoot(document.getElementById("root")!).render(<App />);

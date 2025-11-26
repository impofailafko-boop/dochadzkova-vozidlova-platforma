import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA offline functionality
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nová verzia je dostupná. Obnoviť aplikáciu?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('✅ PWA: Aplikácia je pripravená pracovať offline');
  },
  onRegistered(registration) {
    console.log('✅ PWA: Service Worker registrovaný', registration);
  },
  onRegisterError(error) {
    console.error('❌ PWA: Chyba pri registrácii Service Worker', error);
  },
});

createRoot(document.getElementById("root")!).render(<App />);

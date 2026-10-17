import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { SettingsProvider } from './lib/settings.jsx';
import { TripProvider } from './lib/trip.jsx';
import { NotesProvider } from './lib/notes.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SettingsProvider>
      <TripProvider>
        <NotesProvider>
          <App />
        </NotesProvider>
      </TripProvider>
    </SettingsProvider>
  </React.StrictMode>
);

// Offline rezim pro PWA. V Capacitoru se bezi z file:// a registrace se preskoci.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

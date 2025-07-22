import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// Modificato: cambiato l'import da alias a percorso relativo per toaster.tsx
import { Toaster } from './components/ui/toaster.tsx' // Percorso relativo

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster />
  </>
);
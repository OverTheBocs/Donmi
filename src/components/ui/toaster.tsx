// src/components/ui/toaster.tsx
import { Toaster as SonnerToaster } from "sonner"; // Importa Toaster da sonner

// Componente Toaster per visualizzare i messaggi di notifica.
// Questo componente è un wrapper per la libreria 'sonner',
// che fornisce un sistema di toast bello e accessibile.
// Assicurati che 'sonner' sia installato nel tuo progetto: npm install sonner
export function Toaster() {
  return (
    <SonnerToaster
      // Posizione dei toast
      position="top-center"
      // Stili per i toast in base al tema (light/dark)
      toastOptions={{
        className: "toast",
        descriptionClassName: "toast-description",
        actionButtonClassName: "toast-action-button",
        cancelButtonClassName: "toast-cancel-button",
        // Stili per il tema light
        light: {
          className: "bg-white text-gray-900 border border-gray-200 shadow-lg rounded-lg",
          descriptionClassName: "text-gray-600",
          actionButtonClassName: "bg-gray-100 text-gray-900 hover:bg-gray-200",
          cancelButtonClassName: "bg-red-50 text-red-600 hover:bg-red-100",
        },
        // Stili per il tema dark
        dark: {
          className: "bg-gray-800 text-gray-50 border border-gray-700 shadow-lg rounded-lg",
          descriptionClassName: "text-gray-400",
          actionButtonClassName: "bg-gray-700 text-gray-50 hover:bg-gray-600",
          cancelButtonClassName: "bg-red-900 text-red-300 hover:bg-red-800",
        },
      }}
    />
  );
}

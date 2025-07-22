https://prod.liveshare.vsengsaas.visualstudio.com/join?BE20CBA32976D254E320694CE1128E6EFA9F




Applicazione di Gestione Spazi DomiQuesto progetto è un'applicazione web React costruita con Vite e TypeScript, che integra Firebase per l'autenticazione, la gestione dei ruoli e la persistenza dei dati. Include sezioni per la visualizzazione del calendario eventi, la richiesta di spazi e le informazioni sugli spazi disponibili.=====================================Tecnologie Utilizzate=====================================React: Libreria JavaScript per la costruzione di interfacce utente.Vite: Tool di build rapido per progetti web moderni.TypeScript: Linguaggio di programmazione tipizzato che si basa su JavaScript.Firebase: Piattaforma di sviluppo di Google per la creazione di applicazioni mobili e web.Firebase Authentication: Per la gestione degli utenti e dei ruoli (Ospite, Utente, Operatore, Admin, Superuser).Firestore Database: Per la memorizzazione dei dati delle richieste di spazio e dei profili utente.Firebase Hosting: Per la distribuzione dell'applicazione.Tailwind CSS: Framework CSS utility-first per uno styling rapido e responsivo.Shadcn UI: Collezione di componenti UI riutilizzabili e personalizzabili.Lucide React: Libreria di icone.=====================================Struttura del Progetto=====================================Il progetto segue una struttura standard per le applicazioni React/Vite:pippo/
├── node_modules/
├── public/
│   ├── index.html
│   └── robots.txt
├── src/
│   ├── App.js              # Componente principale dell'applicazione con routing e gestione ruoli
│   ├── index.css           # Fogli di stile principali (include direttive Tailwind)
│   ├── main.tsx            # Punto di ingresso dell'applicazione
│   ├── components/         # Componenti UI riutilizzabili (es. shadcn/ui)
│   │   └── ui/
│   ├── contexts/           # Contesti React per la gestione dello stato globale
│   ├── hooks/              # Custom hooks riutilizzabili
│   ├── lib/
│   │   └── firebase.ts     # Configurazione e inizializzazione di Firebase
│   └── pages/              # Componenti delle pagine principali
│       ├── Calendar.tsx    # Sezione Calendario Eventi
│       ├── BookSpace.tsx   # Sezione Richiesta Spazi
│       └── SpacesInfo.tsx  # Sezione Info Spazi
├── .gitignore
├── package.json            # Definizioni del progetto e delle dipendenze
├── package-lock.json
├── README.md
├── tsconfig.json           # Configurazione TypeScript
├── vite.config.ts          # Configurazione di Vite
└── firebase.json           # Configurazione di Firebase Hosting
=====================================Ruoli Utente e Permessi=====================================L'applicazione gestisce i seguenti ruoli utente, ciascuno con permessi specifici:Ospite (Non Registrato):Visualizza il Calendario (solo eventi approvati, non le richieste in attesa).Visualizza le Info Spazi.Per richiedere uno spazio o accedere a funzionalità avanzate, deve registrarsi/accedere.Utente:Visualizza il Calendario (tutti gli eventi, incluse le richieste in attesa).Può richiedere uno Spazio.Visualizza le Info Spazi.Operatore:Tutte le funzioni di "Utente".Può lasciare feedback (valutazione e note) per gli eventi passati nel Calendario.Visualizza i feedback lasciati dagli operatori/admin.Admin:Tutte le funzioni di "Operatore".Può accettare, rifiutare, modificare ed eliminare le richieste di spazio pervenute.Superuser:Tutte le funzioni di "Admin".Accesso al Pannello Superuser per gestire i ruoli degli utenti e eliminare gli utenti dal database Firestore.=====================================Script Disponibili=====================================Nella directory del progetto, puoi eseguire:npm install o yarn installInstalla tutte le dipendenze del progetto. Esegui questo comando dopo aver clonato il repository o quando le dipendenze vengono aggiornate.npm run dev o yarn devAvvia l'applicazione in modalità di sviluppo.Apri http://localhost:5173 nel tuo browser.La pagina si ricaricherà automaticamente quando apporti modifiche.npm run build o yarn buildCompila l'applicazione per la produzione nella cartella build.Ottimizza l'applicazione per le migliori prestazioni. I file compilati sono pronti per essere distribuiti.npm run lint o yarn lintEsegue ESLint per analizzare il codice e identificare problemi.npm run preview o yarn previewAvvia un server locale per servire la build di produzione. Utile per testare la build prima del deploy.=====================================Distribuzione (Firebase Hosting)=====================================Questa applicazione è configurata per essere distribuita su Firebase Hosting, in una sottodirectory /app/ del tuo dominio.Assicurati di aver installato Firebase CLI globalmente:npm install -g firebase-tools
Accedi a Firebase:firebase login
Configura il tuo progetto Firebase per l'hosting (se non l'hai già fatto):Naviga nella radice del progetto (pippo).Esegui firebase init e segui le istruzioni, scegliendo "Hosting" e impostando build come directory pubblica, e configurando le riscritture per le SPA.Esegui la build di produzione:npm run build
Distribuisci l'applicazione:firebase deploy
La tua app sarà disponibile all'URL fornito da Firebase (es. https://your-project-id.web.app/app/).=====================================Note Importanti=====================================Configurazione Firebase: Assicurati che il file src/lib/firebase.ts contenga la configurazione corretta del tuo progetto Firebase (domi-registration-app).Cache del Browser: Dopo ogni deploy, svuota la cache del browser per assicurarti di visualizzare l'ultima versione dell'applicazione.

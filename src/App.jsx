    import React, { useState, useEffect } from 'react';
    import { initializeApp } from 'firebase/app';
    import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
    import { getFirestore, doc, setDoc, getDoc, collection, query, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';

    // Importa i tuoi nuovi componenti con estensione .tsx esplicita
    import Calendar from './pages/Calendar.tsx'; // Modificato: aggiunto .tsx
    import BookSpace from './pages/BookSpace.tsx'; // Modificato: aggiunto .tsx
    import SpacesInfo from './pages/SpacesInfo.tsx'; // Modificato: aggiunto .tsx

    // Variabili globali fornite dall'ambiente Canvas.
    // Per lo sviluppo locale, 'firebaseConfig' viene impostato direttamente.
    // 'appId' viene derivato da 'firebaseConfig.projectId' per coerenza.
    // 'initialAuthToken' è null per il login tradizionale.

    // La tua configurazione Firebase reale:
    const firebaseConfig = {
      apiKey: "AIzaSyA3Wtigmq3erjciNW3rkLTUqeOvEvOMyjs",
      authDomain: "domi-registration-app.firebaseapp.com",
      projectId: "domi-registration-app",
      storageBucket: "domi-registration-app.appspot.com",
      messagingSenderId: "361851772591",
      appId: "1:361851772591:web:8b3a628db7243e7f0bfe5a",
      measurementId: "G-WL4SW5NY31"
    };

    // Per l'ambiente Canvas, __app_id e __initial_auth_token sono forniti.
    // Per lo sviluppo locale, usiamo i valori dalla configurazione o null.
    // eslint-disable-next-line no-undef
    const appId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;
    // eslint-disable-next-line no-undef
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;


    // Inizializzazione Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Funzione per generare un UUID (per utenti anonimi se necessario)
    const generateUUID = () => crypto.randomUUID();

    // Componente principale dell'applicazione
    function App() {
      const [currentUser, setCurrentUser] = useState(null); // Utente Firebase autenticato
      const [userId, setUserId] = useState(null); // ID utente (UID Firebase o UUID anonimo)
      const [userRole, setUserRole] = useState('generic'); // Ruolo dell'utente corrente
      const [isAuthReady, setIsAuthReady] = useState(false); // Indica se l'autenticazione è pronta
      const [usersData, setUsersData] = useState([]); // Dati di tutti gli utenti (per superuser)
      const [view, setView] = useState('home'); // Vista corrente: 'home', 'register', 'login', 'forgotPassword', 'adminPanel', 'calendar', 'bookSpace', 'spacesInfo'
      const [message, setMessage] = useState(''); // Messaggi per l'utente (es. successo/errore)

      // Funzione per gestire il logout
      const handleLogout = async () => {
        try {
          await signOut(auth);
          setMessage('Disconnessione avvenuta con successo!');
          setView('home'); // Torna alla home dopo il logout
          // onAuthStateChanged gestirà l'aggiornamento dello stato utente
        } catch (error) {
          console.error("Errore durante il logout:", error);
          setMessage(`Errore durante il logout: ${error.message}`);
        }
      };

      // Effetto per l'inizializzazione di Firebase e l'ascolto dello stato di autenticazione
      useEffect(() => {
        const initFirebase = async () => {
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(auth, initialAuthToken);
            } else {
              await signInAnonymously(auth);
            }
          } catch (error) {
            console.error("Errore nell'autenticazione Firebase:", error);
            setMessage(`Errore nell'autenticazione: ${error.message}`);
          }
        };

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          setCurrentUser(user);
          if (user) {
            setUserId(user.uid);
            // Recupera il ruolo dell'utente dal database
            const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setUserRole(userDocSnap.data().role);
            } else {
              setUserRole('generic'); // Utente generico se non trovato nel DB
            }
          } else {
            // Se non c'è un utente autenticato (es. anonimo), genera un ID temporaneo
            setUserId(generateUUID());
            setUserRole('generic');
          }
          setIsAuthReady(true);
        });

        initFirebase();

        // Pulizia dell'effetto
        return () => unsubscribe();
      }, []);

      // Effetto per l'ascolto dei dati degli utenti (solo se l'autenticazione è pronta e l'utente è superuser)
      useEffect(() => {
        if (isAuthReady && userRole === 'superuser') {
          const usersCollectionRef = collection(db, `artifacts/${appId}/public/data/users`);
          const q = usersCollectionRef;

          const unsubscribe = onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsersData(users);
          }, (error) => {
            console.error("Errore nel recupero degli utenti:", error);
            setMessage(`Errore nel recupero degli utenti: ${error.message}`);
          });

          return () => unsubscribe();
        }
      }, [isAuthReady, userRole]);

      // Componente del modulo di registrazione
      const RegistrationForm = () => {
        const [formData, setFormData] = useState({
          nome: '',
          cognome: '',
          luogoNascita: '',
          dataNascita: '',
          indirizzoResidenza: '',
          cap: '',
          citta: '',
          provincia: '',
          codiceFiscale: '',
          email: '',
          numeroCell: '',
          qualifica: '',
          nomeEnte: '',
          ruoloSpecifico: '',
          note: '',
          password: '', // Nuovo campo password
        });
        const [errors, setErrors] = useState({});

        const handleChange = (e) => {
          const { name, value } = e.target;
          setFormData(prev => ({ ...prev, [name]: value }));
          // Rimuovi l'errore quando l'utente inizia a digitare
          if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
          }
        };

        const validate = () => {
          console.log("Validating form data:", formData); // Debug log
          let newErrors = {};
          if (!formData.nome) newErrors.nome = 'Il Nome è richiesto.';
          if (!formData.cognome) newErrors.cognome = 'Il Cognome è richiesto.';
          if (!formData.luogoNascita) newErrors.luogoNascita = 'Il Luogo di nascita è richiesto.';
          if (!formData.dataNascita) newErrors.dataNascita = 'La Data di nascita è richiesta.';
          if (!formData.indirizzoResidenza) newErrors.indirizzoResidenza = 'L\'Indirizzo di residenza è richiesto.';
          if (!formData.cap || !/^\d{5}$/.test(formData.cap)) newErrors.cap = 'Il CAP deve essere di 5 cifre.';
          if (!formData.citta) newErrors.citta = 'La Città è richiesta.';
          if (!formData.provincia) newErrors.provincia = 'La Provincia è richiesta.';
          if (!formData.codiceFiscale || formData.codiceFiscale.length < 16) newErrors.codiceFiscale = 'Il Codice Fiscale è richiesto e deve essere valido.';
          if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'L\'Indirizzo email non è valido.';
          if (!formData.numeroCell) newErrors.numeroCell = 'Il Numero di cellulare è richiesto.';
          if (!formData.qualifica) newErrors.qualifica = 'La Qualifica è richiesta.';
          if (!formData.password || formData.password.length < 6) newErrors.password = 'La Password è richiesta e deve essere di almeno 6 caratteri.'; // Validazione password

          if (formData.qualifica === 'ambito terzo settore' || formData.qualifica === 'ambito istituzionale') {
            if (!formData.nomeEnte) newErrors.nomeEnte = 'Il Nome dell\'ente è richiesto.';
            if (!formData.ruoloSpecifico) newErrors.ruoloSpecifico = 'Il Ruolo specifico è richiesto.';
          }
          if (formData.qualifica === 'altro' && !formData.note) {
            newErrors.note = 'Le Note da segnalare sono richieste.';
          }

          setErrors(newErrors);
          const isValid = Object.keys(newErrors).length === 0;
          console.log("Form validation result:", isValid, "Errors:", newErrors); // Debug log
          return isValid;
        };

        const handleSubmit = async (e) => {
          console.log("Submit button clicked!"); // Debug log
          e.preventDefault();
          setMessage(''); // Azzera i messaggi precedenti

          if (!validate()) {
            console.log("Validation failed."); // Debug log
            setMessage('Per favor, correggi gli errori nel modulo.');
            return;
          }

          // Non è più necessario currentUser qui per creare l'utente,
          // perché createUserWithEmailAndPassword crea un nuovo utente Auth.
          // L'UID verrà poi usato per salvare i dati in Firestore.
          try {
            // 1. Crea l'utente in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            console.log("User created in Firebase Auth with UID:", user.uid); // Debug log

            // 2. Salva i dati dell'utente in Firestore usando il nuovo UID
            const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, user.uid);
            await setDoc(userDocRef, {
              ...formData,
              uid: user.uid, // Usa l'UID dell'utente appena creato
              role: 'pending', // Tutti i nuovi utenti sono 'pending'
              createdAt: new Date(),
              // Rimuovi la password dai dati salvati in Firestore per sicurezza
              password: null // Non salvare la password in Firestore!
            });
            console.log("Registration data saved to Firestore!"); // Debug log

            setMessage('Registrazione avvenuta con successo! La tua richiesta è in attesa di approvazione.');
            setFormData({ // Resetta il form
                nome: '', cognome: '', luogoNascita: '', dataNascita: '', indirizzoResidenza: '',
                cap: '', citta: '', provincia: '', codiceFiscale: '', email: '', numeroCell: '',
                qualifica: '', nomeEnte: '', ruoloSpecifico: '', note: '', password: '',
            });
            setView('home'); // Torna alla home dopo la registrazione
          } catch (error) {
            console.error("Errore durante la registrazione:", error); // Debug log
            let errorMessage = "Errore durante la registrazione. Riprova.";
            if (error.code === 'auth/email-already-in-use') {
              errorMessage = 'L\'indirizzo email è già in uso. Prova ad accedere o a usare un\'altra email.';
            } else if (error.code === 'auth/weak-password') {
              errorMessage = 'La password è troppo debole. Deve essere di almeno 6 caratteri.';
            }
            setMessage(errorMessage);
          }
        };

        return (
          <div className="p-8 bg-white rounded-xl shadow-lg max-w-2xl mx-auto my-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Modulo di Registrazione</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campi anagrafici */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome</label>
                  <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange}
                         className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
                </div>
                <div>
                  <label htmlFor="cognome" className="block text-sm font-medium text-gray-700">Cognome</label>
                  <input type="text" id="cognome" name="cognome" value={formData.cognome} onChange={handleChange}
                         className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  {errors.cognome && <p className="text-red-500 text-xs mt-1">{errors.cognome}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="luogoNascita" className="block text-sm font-medium text-gray-700">Luogo di nascita</label>
                  <input type="text" id="luogoNascita" name="luogoNascita" value={formData.luogoNascita} onChange={handleChange}
                         className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                      {errors.luogoNascita && <p className="text-red-500 text-xs mt-1">{errors.luogoNascita}</p>}
                    </div>
                    <div>
                      <label htmlFor="dataNascita" className="block text-sm font-medium text-gray-700">Data di nascita</label>
                      <input type="date" id="dataNascita" name="dataNascita" value={formData.dataNascita} onChange={handleChange}
                             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                      {errors.dataNascita && <p className="text-red-500 text-xs mt-1">{errors.dataNascita}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="indirizzoResidenza" className="block text-sm font-medium text-gray-700">Indirizzo di residenza</label>
                    <input type="text" id="indirizzoResidenza" name="indirizzoResidenza" value={formData.indirizzoResidenza} onChange={handleChange}
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    {errors.indirizzoResidenza && <p className="text-red-500 text-xs mt-1">{errors.indirizzoResidenza}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="cap" className="block text-sm font-medium text-gray-700">CAP</label>
                      <input type="text" id="cap" name="cap" value={formData.cap} onChange={handleChange} maxLength="5"
                             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                      {errors.cap && <p className="text-red-500 text-xs mt-1">{errors.cap}</p>}
                    </div>
                    <div>
                      <label htmlFor="citta" className="block text-sm font-medium text-gray-700">Città</label>
                      <input type="text" id="citta" name="citta" value={formData.citta} onChange={handleChange}
                             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                      {errors.citta && <p className="text-red-500 text-xs mt-1">{errors.citta}</p>}
                    </div>
                    <div>
                      <label htmlFor="provincia" className="block text-sm font-medium text-gray-700">Provincia</label>
                      <input type="text" id="provincia" name="provincia" value={formData.provincia} onChange={handleChange}
                             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                      {errors.provincia && <p className="text-red-500 text-xs mt-1">{errors.provincia}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="codiceFiscale" className="block text-sm font-medium text-gray-700">Codice Fiscale</label>
                    <input type="text" id="codiceFiscale" name="codiceFiscale" value={formData.codiceFiscale} onChange={handleChange}
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm uppercase" />
                    {errors.codiceFiscale && <p className="text-red-500 text-xs mt-1">{errors.codiceFiscale}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Indirizzo Email</label>
                      <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="numeroCell" className="block text-sm font-medium text-gray-700">Numero di cellulare</label>
                      <input type="tel" id="numeroCell" name="numeroCell" value={formData.numeroCell} onChange={handleChange}
                             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                      {errors.numeroCell && <p className="text-red-500 text-xs mt-1">{errors.numeroCell}</p>}
                    </div>
                  </div>

                  {/* Nuovo campo Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange}
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>

                  {/* Campo Qualifica */}
                  <div>
                    <label htmlFor="qualifica" className="block text-sm font-medium text-gray-700">Qualifica</label>
                    <select id="qualifica" name="qualifica" value={formData.qualifica} onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">Seleziona una qualifica</option>
                      <option value="cittadino">Cittadino</option>
                      <option value="ambito terzo settore">Ambito terzo settore</option>
                      <option value="ambito istituzionale">Ambito istituzionale</option>
                      <option value="altro">Altro</option>
                    </select>
                    {errors.qualifica && <p className="text-red-500 text-xs mt-1">{errors.qualifica}</p>}
                  </div>

                  {/* Campi condizionali per "Ambito terzo settore" o "Ambito istituzionale" */}
                  {(formData.qualifica === 'ambito terzo settore' || formData.qualifica === 'ambito istituzionale') && (
                    <>
                      <div>
                        <label htmlFor="nomeEnte" className="block text-sm font-medium text-gray-700">Nome dell'ente</label>
                        <input type="text" id="nomeEnte" name="nomeEnte" value={formData.nomeEnte} onChange={handleChange}
                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        {errors.nomeEnte && <p className="text-red-500 text-xs mt-1">{errors.nomeEnte}</p>}
                      </div>
                      <div>
                        <label htmlFor="ruoloSpecifico" className="block text-sm font-medium text-gray-700">Ruolo (Volontario/Operatore/Dirigente)</label>
                        <select id="ruoloSpecifico" name="ruoloSpecifico" value={formData.ruoloSpecifico} onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                          <option value="">Seleziona un ruolo</option>
                          <option value="volontario">Volontario</option>
                          <option value="operatore">Operatore</option>
                          <option value="dirigente">Dirigente</option>
                        </select>
                        {errors.ruoloSpecifico && <p className="text-red-500 text-xs mt-1">{errors.ruoloSpecifico}</p>}
                      </div>
                    </>
                  )}

                  {/* Campo condizionale per "Altro" */}
                  {formData.qualifica === 'altro' && (
                    <div>
                      <label htmlFor="note" className="block text-sm font-medium text-gray-700">Note da segnalare</label>
                      <textarea id="note" name="note" value={formData.note} onChange={handleChange} rows="3"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                      {errors.note && <p className="text-red-500 text-xs mt-1">{errors.note}</p>}
                    </div>
                  )}

                  <button type="submit"
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
                    Registrati
                  </button>
                </form>
              </div>
            );
          };

      // Nuovo componente del modulo di Login
      const LoginForm = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [loginError, setLoginError] = useState('');

        const handleLogin = async (e) => {
          e.preventDefault();
          setLoginError(''); // Azzera i messaggi di errore precedenti
          setMessage('');

          if (!email || !password) {
            setLoginError('Per favor, inserisci email e password.');
            return;
          }

          try {
            await signInWithEmailAndPassword(auth, email, password);
            setMessage('Accesso effettuato con successo!');
            setView('home'); // Torna alla home dopo il login
          } catch (error) {
            console.error("Errore durante il login:", error);
            let errorMessage = "Errore durante il login. Controlla le credenziali.";
            if (error.code === 'auth/invalid-email') {
              errorMessage = 'Indirizzo email non valido.';
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
              errorMessage = 'Email o password non corretti.';
            } else if (error.code === 'auth/too-many-requests') {
              errorMessage = 'Troppi tentativi di accesso falliti. Riprova più tardi.';
            }
            setLoginError(errorMessage);
            setMessage(errorMessage);
          }
        };

        return (
          <div className="p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto my-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Accedi</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="loginEmail" value={email} onChange={(e) => setEmail(e.target.value)}
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" id="loginPassword" value={password} onChange={(e) => setPassword(e.target.value)}
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              {loginError && <p className="text-red-500 text-xs mt-1">{loginError}</p>}
              <button type="submit"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out">
                Accedi
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => setView('forgotPassword')}
                        className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none">
                  Password dimenticata?
                </button>
              </div>
            </form>
          </div>
        );
      };

      // Nuovo componente per il recupero password
      const ForgotPasswordForm = () => {
        const [email, setEmail] = useState('');
        const [resetMessage, setResetMessage] = useState('');
        const [resetError, setResetError] = useState('');

        const handlePasswordReset = async (e) => {
          e.preventDefault();
          setResetMessage('');
          setResetError('');
          setMessage('');

          if (!email) {
            setResetError('Per favor, inserisci la tua email.');
            return;
          }

          try {
            await sendPasswordResetEmail(auth, email);
            setResetMessage('Se l\'email è registrata, riceverai un link per reimpostare la password.');
            setMessage('Link per il reset password inviato (controlla la tua casella di posta).');
            setEmail(''); // Resetta il campo email
          } catch (error) {
            console.error("Errore durante il reset password:", error);
            let errorMessage = "Errore durante l'invio del link di reset. Riprova.";
            if (error.code === 'auth/invalid-email') {
              errorMessage = 'Indirizzo email non valido.';
            } else if (error.code === 'auth/user-not-found') {
              errorMessage = 'Utente non trovato con questa email.'; // Firebase non dovrebbe rivelare se l'email esiste per sicurezza
              setResetMessage('Se l\'email è registrata, riceverai un link per reimpostare la password.'); // Messaggio generico per sicurezza
            } else if (error.code === 'auth/missing-email') {
              errorMessage = 'Per favor, inserisci la tua email.';
            }
            setResetError(errorMessage);
            setMessage(errorMessage);
          }
        };

        return (
          <div className="p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto my-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Reimposta Password</h2>
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700">Indirizzo Email</label>
                <input type="email" id="resetEmail" value={email} onChange={(e) => setEmail(e.target.value)}
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              {resetError && <p className="text-red-500 text-xs mt-1">{resetError}</p>}
              {resetMessage && <p className="text-green-600 text-sm mt-1">{resetMessage}</p>}
              <button type="submit"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
                Invia Link di Reset
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => setView('login')}
                        className="text-sm text-gray-600 hover:text-gray-800 focus:outline-none">
                  Torna al Login
                </button>
              </div>
            </form>
          </div>
        );
      };


      // Componente del pannello di amministrazione (Superuser)
      const AdminPanel = () => {
        // Funzione per cambiare il ruolo di un utente
        const handleRoleChange = async (targetUserId, newRole) => {
          try {
            const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, targetUserId);
            await updateDoc(userDocRef, { role: newRole });
            setMessage(`Ruolo di ${targetUserId} aggiornato a ${newRole}.`);
          } catch (error) {
            console.error("Errore nell'aggiornamento del ruolo:", error);
            setMessage(`Errore nell'aggiornamento del ruolo: ${error.message}`);
          }
        };

        // Funzione per eliminare un utente
        const handleDeleteUser = async (targetUserId, userEmail) => {
          if (window.confirm(`Sei sicuro di voler eliminare l'utente ${userEmail} (${targetUserId})? Questa azione è irreversibile per i dati in Firestore.`)) {
            try {
              // Elimina il documento utente da Firestore
              const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, targetUserId);
              await deleteDoc(userDocRef);
              setMessage(`Utente ${userEmail} eliminato con successo dal database.`);
              // Nota: La cancellazione dell'account utente da Firebase Authentication
              // richiede un'operazione lato server (es. Firebase Cloud Function)
              // per motivi di sicurezza. Questa operazione elimina solo il record Firestore.
              console.warn("Nota: L'account utente in Firebase Authentication per", userEmail, "non è stato eliminato. Richiede una Cloud Function.");
            } catch (error) {
              console.error("Errore nell'eliminazione dell'utente:", error);
              setMessage(`Errore nell'eliminazione dell'utente: ${error.message}`);
            }
          }
        };


        return (
          <div className="p-8 bg-white rounded-xl shadow-lg max-w-4xl mx-auto my-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Pannello Superuser</h2>
            <p className="text-center text-gray-600 mb-4">
              ID Utente Corrente: <span className="font-mono bg-gray-100 p-1 rounded">{userId}</span> (Ruolo: <span className="font-semibold text-indigo-700">{userRole}</span>)
            </p>
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Gestione Utenti</h3>
            {usersData.length === 0 ? (
              <p className="text-gray-600">Nessun utente registrato o in attesa di approvazione.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID Utente (UID)
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ruolo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersData.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {user.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.nome} {user.cognome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'superuser' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                user.role === 'operatore' ? 'bg-green-100 text-green-800' : // Nuovo colore per operatore
                                user.role === 'utente' ? 'bg-indigo-100 text-indigo-800' : // Nuovo colore per utente
                                'bg-yellow-100 text-yellow-800' // pending
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {user.role !== 'superuser' && ( // Non permettere di cambiare il ruolo di un altro superuser
                                <>
                                  <button
                                    onClick={() => handleRoleChange(user.id, 'utente')}
                                    className="text-indigo-600 hover:text-indigo-900 mr-2"
                                    disabled={user.role === 'utente'}
                                  >
                                    Utente
                                  </button>
                                  <button
                                    onClick={() => handleRoleChange(user.id, 'operatore')}
                                    className="text-green-600 hover:text-green-900 mr-2"
                                    disabled={user.role === 'operatore'}
                                  >
                                    Operatore
                                  </button>
                                  <button
                                    onClick={() => handleRoleChange(user.id, 'admin')}
                                    className="text-blue-600 hover:text-blue-900 mr-2"
                                    disabled={user.role === 'admin'}
                                  >
                                    Admin
                                  </button>
                                  <button
                                    onClick={() => handleRoleChange(user.id, 'pending')}
                                    className="text-yellow-600 hover:text-yellow-900 mr-2"
                                    disabled={user.role === 'pending'}
                                  >
                                    Pending
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Elimina
                                  </button>
                                </>
                              )}
                              {user.role === 'superuser' && (
                                <span className="text-gray-500">Superuser</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          };

          // Componente della Home Page
          const HomePage = () => {
            return (
              <div className="p-8 bg-white rounded-xl shadow-lg max-w-xl mx-auto my-8 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Benvenuto nella tua App!</h2>
                {isAuthReady ? (
                  <>
                    
                    {userRole === 'generic' && (
                      <p className="text-gray-600 mb-4">
                        Sei un utente non registrato. Per accedere a più funzionalità, registrati o accedi!
                      </p>
                    )}
                    {userRole === 'pending' && (
                      <p className="text-yellow-600 mb-4">
                        La tua registrazione è in attesa di approvazione da parte di un amministratore.
                      </p>
                    )}
                    {userRole === 'utente' && ( // Aggiornato da 'registered' a 'utente'
                      <p className="text-indigo-600 mb-4">
                        Sei un utente registrato. Benvenuto!
                      </p>
                    )}

                    <div className="flex flex-col space-y-4 mt-6">
                      {userRole === 'generic' && (
                        <>
                          <button
                            onClick={() => setView('register')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-md shadow-md transition duration-150 ease-in-out text-lg"
                          >
                            Registrati
                          </button>
                          <button
                            onClick={() => setView('login')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md shadow-md transition duration-150 ease-in-out text-lg"
                          >
                            Accedi
                          </button>
                        </>
                      )}
                      {userRole !== 'generic' && ( // Mostra il pulsante logout se l'utente è autenticato (non generic)
                        <button
                          onClick={handleLogout}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-md shadow-md transition duration-150 ease-in-out text-lg"
                        >
                          Logout
                        </button>
                      )}
                      {userRole === 'superuser' && (
                        <button
                          onClick={() => setView('adminPanel')}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-md shadow-md transition duration-150 ease-in-out text-lg"
                        >
                          Vai al Pannello Superuser
                        </button>
                      )}
                      {/* Altri pulsanti per funzionalità future basate sui ruoli */}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">Caricamento autenticazione...</p>
                )}
              </div>
            );
          };

          return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center font-sans">
              <style>
                {`
                  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                  body { font-family: 'Inter', sans-serif; }
                `}
              </style>
              <div className="w-full max-w-6xl p-4">
                <nav className="flex justify-center space-x-4 mb-8">
                  <button
                    onClick={() => setView('home')}
                    className={`px-6 py-3 rounded-md text-lg font-medium transition duration-150 ease-in-out ${
                      view === 'home' ? 'bg-indigo-700 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    Home
                  </button>
                  {/* Pulsanti di navigazione per le nuove sezioni */}
                  {(userRole === 'generic' || userRole === 'utente' || userRole === 'operatore' || userRole === 'admin' || userRole === 'superuser') && (
                    <button
                      onClick={() => setView('calendar')}
                      className={`px-6 py-3 rounded-md text-lg font-medium transition duration-150 ease-in-out ${
                        view === 'calendar' ? 'bg-indigo-700 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      Calendario
                    </button>
                  )}
                  {(userRole === 'utente' || userRole === 'operatore' || userRole === 'admin' || userRole === 'superuser') && (
                    <button
                      onClick={() => setView('bookSpace')}
                      className={`px-6 py-3 rounded-md text-lg font-medium transition duration-150 ease-in-out ${
                        view === 'bookSpace' ? 'bg-indigo-700 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      Richiedi uno Spazio
                    </button>
                  )}
                  {(userRole === 'generic' || userRole === 'utente' || userRole === 'operatore' || userRole === 'admin' || userRole === 'superuser') && (
                    <button
                      onClick={() => setView('spacesInfo')}
                      className={`px-6 py-3 rounded-md text-lg font-medium transition duration-150 ease-in-out ${
                        view === 'spacesInfo' ? 'bg-indigo-700 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      Info Spazi
                    </button>
                  )}

                  {userRole === 'generic' && (
                    <>
                      <button
                        onClick={() => setView('register')}
                        className={`px-6 py-3 rounded-md text-lg font-medium transition duration-150 ease-in-out ${
                          view === 'register' ? 'bg-indigo-700 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        Registrazione
                      </button>
                      <button
                        onClick={() => setView('login')}
                        className={`px-6 py-3 rounded-md text-lg font-medium transition duration-150 ease-in-out ${
                          view === 'login' ? 'bg-blue-700 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        Accedi
                      </button>
                    </>
                  )}
                  {userRole !== 'generic' && ( // Mostra il pulsante logout nella nav se l'utente è autenticato (non generic)
                    <button
                      onClick={handleLogout}
                      className={`px-6 py-3 rounded-md text-lg font-medium transition duration-150 ease-in-out ${
                        view === 'logout' ? 'bg-red-700 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      Logout
                    </button>
                  )}
                  {userRole === 'superuser' && (
                    <button
                      onClick={() => setView('adminPanel')}
                      className={`px-6 py-3 rounded-md text-lg font-medium transition duration-150 ease-in-out ${
                        view === 'adminPanel' ? 'bg-indigo-700 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      Pannello Superuser
                    </button>
                  )}
                </nav>

                {message && (
                  <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4 max-w-2xl mx-auto" role="alert">
                    <strong className="font-bold">Info: </strong>
                    <span className="block sm:inline">{message}</span>
                    <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setMessage('')}>
                      <svg className="fill-current h-6 w-6 text-blue-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                    </span>
                  </div>
                )}

                {view === 'home' && <HomePage />}
                {view === 'register' && <RegistrationForm />}
                {view === 'login' && <LoginForm />}
                {view === 'forgotPassword' && <ForgotPasswordForm />}
                {view === 'adminPanel' && userRole === 'superuser' && <AdminPanel />}

                {/* Nuove sezioni con controllo dei ruoli */}
                {view === 'calendar' && (userRole === 'generic' || userRole === 'utente' || userRole === 'operatore' || userRole === 'admin' || userRole === 'superuser') && (
                  <Calendar onBack={() => setView('home')} userRole={userRole} userId={userId} />
                )}
                {view === 'bookSpace' && (userRole === 'utente' || userRole === 'operatore' || userRole === 'admin' || userRole === 'superuser') && (
                  <BookSpace onBack={() => setView('home')} userRole={userRole} userId={userId} />
                )}
                {view === 'spacesInfo' && (userRole === 'generic' || userRole === 'utente' || userRole === 'operatore' || userRole === 'admin' || userRole === 'superuser') && (
                  <SpacesInfo onBack={() => setView('home')} userRole={userRole} userId={userId} />
                )}

                {/* Messaggio di accesso negato per le sezioni protette */}
                {(view === 'bookSpace' && userRole === 'generic') && (
                  <div className="p-8 bg-red-100 border border-red-400 text-red-700 rounded-xl shadow-lg max-w-xl mx-auto my-8 text-center">
                    <p className="text-xl font-bold">Accesso Negato</p>
                    <p>Devi essere un utente registrato per richiedere uno spazio.</p>
                    <button onClick={() => setView('login')} className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Accedi o Registrati</button>
                  </div>
                )}
                {view === 'adminPanel' && userRole !== 'superuser' && (
                  <div className="p-8 bg-red-100 border border-red-400 text-red-700 rounded-xl shadow-lg max-w-xl mx-auto my-8 text-center">
                    <p className="text-xl font-bold">Accesso Negato</p>
                    <p>Non hai i permessi per accedere a questa sezione.</p>
                  </div>
                )}
              </div>
            </div>
          );
        }

        export default App;
    
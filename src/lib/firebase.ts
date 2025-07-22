    // Importa le funzioni necessarie dagli SDK necessari
    import { initializeApp } from "firebase/app";
    import { getFirestore } from "firebase/firestore";
    import { getAnalytics } from "firebase/analytics";
    import { getStorage } from "firebase/storage";
    import { getAuth } from "firebase/auth";

    // La configurazione Firebase della tua app web (domi-registration-app)
    // QUESTA DEVE ESSERE LA CONFIGURAZIONE ESATTA DEL TUO PROGETTO FIREBASE "domi-registration-app"
    const firebaseConfig = {
      apiKey: "AIzaSyA3Wtigmq3erjciNW3rkLTUqeOvEvOMyjs", // La tua chiave API per domi-registration-app
      authDomain: "domi-registration-app.firebaseapp.com", // Il tuo dominio di autenticazione per domi-registration-app
      projectId: "domi-registration-app", // Il tuo ID progetto per domi-registration-app
      storageBucket: "domi-registration-app.appspot.com", // Il tuo bucket di storage per domi-registration-app
      messagingSenderId: "361851772591", // Il tuo ID mittente per domi-registration-app
      appId: "1:361851772591:web:8b3a628db7243e7f0bfe5a", // Il tuo ID app per domi-registration-app
      measurementId: "G-WL4SW5NY31" // Il tuo ID misurazione per domi-registration-app
    };

    // Inizializza Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const analytics = getAnalytics(app);
    const storage = getStorage(app);
    const auth = getAuth(app);

    export { db, analytics, storage, auth };
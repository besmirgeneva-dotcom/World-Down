import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Fonction de récupération des variables d'environnement compatible Vite/Next/CRA
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key];
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  } catch (e) {}
  return undefined;
};

// Tentative de récupération des clés avec différents préfixes
const getVar = (base: string) => {
  const prefixes = ['VITE_', 'NEXT_PUBLIC_', 'REACT_APP_', ''];
  for (const prefix of prefixes) {
    const val = 
      // @ts-ignore
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`${prefix}${base}`]) ||
      (typeof process !== 'undefined' && process.env && process.env[`${prefix}${base}`]) ||
      getEnv(`${prefix}${base}`);
    if (val) return val;
  }
  return undefined;
};

const config = {
  apiKey: getVar('FIREBASE_API_KEY'),
  authDomain: getVar('FIREBASE_AUTH_DOMAIN'),
  projectId: getVar('FIREBASE_PROJECT_ID'),
  storageBucket: getVar('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getVar('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getVar('FIREBASE_APP_ID')
};

// Initialisation sécurisée
let app;
let authInstance;

const hasValidConfig = config.apiKey && config.projectId && config.authDomain;

if (hasValidConfig) {
  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    authInstance = getAuth(app);
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
} else {
  // Mode dégradé : on n'initialise pas Firebase si la config est incomplète
  // Cela permet à l'UI de gérer l'état "Non connecté / Config manquante" sans crasher
  console.warn("⚠️ Firebase Config manquante ou incomplète. Vérifiez vos variables d'environnement (VITE_FIREBASE_API_KEY, etc.) dans Vercel.");
  console.log("Config détectée:", {
    apiKey: config.apiKey ? 'OK' : 'MISSING',
    projectId: config.projectId ? 'OK' : 'MISSING',
    authDomain: config.authDomain ? 'OK' : 'MISSING'
  });
}

export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();
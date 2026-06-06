const FIREBASE_HOSTING_CONFIG = {
  apiKey: "AIzaSyAXH20HY1VDhyLTmohMsKp4n6utSeUEn98",
  authDomain: "kapital-app-prod.firebaseapp.com",
  projectId: "kapital-app-prod",
  storageBucket: "kapital-app-prod.firebasestorage.app",
  messagingSenderId: "777890091357",
  appId: "1:777890091357:web:ecd56c064e6a85ba6d18b4",
};

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || FIREBASE_HOSTING_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_HOSTING_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || FIREBASE_HOSTING_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || FIREBASE_HOSTING_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_HOSTING_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || FIREBASE_HOSTING_CONFIG.appId,
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

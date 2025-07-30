import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase config object (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyDRy1OHMOfh4kkfK33BUGXdl-Va30kQEfY",
  authDomain: "markt-1d79b.firebaseapp.com",
  projectId: "markt-1d79b",
  storageBucket: "markt-1d79b.firebasestorage.app",
  messagingSenderId: "563415829539",
  appId: "1:563415829539:web:b5cd28807fb030124b3596",
  measurementId: "G-BJPE9GL4FX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

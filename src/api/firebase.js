// src/api/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add your own Firebase configuration from your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyDnyhHbgcvO8bIUPUFpClJRIvns8UltDjM",
  authDomain: "campus-lost-and-found-641c1.firebaseapp.com",
  projectId: "campus-lost-and-found-641c1",
  storageBucket: "campus-lost-and-found-641c1.firebasestorage.app",
  messagingSenderId: "376648153941",
  appId: "1:376648153941:web:ee897a38b7089d41558ddc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
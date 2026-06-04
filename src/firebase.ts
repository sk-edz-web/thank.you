import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// User's provided official Firebase Web configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4FPU1uapSWjbpyR1Jjf854T7V4qMV-TM",
  authDomain: "skedz-a13eb.firebaseapp.com",
  databaseURL: "https://skedz-a13eb-default-rtdb.firebaseio.com",
  projectId: "skedz-a13eb",
  storageBucket: "skedz-a13eb.firebasestorage.app",
  messagingSenderId: "318431223204",
  appId: "1:318431223204:web:90f2205f22aebc341eb531",
  measurementId: "G-2NRVJY33M5"
};

// Initialize the Firebase client instance
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBJXB54XwegDDkJZWznPobnyhsAQwGhWOs",
  authDomain: "uranstream.firebaseapp.com",
  projectId: "uranstream",
  storageBucket: "uranstream.firebasestorage.app",
  messagingSenderId: "1068407622627",
  appId: "1:1068407622627:web:39122cbedf71fa5e012ed6",
  measurementId: "G-2NYKYNVZW7"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
// const analytics = getAnalytics(app);

export { app, auth, db };

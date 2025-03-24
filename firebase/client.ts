// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyAp1XCF1Pl5KtRkC5cnHbTwSht3_V4fR60",
  authDomain: "prepwise-d606f.firebaseapp.com",
  projectId: "prepwise-d606f",
  storageBucket: "prepwise-d606f.firebasestorage.app",
  messagingSenderId: "602727065293",
  appId: "1:602727065293:web:b5c4c6aacb5d67ca9a2b84",
  measurementId: "G-7L0VQEXG8D",
};

// Initialize Firebase ==>create the auth and db instance of the app using the getAuth and getFirestore
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);

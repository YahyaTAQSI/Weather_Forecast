// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCqpJcReEDSGjBYAMcl5btl7TYLMmVCFgw",
  authDomain: "overfloweather.firebaseapp.com",
  projectId: "overfloweather",
  storageBucket: "overfloweather.appspot.com",
  messagingSenderId: "412633441221",
  appId: "1:412633441221:web:e55c6c43fa0d1c6b4021ac",
  measurementId: "G-MD64M8VW9W",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };

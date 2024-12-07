import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDAfwq1AWR8r88RyiGXYsCgneHsa1uLXpY",
  authDomain: "coincraft-d1182.firebaseapp.com",
  databaseURL: "https://coincraft-d1182-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "coincraft-d1182",
  storageBucket: "coincraft-d1182.firebasestorage.app",
  messagingSenderId: "1011376641348",
  appId: "1:1011376641348:web:816f0849e75bf549d33311",
  measurementId: "G-M0E00ZZP69"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

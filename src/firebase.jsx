import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
  export const storage = getStorage(app);

  export { db };
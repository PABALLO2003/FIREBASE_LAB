import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";  


const firebaseConfig = {
  apiKey: "AIzaSyAJsngdwoNNf6sF7MFjUDyRC7Zi6C9GxXU",
  authDomain: "tmdblabfirebase.firebaseapp.com",
  projectId: "tmdblabfirebase",
  storageBucket: "tmdblabfirebase.firebasestorage.app",
  messagingSenderId: "1088107492561",
  appId: "1:1088107492561:web:fd25c9f2c353f891bcc1f0",
  measurementId: "G-GBRT1MNT7H"
};


const app = initializeApp(firebaseConfig);


const auth = getAuth(app);  


export { auth };
export default app;
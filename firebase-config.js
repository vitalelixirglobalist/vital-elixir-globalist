// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBsSrWpk0I6YnjNJcGRBnXg23WePsgdRx4",
  authDomain: "vital-elixir-globalist.firebaseapp.com",
  projectId: "vital-elixir-globalist",
  storageBucket: "vital-elixir-globalist.firebasestorage.app",
  messagingSenderId: "87028221342",
  appId: "1:87028221342:web:0c7719acc703566e8fc28f",
  measurementId: "G-5MWKWE2C4J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ---------------- Firebase Config ----------------

// Use stable Firebase CDN links
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAxXYe5Yzp1Pq100QhXzQll4OzOxz8zpGU",
    authDomain: "knowhub-14ae4.firebaseapp.com",
    databaseURL: "https://knowhub-14ae4-default-rtdb.firebaseio.com",
    projectId: "knowhub-14ae4",
    storageBucket: "knowhub-14ae4.appspot.com",
    messagingSenderId: "171652056361",
    appId: "1:171652056361:web:6d7ce96a5a1a043a412338"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js"
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js"
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js"
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js"







const firebaseConfig = {
    apiKey: "AIzaSyA8jIntV6p50gXBEFUFQZPyrnzTdcWz5sc",
    authDomain: "devtalk-planet.firebaseapp.com",
    projectId: "devtalk-planet",
    storageBucket: "devtalk-planet.firebasestorage.app",
    messagingSenderId: "503897798347",
    appId: "1:503897798347:web:05a53f471056a75c5d8d4e",
    measurementId: "G-10B0S8JZYK"
}

// Inicjalizacja
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
const storage = getStorage(app)
const db = getFirestore(app)

export { app, analytics,storage, ref, getDownloadURL, db, collection, getDocs }


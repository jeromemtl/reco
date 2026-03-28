/* -------------------- CONFIGURATION FIREBASE -------------------- */

const firebaseConfig = {
    apiKey: "AIzaSyBvMFa8D9FtOkirqyq4rNQ1etuw45v2BiU",
    authDomain: "recolement974.firebaseapp.com",
    projectId: "recolement974",
    storageBucket: "recolement974.firebasestorage.app",
    messagingSenderId: "940735072436",
    appId: "1:940735072436:web:bba1a5f9f724636cdbafe1",
    measurementId: "G-68GLWQQC9V"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const analytics = firebase.analytics();

// Exposer globalement
window.db = db;
window.firebaseApp = firebase.app();

console.log('✅ Firebase initialisé avec succès');
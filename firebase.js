// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyD2HByD6YHTXJEBdeIQZ1VWsejMkAUM_L8',
  authDomain: 'merchtrax-19931.firebaseapp.com',
  projectId: 'merchtrax-19931',
  storageBucket: 'merchtrax-19931.firebasestorage.app',
  messagingSenderId: '779649160924',
  appId: '1:779649160924:web:24f0f093b252f160514619',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };

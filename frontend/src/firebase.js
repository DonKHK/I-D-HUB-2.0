import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDocs, query, orderBy, onSnapshot, getDoc, serverTimestamp, writeBatch, where } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, signInAnonymously, sendPasswordResetEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDolg1uzL9ruBLsSrV7K5NwhpuBmqCa0SQ",
  authDomain: "id-hub-e6aea.firebaseapp.com",
  projectId: "id-hub-e6aea",
  storageBucket: "id-hub-e6aea.firebasestorage.app",
  messagingSenderId: "520174263680",
  appId: "1:520174263680:web:25b8d499cb829b78cab565",
  measurementId: "G-3CX3RWXHJH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDocs, query, orderBy, onSnapshot, getDoc, serverTimestamp, writeBatch, where, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, signInAnonymously, sendPasswordResetEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential };

export default app;
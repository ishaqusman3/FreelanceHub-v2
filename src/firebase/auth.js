// src/firebase/auth.js
import { auth } from './firebaseConfig';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

// Sign Up
export const signUp = async (email, password) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

// Log In
export const logIn = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// Google Sign-In
export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

// Log Out
export const logOut = async () => {
  return await signOut(auth);
};

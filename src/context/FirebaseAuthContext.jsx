import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { createWallet } from '../services/walletService';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';

const FirebaseAuthContext = createContext();

export const useAuth = () => useContext(FirebaseAuthContext);

export const FirebaseAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Sign up function for email/password
  const signUp = async (email, password, fullName, isAdmin = false) => {
    try {
      if (!fullName) {
        throw new Error('Full name is required.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user data to Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userData = {
        fullName,
        email,
        role: null,
        location: null,
        skills: '',
        isAdmin: isAdmin,
        createdAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userData);
      console.log('User document created');

      // Create wallet with better error handling
      try {
        const walletData = await createWallet(user.uid, fullName, email);
        console.log('Wallet created successfully:', walletData);
      } catch (walletError) {
        console.error('Error creating wallet:', walletError);
        // Don't throw here, allow signup to complete even if wallet creation fails
      }

      return userCredential;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Log in function for email/password
  const logIn = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Google sign-in function
  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Fetch or create user document in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const userData = {
        fullName: user.displayName || '',
        email: user.email,
        role: null,
        location: null,
        skills: null,
        isAdmin: false,
        createdAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userData);

      // Create wallet for Google sign-in users
      try {
        await createWallet(user.uid, user.displayName || '', user.email);
        console.log('Wallet created successfully for Google user:', user.displayName);
      } catch (error) {
        console.error('Error creating wallet for Google user:', error);
        throw new Error('Failed to create wallet.');
      }

      setUserData(userData);
      setIsAdmin(false);
      navigate('/profile-completion');
    } else {
      const existingUserData = userDoc.data();
      setUserData(existingUserData);
      setIsAdmin(existingUserData.isAdmin || false);
    }

    setCurrentUser(user);
  };

  // Log out function
  const logOut = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserData(null);
    setIsAdmin(false);
    navigate('/');
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email);
      setCurrentUser(user);
      
      if (user) {
        // Get real-time updates on user data
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const data = { id: doc.id, ...doc.data() };
            console.log("User data updated:", data);
            setUserData(data);
            setIsAdmin(data.isAdmin || false);
          }
        });

        // Initial fetch of user data
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = { id: userDoc.id, ...userDoc.data() };
          console.log("Initial user data:", data);
          setUserData(data);
          setIsAdmin(data.isAdmin || false);
        }

        setLoading(false);
        return () => unsubscribeUser();
      } else {
        setUserData(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkAdminStatus = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      return userDoc.exists() && userDoc.data().isAdmin === true;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const value = {
    currentUser,
    userData,
    isAdmin,
    loading,
    signUp,
    logIn,
    googleSignIn,
    logOut,
    checkAdminStatus,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {!loading && children}
    </FirebaseAuthContext.Provider>
  );
};

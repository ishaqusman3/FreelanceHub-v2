// src/pages/GoogleSignInHandler.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../firebase/auth';
import { getUserFromFirestore } from '../services/userService'; // To check if user data exists in Firestore

const GoogleSignInHandler = () => {
  const navigate = useNavigate();
  const [isNewUser, setIsNewUser] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const handleSignIn = async () => {
      try {
        const result = await signInWithGoogle();
        const user = result.user;

        console.log("Signed in with Google:", user);

        // Check if the user already exists in Firestore
        const existingUserData = await getUserFromFirestore(user.uid);
        
        if (!existingUserData) {
          // New Google user - no data in Firestore
          setIsNewUser(true);
          setUserInfo({ uid: user.uid, email: user.email });
        } else {
          // Existing user - redirect to home
          navigate('/home');
        }
      } catch (error) {
        console.error("Error during Google sign-in:", error);
      }
    };

    handleSignIn();
  }, [navigate]);

  // If the user is new, show the ProfileCompletion component
  return isNewUser ? (
    <ProfileCompletion uid={userInfo?.uid} email={userInfo?.email} />
  ) : (
    <p>Redirecting...</p>
  );
};

export default GoogleSignInHandler;

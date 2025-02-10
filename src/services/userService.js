// // // src/firebase/userService.js
import { db } from '../firebase/firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Add a new user to Firestore
 * @param {string} userId - The user's ID from Firebase Auth
 * @param {object} userData - The user data to store
 */
export const addUserToFirestore = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error adding user to Firestore:', error);
    throw error;
  }
};

/**
 * Get user data from Firestore
 * @param {string} userId - The user's ID
 */
export const getUserFromFirestore = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    return userDoc.data();
  } catch (error) {
    console.error('Error getting user from Firestore:', error);
    throw error;
  }
};

/**
 * Update user data in Firestore
 * @param {string} userId - The user's ID
 * @param {object} updateData - The data to update
 */
export const updateUserInFirestore = async (userId, updateData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user in Firestore:', error);
    throw error;
  }
};

/**
 * Fetch user stats from Firestore.
 * @param {string} uid - The user ID.
 * @returns {object} - The user's statistics.
 */
export const getUserStats = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  return {
    completedJobs: userDoc.data()?.completedJobs || 0,
    earnings: userDoc.data()?.earnings || 0,
    postedJobs: userDoc.data()?.postedJobs || 0,
    activeContracts: userDoc.data()?.activeContracts || 0,
  };
};

/**
 * Update user stats in Firestore.
 * @param {string} uid - The user ID.
 * @param {object} stats - The statistics to update.
 */
export const updateUserStats = async (uid, stats) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, stats);
};

/**
 * Get freelancer statistics from proposals.
 * @param {string} freelancerId - The freelancer's ID.
 * @returns {object} - Freelancer stats (e.g., completed jobs).
 */
export const getFreelancerStats = async (freelancerId) => {
  const proposalsRef = collection(db, 'proposals');
  const q = query(proposalsRef, where('freelancerId', '==', freelancerId), where('status', '==', 'completed'));
  const proposalsSnap = await getDocs(q);

  return {
    completedJobs: proposalsSnap.size, // Count completed jobs
  };
};

// /**
//  * Get client statistics from jobs.
//  * @param {string} clientId - The client's ID.
//  * @returns {object} - Client stats (e.g., active contracts).
//  */
// export const getClientStats = async (clientId) => {
//   const jobsRef = collection(db, 'jobs');
//   const q = query(jobsRef, where('clientId', '==', clientId), where('status', '==', 'active'));
//   const jobsSnap = await getDocs(q);

//   return {
//     activeContracts: jobsSnap.size, // Count active contracts
//   };
// };
/**
 * Get client statistics.
 * @param {string} clientId - The client ID.
 * @returns {object} - Client stats (e.g., posted jobs and active contracts).
 */
export const getClientStats = async (clientId) => {
  const jobsRef = collection(db, "jobs");

  // Fetch posted jobs
  const postedJobsQuery = query(jobsRef, where("clientId", "==", clientId));
  const postedJobsSnap = await getDocs(postedJobsQuery);

  // Fetch active contracts
  const activeContractsQuery = query(jobsRef, where("clientId", "==", clientId), where("status", "==", "active"));
  const activeContractsSnap = await getDocs(activeContractsQuery);

  return {
    postedJobs: postedJobsSnap.size, // Number of posted jobs
    activeContracts: activeContractsSnap.size, // Number of active contracts
  };
};
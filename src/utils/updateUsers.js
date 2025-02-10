import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const updateUserDocuments = async () => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);

    usersSnap.forEach(async (userDoc) => {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Default fields for freelancers
      const freelancerFields = {
        completedJobs: 0,
        earnings: 0,
      };

      // Default fields for clients
      const clientFields = {
        postedJobs: 0,
        activeContracts: 0,
      };

      const newFields =
        userData.role === 'freelancer' ? freelancerFields : clientFields;

      // Update Firestore document
      await updateDoc(doc(db, 'users', userId), newFields);
      console.log(`Updated user ${userId} with new fields.`);
    });
  } catch (err) {
    console.error('Error updating users:', err);
  }
};

// Execute the function
updateUserDocuments();

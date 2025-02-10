import { collection, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const addPostedAtToJobs = async () => {
  const jobsRef = collection(db, 'jobs');
  const jobSnapshot = await getDocs(jobsRef);

  jobSnapshot.forEach(async (jobDoc) => {
    const jobData = jobDoc.data();
    if (!jobData.postedAt) {
      // Add 'postedAt' field if it doesn't exist
      const jobRef = doc(db, 'jobs', jobDoc.id);
      await updateDoc(jobRef, { postedAt: serverTimestamp() });
      console.log(`Updated job: ${jobDoc.id}`);
    }
  });
};

addPostedAtToJobs();

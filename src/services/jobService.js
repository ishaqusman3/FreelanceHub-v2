import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, getDocs, doc, deleteDoc, getDoc, query, where, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';

/**
 * Create a new job in Firestore.
 * @param {object} jobData - The job data to store.
 * @returns {string} - The document ID of the new job.
 */
export const createJob = async (jobData) => {
  const clientWalletRef = doc(db, 'wallets', jobData.clientId);
  const clientWalletDoc = await getDoc(clientWalletRef);

  if (!clientWalletDoc.exists()) {
    throw new Error('Client wallet not found');
  }

  const clientBalance = clientWalletDoc.data().balance;
  if (clientBalance < jobData.budget) {
    throw new Error('Insufficient funds in wallet');
  }

  const jobRef = collection(db, 'jobs');
  const jobDoc = await addDoc(jobRef, {
    ...jobData,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    // durationInWeeks: jobData.durationInWeeks // Store job duration in weeks
    durationInWeeks: parseInt(jobData.duration, 10) // Ensure duration is stored as a number of weeks
  });
  return jobDoc.id;
}; 

/**
 * Complete a job.
 * @param {string} jobId - The ID of the job to complete.
 * @param {string} clientId - The ID of the client.
 * @returns {boolean} - True if the job was completed successfully, false otherwise.
 */
export const completeJob = async (jobId, clientId) => {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (!jobDoc.exists()) {
      throw new Error('Job not found');
    }

    const jobData = jobDoc.data();
    if (jobData.clientId !== clientId) {
      throw new Error('Only the client can mark the job as completed');
    }

    await runTransaction(db, async (transaction) => {
      // Update job status
      transaction.update(jobRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create completion activities for both parties
      const activitiesRef = collection(db, 'activities');
      
      // Client activity
      transaction.set(doc(activitiesRef), {
        userId: jobData.clientId,
        type: 'job_completed',
        text: `Job "${jobData.title}" has been completed`,
        icon: '✅',
        timestamp: serverTimestamp(),
        jobId
      });

      // Freelancer activity
      transaction.set(doc(activitiesRef), {
        userId: jobData.freelancerId,
        type: 'job_completed',
        text: `Completed job "${jobData.title}"`,
        icon: '✅',
        timestamp: serverTimestamp(),
        jobId
      });
    });

    return true;
  } catch (error) {
    console.error('Error completing job:', error);
    throw error;
  }
};

/**
 * Get all jobs from Firestore.
 * @returns {array} - An array of all job documents.
 */
export const getAllJobs = async () => {
  try {
    const jobRef = collection(db, 'jobs');
    const jobSnapshot = await getDocs(jobRef);
    
    // Map through jobs and format dates
    const jobs = jobSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Fix: Handle both array and string formats for technologies
        technologiesRequired: Array.isArray(data.technologiesRequired) 
          ? data.technologiesRequired 
          : data.technologiesRequired?.split(',').map(tech => tech.trim()) || [],
        // Fix: Properly handle timestamp conversions
        createdAt: data.createdAt?.toDate(),
        postedAt: data.postedAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        assignedAt: data.assignedAt?.toDate(),
        // Ensure these fields are always present
        status: data.status || 'open',
        freelancerName: data.freelancerName || 'Not Assigned',
        freelancerId: data.freelancerId || null,
        // Ensure budget is a number
        budget: parseFloat(data.budget) || 0
      };
    });

    // Sort jobs by posted date (newest first)
    return jobs.sort((a, b) => {
      const dateA = a.postedAt || a.createdAt;
      const dateB = b.postedAt || b.createdAt;
      return (dateB || 0) - (dateA || 0);
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error; // Changed to throw error instead of returning empty array
  }
};

/**
 * Delete a job from Firestore.
 * @param {string} jobId - The ID of the job to delete.
 */
export const deleteJob = async (jobId) => {
  const jobRef = doc(db, 'jobs', jobId);
  await deleteDoc(jobRef);
};

/**
 * Fetch jobs posted by a specific client.
 * @param {string} clientId - The ID of the client.
 * @returns {array} - An array of jobs posted by the client.
 */
export const getJobsByClient = async (clientId) => {
  const jobsRef = collection(db, 'jobs');
  const q = query(jobsRef, where('clientId', '==', clientId));
  const jobSnapshot = await getDocs(q);
  return jobSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetch a job by its ID.
 * @param {string} jobId - The ID of the job to fetch.
 * @returns {object} - The job data.
 */
export const getJobById = async (jobId) => {
  const jobRef = doc(db, 'jobs', jobId);
  const jobDoc = await getDoc(jobRef);
  if (!jobDoc.exists()) {
    throw new Error('Job not found');
  }
  return { id: jobDoc.id, ...jobDoc.data() };
};

/**
 * Fetch trending skills from job postings.
 * @returns {Array} - List of top trending skills.
 */
export const getTrendingSkills = async () => {
  try {
    const jobsRef = collection(db, 'jobs');
    const jobSnapshot = await getDocs(jobsRef);

    // Collect all technologies from job postings
    const skillCounts = {};
    jobSnapshot.docs.forEach((doc) => {
      const job = doc.data();
      const technologies = job.technologiesRequired || [];
      
      // Handle both array and string formats
      const techArray = Array.isArray(technologies) 
        ? technologies 
        : technologies.split(',').map(tech => tech.trim());

      techArray.forEach((tech) => {
        if (tech) {
          skillCounts[tech] = (skillCounts[tech] || 0) + 1;
        }
      });
    });

    // Sort skills by count and return top 10
    return Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({
        name: skill,
        count: count,
        percentage: Math.floor((count / jobSnapshot.size) * 100)
      }));
  } catch (error) {
    console.error('Error fetching trending skills:', error);
    return [];
  }
};

/**
 * Update a job with freelancer information when proposal is accepted
 */
export const assignFreelancerToJob = async (jobId, freelancerData) => {
  try {
    if (!freelancerData.freelancerId || !freelancerData.freelancerName) {
      throw new Error('Missing freelancer information');
    }

    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (!jobDoc.exists()) {
      throw new Error('Job not found');
    }

    const jobData = jobDoc.data();

    await runTransaction(db, async (transaction) => {
      // Update job status
      transaction.update(jobRef, {
        freelancerId: freelancerData.freelancerId,
        freelancerName: freelancerData.freelancerName,
        status: 'in_progress',
        updatedAt: serverTimestamp(),
        assignedAt: serverTimestamp(),
        contractStatus: 'active'
      });

      // Create activity for both client and freelancer
      const activitiesRef = collection(db, 'activities');
      
      // Client activity
      transaction.set(doc(activitiesRef), {
        userId: jobData.clientId,
        type: 'contract_started',
        text: `Started contract with ${freelancerData.freelancerName} for job "${jobData.title}"`,
        icon: '🤝',
        timestamp: serverTimestamp(),
        jobId
      });

      // Freelancer activity
      transaction.set(doc(activitiesRef), {
        userId: freelancerData.freelancerId,
        type: 'contract_started',
        text: `Started contract for job "${jobData.title}"`,
        icon: '🤝',
        timestamp: serverTimestamp(),
        jobId
      });
    });

    return true;
  } catch (error) {
    console.error('Error assigning freelancer to job:', error);
    throw error;
  }
};

/**
 * Update the status of a job.
 * @param {string} jobId - The ID of the job to update.
 * @param {string} status - The new status of the job.
 */
export const updateJobStatus = async (jobId, status) => {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, {
      status,
      updatedAt: serverTimestamp(),
      ...(status === 'in_progress' ? { startedAt: serverTimestamp() } : {}),
      ...(status === 'completed' ? { completedAt: serverTimestamp() } : {})
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
};
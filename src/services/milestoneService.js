import { db } from '../firebase/firebaseConfig';
import { 
  collection, 
  doc, 
  getDocs,
  getDoc,
  updateDoc,
  addDoc,
  increment,
  runTransaction,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { completeJob } from './jobService';
import { createActivity } from './activityService';

/**
 * Create milestones for a job based on freelancer's proposal.
 */
export const createMilestones = async (jobId, proposalData) => {
  try {
    const batch = writeBatch(db);
    const milestonesRef = collection(db, `jobs/${jobId}/milestones`);

    if (proposalData.paymentPreference === 'per_milestone' && proposalData.milestones?.length > 0) {
      // Create multiple milestones based on proposal data
      proposalData.milestones.forEach((milestone, index) => {
        const newMilestoneRef = doc(milestonesRef);
        batch.set(newMilestoneRef, {
          name: milestone.name,
          description: milestone.description,
          amount: parseFloat(milestone.amount),
          duration: parseInt(milestone.duration),
          status: 'pending',
          progress: 0,
          startDate: null,
          completedAt: null,
          attachments: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
    } else {
      // Create a single milestone for completion payment
      const newMilestoneRef = doc(milestonesRef);
      batch.set(newMilestoneRef, {
        name: 'Project Completion',
        description: 'Full payment upon project completion',
        amount: parseFloat(proposalData.proposedAmount),
        duration: parseInt(proposalData.completionDate),
        status: 'pending',
        progress: 0,
        startDate: null,
        completedAt: null,
        attachments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error creating milestones:', error);
    throw error;
  }
}

/**
 * Fetch milestones for a specific job.
 * @param {string} jobId - The ID of the job.
 * @returns {Promise<Array>} - List of milestones.
 */
export const getMilestones = async (jobId) => {
  try {
    const milestonesRef = collection(db, `jobs/${jobId}/milestones`);
    const snapshot = await getDocs(milestonesRef);

    // Return empty array instead of throwing error when no milestones exist
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching milestones:', error);
    throw error;
  }
}

/**
 * Update a milestone's status or other fields.
 * @param {string} jobId - The ID of the job.
 * @param {string} milestoneId - The ID of the milestone.
 * @param {Object} updateData - Data to update (e.g., { status: "completed" }).
 */
export const updateMilestone = async (jobId, milestoneId, updateData) => {
  const milestoneRef = doc(db, `jobs/${jobId}/milestones/${milestoneId}`);
  await updateDoc(milestoneRef, updateData);
}

/**
 * Pay a milestone.
 */
export const payMilestone = async (jobId, milestoneId, clientId, freelancerId, paymentAmount, paymentOption) => {
  try {
    const clientWalletRef = doc(db, 'wallets', clientId);
    const freelancerWalletRef = doc(db, 'wallets', freelancerId);
    const milestoneRef = doc(db, `jobs/${jobId}/milestones/${milestoneId}`);

    await runTransaction(db, async (transaction) => {
      // Get current wallet states
      const clientWallet = await transaction.get(clientWalletRef);
      const freelancerWallet = await transaction.get(freelancerWalletRef);
      const milestone = await transaction.get(milestoneRef);

      if (!clientWallet.exists()) throw new Error('Client wallet not found');
      if (!freelancerWallet.exists()) throw new Error('Freelancer wallet not found');
      if (!milestone.exists()) throw new Error('Milestone not found');

      const clientBalance = clientWallet.data().balance;
      if (clientBalance < paymentAmount) {
        throw new Error('Insufficient balance');
      }

      // Update balances
      transaction.update(clientWalletRef, {
        balance: increment(-paymentAmount),
        updatedAt: serverTimestamp()
      });

      transaction.update(freelancerWalletRef, {
        balance: increment(paymentAmount),
        totalEarnings: increment(paymentAmount),
        updatedAt: serverTimestamp()
      });

      // Mark milestone as paid
      transaction.update(milestoneRef, {
        isPaid: true,
        paidAt: serverTimestamp(),
        status: 'completed',
        paymentOption // Store the payment option chosen by the freelancer
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Error paying milestone:', error);
    throw error;
  }
};

/**
 * Add a new milestone to a job.
 * @param {string} jobId - The ID of the job.
 * @param {Object} milestoneData - Milestone details (name, description, dueDate, payment, etc.).
 */
export const addMilestone = async (jobId, milestoneData) => {
  const milestonesRef = collection(db, `jobs/${jobId}/milestones`);
  await addDoc(milestonesRef, milestoneData);
};

export const checkJobCompletion = async (jobId) => {
  try {
    const milestones = await getMilestones(jobId);
    const allCompleted = milestones.every(milestone => 
      milestone.status === 'completed' && milestone.isPaid
    );

    if (allCompleted) {
      const jobRef = doc(db, 'jobs', jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }

      const jobData = jobDoc.data();

      await runTransaction(db, async (transaction) => {
        // Update job status and add review fields
        transaction.update(jobRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          pendingReviews: ['client', 'freelancer'], // Track who needs to submit reviews
          reviews: {} // Will store both reviews
        });

        // Create completion activities
        const activitiesRef = collection(db, 'activities');
        
        // Client activity
        transaction.set(doc(activitiesRef), {
          userId: jobData.clientId,
          type: 'job_completed',
          text: `All milestones completed for "${jobData.title}". Please leave a review.`,
          icon: '🎉',
          timestamp: serverTimestamp(),
          jobId
        });

        // Freelancer activity
        transaction.set(doc(activitiesRef), {
          userId: jobData.freelancerId,
          type: 'job_completed',
          text: `Completed all milestones for "${jobData.title}". Please leave a review.`,
          icon: '🎉',
          timestamp: serverTimestamp(),
          jobId
        });
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking job completion:', error);
    throw error;
  }
};

// Complete a milestone and check job completion
export const completeMilestone = async (jobId, milestoneId, clientId) => {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const milestoneRef = doc(db, `jobs/${jobId}/milestones/${milestoneId}`);

    await runTransaction(db, async (transaction) => {
      const jobDoc = await transaction.get(jobRef);
      const milestoneDoc = await transaction.get(milestoneRef);

      if (!jobDoc.exists()) throw new Error('Job not found');
      if (!milestoneDoc.exists()) throw new Error('Milestone not found');

      const jobData = jobDoc.data();
      const milestoneData = milestoneDoc.data();

      // Only client can complete milestones
      if (jobData.clientId !== clientId) {
        throw new Error('Only the client can complete milestones');
      }

      // Check if milestone is already completed
      if (milestoneData.status === 'completed') {
        throw new Error('Milestone is already completed');
      }

      // Update milestone status
      transaction.update(milestoneRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      // Create activity record
      await createActivity({
        type: 'milestone_completed',
        jobId,
        milestoneId,
        clientId,
        freelancerId: jobData.freelancerId,
        amount: milestoneData.amount,
        timestamp: serverTimestamp()
      });

      // If payment preference is per_milestone, release payment
      if (jobData.paymentPreference === 'per_milestone') {
        await releaseMilestonePayment(transaction, jobId, milestoneId, clientId, jobData.freelancerId, milestoneData.amount);
      }

      // Check if this was the last milestone
      const allMilestones = await getMilestones(jobId);
      const allCompleted = allMilestones.every(m => m.status === 'completed');
      
      if (allCompleted) {
        // Complete the job if all milestones are done
        await completeJob(jobId, clientId);
        
        // If payment is at completion, release full payment
        if (jobData.paymentPreference === 'at_completion') {
          await releaseMilestonePayment(transaction, jobId, milestoneId, clientId, jobData.freelancerId, jobData.amount);
        }
      }
    });
  } catch (error) {
    console.error('Error completing milestone:', error);
    throw error;
  }
}

// Update submitJobReview to handle transaction reads before writes
export const submitJobReview = async (jobId, reviewerId, reviewData) => {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    
    await runTransaction(db, async (transaction) => {
      // Do all reads first
      const jobDoc = await transaction.get(jobRef);
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }

      const jobData = jobDoc.data();
      const reviewerRole = reviewerId === jobData.clientId ? 'client' : 'freelancer';
      const revieweeId = reviewerId === jobData.clientId ? jobData.freelancerId : jobData.clientId;

      // Get user data for rating calculation
      const userRef = doc(db, 'users', revieweeId);
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data();

      // Calculate new rating
      const currentRating = userData.rating || 0;
      const totalReviews = userData.totalReviews || 0;
      const newRating = ((currentRating * totalReviews) + reviewData.rating) / (totalReviews + 1);

      // After all reads, perform writes
      transaction.update(jobRef, {
        [`reviews.${reviewerRole}`]: {
          rating: reviewData.rating,
          comment: reviewData.comment,
          createdAt: serverTimestamp()
        },
        pendingReviews: jobData.pendingReviews.filter(role => role !== reviewerRole)
      });

      // Update user profile
      transaction.update(userRef, {
        rating: newRating,
        totalReviews: totalReviews + 1,
        updatedAt: serverTimestamp()
      });

      // Create review activity
      const activitiesRef = collection(db, 'activities');
      transaction.set(doc(activitiesRef), {
        userId: revieweeId,
        type: 'review_received',
        text: `Received a ${reviewData.rating}-star review for "${jobData.title}"`,
        icon: '⭐',
        timestamp: serverTimestamp(),
        jobId
      });
    });

    return true;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

/**
 * Complete a job and release escrow to freelancer.
 * @param {string} jobId - The ID of the job.
 * @param {string} clientId - The ID of the client.
 */
export const completeMilestoneJob = async (jobId, clientId) => {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (!jobDoc.exists() || jobDoc.data().clientId !== clientId) {
      throw new Error('Unauthorized');
    }

    // Release escrow to freelancer
    const escrowRef = doc(db, 'escrow', jobId);
    const escrowDoc = await getDoc(escrowRef);
    
    if (escrowDoc.exists()) {
      const {amount} = escrowDoc.data();
      
      // Transfer to freelancer wallet
      await updateWalletBalance(jobDoc.data().freelancerId, amount);
      
      // Mark escrow as released
      await updateDoc(escrowRef, {
        status: 'released',
        releasedAt: serverTimestamp()
      });
    }

    // Mark job as complete
    await updateDoc(jobRef, {
      status: 'completed',
      completedAt: serverTimestamp() 
    });

  } catch (error) {
    throw error;
  }
};

// Helper function to release milestone payment
const releaseMilestonePayment = async (transaction, jobId, milestoneId, clientId, freelancerId, amount) => {
  try {
    const clientWalletRef = doc(db, 'wallets', clientId);
    const freelancerWalletRef = doc(db, 'wallets', freelancerId);
    const milestoneRef = doc(db, `jobs/${jobId}/milestones/${milestoneId}`);

    // Get current wallet states
    const clientWallet = await transaction.get(clientWalletRef);
    const freelancerWallet = await transaction.get(freelancerWalletRef);
    const milestone = await transaction.get(milestoneRef);

    if (!clientWallet.exists()) throw new Error('Client wallet not found');
    if (!freelancerWallet.exists()) throw new Error('Freelancer wallet not found');
    if (!milestone.exists()) throw new Error('Milestone not found');

    const clientBalance = clientWallet.data().balance;
    if (clientBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Update balances
    transaction.update(clientWalletRef, {
      balance: increment(-amount),
      updatedAt: serverTimestamp()
    });

    transaction.update(freelancerWalletRef, {
      balance: increment(amount),
      totalEarnings: increment(amount),
      updatedAt: serverTimestamp()
    });

    // Mark milestone as paid
    transaction.update(milestoneRef, {
      isPaid: true,
      paidAt: serverTimestamp(),
      status: 'completed'
    });
  } catch (error) {
    console.error('Error releasing milestone payment:', error);
    throw error;
  }
};
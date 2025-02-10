import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, serverTimestamp, runTransaction, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { createMilestones } from './milestoneService';
import { assignFreelancerToJob } from './jobService';

/**
 * Fetch proposals for a freelancer.
 * @param {string} freelancerId - The freelancer's ID.
 * @returns {Array} - List of proposals.
 */
export const getProposalsByFreelancer = async (freelancerId) => {
  const proposalsRef = collection(db, 'proposals');
  const q = query(proposalsRef, where('freelancerId', '==', freelancerId));
  const proposalSnap = await getDocs(q);
  return proposalSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Submit a proposal for a job.
 * @param {object} proposal - Proposal data.
 * @returns {string} - The document ID of the new proposal.
 */
export const createProposal = async (proposal) => {
  if (!proposal.freelancerId || !proposal.jobId) {
    throw new Error('Invalid proposal data: freelancerId or jobId is missing.');
  }

  // Validate payment preference
  if (!['per_milestone', 'completion'].includes(proposal.paymentPreference)) {
    throw new Error('Invalid payment preference');
  }

  // Validate milestones if payment preference is per_milestone
  if (proposal.paymentPreference === 'per_milestone') {
    if (!proposal.milestones || proposal.milestones.length === 0) {
      throw new Error('Milestones are required for per-milestone payment');
    }

    const totalMilestoneAmount = proposal.milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
    if (totalMilestoneAmount !== parseFloat(proposal.proposedAmount)) {
      throw new Error('Total milestone amounts must equal the proposed amount');
    }
  }

  const jobRef = doc(db, 'jobs', proposal.jobId);
  const jobDoc = await getDoc(jobRef);

  if (!jobDoc.exists()) {
    throw new Error('Job does not exist.');
  }

  const jobData = jobDoc.data();

  if (!jobData.clientId) {
    throw new Error('Job is missing clientId.');
  }

  const proposalsRef = collection(db, 'proposals');
  const proposalDoc = await addDoc(proposalsRef, {
    ...proposal,
    clientId: jobData.clientId,
    status: 'pending',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    proposedAmount: parseFloat(proposal.proposedAmount) || 0,
    // completionDate: proposal.completionDate ? new Date(proposal.completionDate) : null,
    completionDate: proposal.completionDate,
    paymentPreference: proposal.paymentPreference,
    milestones: proposal.paymentPreference === 'per_milestone' ? proposal.milestones : []
  });

  return proposalDoc.id;
};

/**
 * Fetch proposals for a specific job.
 * @param {string} jobId - The job's ID.
 * @returns {Array} - List of proposals.
 */
export const getProposalsByJob = async (jobId) => {
  const proposalsRef = collection(db, 'proposals');
  const q = query(proposalsRef, where('jobId', '==', jobId));
  const proposalSnap = await getDocs(q);
  return proposalSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Decline a proposal.
 * @param {string} proposalId - The proposal's ID.
 */
export const declineProposal = async (proposalId) => {
  const proposalRef = doc(db, 'proposals', proposalId);
  await updateDoc(proposalRef, { status: 'declined' });
};

/**
 * Accept a proposal and update job
 */
export const acceptProposal = async (proposalId, jobId) => {
  try {
    const batch = writeBatch(db);
    
    // Get all proposals for this job
    const proposalsRef = collection(db, 'proposals');
    const q = query(proposalsRef, where('jobId', '==', jobId));
    const proposalsSnapshot = await getDocs(q);
    
    // Get the accepted proposal
    const acceptedProposal = proposalsSnapshot.docs.find(doc => doc.id === proposalId);
    if (!acceptedProposal) {
      throw new Error('Proposal not found');
    }

    const proposalData = acceptedProposal.data();

    // Create escrow document
    const escrowRef = doc(db, 'escrow', jobId);
    batch.set(escrowRef, {
      amount: parseFloat(proposalData.proposedAmount),
      status: 'held',
      clientId: proposalData.clientId,
      freelancerId: proposalData.freelancerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Update the accepted proposal
    const acceptedProposalRef = doc(db, 'proposals', proposalId);
    batch.update(acceptedProposalRef, {
      status: 'accepted',
      updatedAt: serverTimestamp()
    });

    // Update job with proposal details
    const jobRef = doc(db, 'jobs', jobId);
    batch.update(jobRef, {
      status: 'in_progress',
      awardedTo: proposalData.freelancerId,
      acceptedAmount: proposalData.proposedAmount,
      acceptedDuration: proposalData.completionDate,
      paymentPreference: proposalData.paymentPreference || 'at_completion',
      milestones: proposalData.milestones || [],
      updatedAt: serverTimestamp()
    });

    // Reject all other proposals
    proposalsSnapshot.docs.forEach(proposalDoc => {
      if (proposalDoc.id !== proposalId) {
        const proposalRef = doc(db, 'proposals', proposalDoc.id);
        batch.update(proposalRef, {
          status: 'rejected',
          updatedAt: serverTimestamp()
        });
      }
    });

    // Commit all updates
    await batch.commit();

    // Create milestones after batch commit
    await createMilestones(jobId, proposalData);

    return true;
  } catch (error) {
    console.error('Error accepting proposal:', error);
    throw error;
  }
};

/**
 * Update the status of a proposal
 * @param {string} proposalId - The ID of the proposal to update
 * @param {string} status - The new status ('pending', 'accepted', 'rejected', 'withdrawn')
 */
export const updateProposalStatus = async (proposalId, status) => {
  try {
    const proposalRef = doc(db, 'proposals', proposalId);
    const proposalDoc = await getDoc(proposalRef);
    
    if (!proposalDoc.exists()) {
      throw new Error('Proposal not found');
    }

    await updateDoc(proposalRef, {
      status,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error updating proposal status:', error);
    throw error;
  }
};

/**
 * Get all proposals for the current user (both as freelancer and client)
 * @param {string} userId - The user's ID
 * @returns {Array} - List of proposals
 */
export const getMyProposals = async (userId) => {
  try {
    const proposalsRef = collection(db, 'proposals');
    const freelancerQuery = query(proposalsRef, where('freelancerId', '==', userId));
    const clientQuery = query(proposalsRef, where('clientId', '==', userId));

    const [freelancerSnap, clientSnap] = await Promise.all([
      getDocs(freelancerQuery),
      getDocs(clientQuery)
    ]);

    const proposals = [
      ...freelancerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...clientSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];

    // Sort by submission date (newest first)
    return proposals.sort((a, b) => {
      const dateA = a.submittedAt?.toDate() || 0;
      const dateB = b.submittedAt?.toDate() || 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    throw error;
  }
};
import { db } from '../firebase/firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  increment,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { createActivity } from './activityService';
import { showNotification } from '../utils/notification';

export const createEscrow = async (jobId, amount, clientId, freelancerId) => {
  try {
    const batch = writeBatch(db);
    
    // Create escrow document
    const escrowRef = doc(db, 'escrow', jobId);
    batch.set(escrowRef, {
      amount: parseFloat(amount),
      status: 'held',
      clientId,
      freelancerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Deduct from client's wallet
    const clientWalletRef = doc(db, 'wallets', clientId);
    batch.update(clientWalletRef, {
      balance: increment(-parseFloat(amount))
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error creating escrow:', error);
    throw error;
  }
};

export const releaseMilestonePayment = async (jobId, milestoneId, amount, clientId, freelancerId) => {
  try {
    const batch = writeBatch(db);
    
    // Update escrow amount
    const escrowRef = doc(db, 'escrow', jobId);
    const escrowDoc = await getDoc(escrowRef);
    
    if (!escrowDoc.exists()) {
      throw new Error('Escrow not found');
    }

    const escrowData = escrowDoc.data();
    const remainingAmount = escrowData.amount - parseFloat(amount);

    batch.update(escrowRef, {
      amount: remainingAmount,
      updatedAt: serverTimestamp()
    });

    // Add to freelancer's wallet
    const freelancerWalletRef = doc(db, 'wallets', freelancerId);
    batch.update(freelancerWalletRef, {
      balance: increment(parseFloat(amount))
    });

    // Update milestone payment status
    const milestoneRef = doc(db, `jobs/${jobId}/milestones/${milestoneId}`);
    batch.update(milestoneRef, {
      paymentStatus: 'paid',
      paidAt: serverTimestamp()
    });

    await batch.commit();

    // Create activities for both parties
    await Promise.all([
      createActivity({
        userId: clientId,
        type: 'milestone_payment_sent',
        text: `Payment of ₦${amount} released for milestone`,
        icon: '💰',
        jobId,
        freelancerId,
        amount: parseFloat(amount),
        timestamp: serverTimestamp()
      }),
      createActivity({
        userId: freelancerId,
        type: 'milestone_payment_received',
        text: `Received payment of ₦${amount} for milestone`,
        icon: '💰',
        jobId,
        clientId,
        amount: parseFloat(amount),
        timestamp: serverTimestamp()
      })
    ]);

    return true;
  } catch (error) {
    console.error('Error releasing milestone payment:', error);
    throw error;
  }
};

export const releaseJobPayment = async (jobId, amount, clientId, freelancerId) => {
  try {
    const batch = writeBatch(db);
    
    // Release full escrow amount
    const escrowRef = doc(db, 'escrow', jobId);
    batch.update(escrowRef, {
      amount: 0,
      status: 'released',
      updatedAt: serverTimestamp()
    });

    // Add to freelancer's wallet
    const freelancerWalletRef = doc(db, 'wallets', freelancerId);
    batch.update(freelancerWalletRef, {
      balance: increment(parseFloat(amount))
    });

    // Update job payment status
    const jobRef = doc(db, 'jobs', jobId);
    batch.update(jobRef, {
      paymentStatus: 'paid',
      paidAt: serverTimestamp()
    });

    await batch.commit();

    // Create activities for both parties
    await Promise.all([
      createActivity({
        userId: clientId,
        type: 'job_payment_sent',
        text: `Full payment of ₦${amount} released for completed job`,
        icon: '💰',
        jobId,
        freelancerId,
        amount: parseFloat(amount),
        timestamp: serverTimestamp()
      }),
      createActivity({
        userId: freelancerId,
        type: 'job_payment_received',
        text: `Received full payment of ₦${amount} for completed job`,
        icon: '💰',
        jobId,
        clientId,
        amount: parseFloat(amount),
        timestamp: serverTimestamp()
      })
    ]);

    return true;
  } catch (error) {
    console.error('Error releasing job payment:', error);
    throw error;
  }
};
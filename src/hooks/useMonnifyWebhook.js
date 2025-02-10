import { useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { showNotification } from '../utils/notification';

export const useMonnifyWebhook = () => {
  const handlePaymentWebhook = async (webhookData) => {
    const {
      transactionReference,
      paymentReference,
      amountPaid,
      paidOn,
      paymentStatus,
      paymentDescription,
      transactionHash,
      currency,
      paymentMethod,
      customer: { email }
    } = webhookData;

    try {
      if (paymentStatus === 'PAID') {
        // Get user by email
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('email', '==', email));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
          throw new Error('User not found');
        }

        const userId = userSnapshot.docs[0].id;

        // Update wallet balance
        const walletRef = doc(db, 'wallets', userId);
        await updateDoc(walletRef, {
          balance: increment(amountPaid),
          updatedAt: serverTimestamp()
        });

        // Record transaction
        await addDoc(collection(db, 'transactions'), {
          userId,
          type: 'deposit',
          amount: amountPaid,
          currency,
          paymentMethod,
          reference: paymentReference,
          status: 'completed',
          description: paymentDescription || 'Wallet funding',
          createdAt: serverTimestamp()
        });

        showNotification.success('Payment successful');
        return true;
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      showNotification.error('Failed to process payment');
      throw error;
    }
  };

  return { handlePaymentWebhook };
};

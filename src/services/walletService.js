import { db } from '../firebase/firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  increment,
  query,
  where,
  getDocs,
  runTransaction,
} from 'firebase/firestore';
const MONNIFY_API_KEY = import.meta.env.VITE_MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = import.meta.env.VITE_MONNIFY_SECRET_KEY;
const MONNIFY_CONTRACT_CODE = import.meta.env.VITE_MONNIFY_CONTRACT_CODE;
const MONNIFY_BASE_URL = import.meta.env.VITE_MONNIFY_BASE_URL;
const MONNIFY_MERCHANT_ACCOUNT = import.meta.env.VITE_MONNIFY_MERCHANT_ACCOUNT;
// /**
//  * Create a new wallet for a user
//  * @param {string} userId - User's ID
//  * @param {string} fullName - User's full name
//  * @param {string} email - User's email
//  */
// export const createWallet = async (userId, fullName, email) => {
//   try {
/**
 * Create a new wallet for a user
 * @param {string} userId - User's ID
 * @param {string} fullName - User's full name
 * @param {string} email - User's email
 */
/** */
        
export const createWallet = async (userId, fullName, email) => {
  try {
    console.log('Creating wallet for:', { userId, fullName, email });
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);

    if (walletDoc.exists()) {
      console.log('Wallet already exists:', walletDoc.data());
      return walletDoc.data();
    }

    // Generate a default 10-digit account number
    const defaultAccountNumber = `2${Date.now().toString().slice(-9)}`;

    // Create basic wallet first
    const basicWalletData = {
      userId,
      fullName,
      email,
      balance: 0,
      accountNumber: defaultAccountNumber,
      bankName: 'Virtual Bank',
      accountReference: `REF-${userId}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
      totalEarnings: 0,
      totalWithdrawals: 0
    };

    // Save basic wallet first
    await setDoc(walletRef, basicWalletData);
    console.log('Basic wallet created');

    try {
      // Get Monnify access token
      const token = await generateMonnifyToken();
      console.log('Monnify token generated');
      
      // Create reserved account
      const accountData = await reserveMonnifyAccount(token, userId, fullName, email);
      console.log('Monnify account response:', accountData);
      
      if (accountData.requestSuccessful && accountData.responseBody) {
        const accountDetails = accountData.responseBody;
        
        // Update wallet with Monnify details
        const updatedWalletData = {
          ...basicWalletData,
          accountNumber: accountDetails.accountNumber,
          bankName: accountDetails.bankName,
          accountReference: accountDetails.accountReference,
          monnifyDetails: accountDetails
        };

        await setDoc(walletRef, updatedWalletData);
        console.log('Wallet updated with Monnify details');
        return updatedWalletData;
      }
    } catch (monnifyError) {
      console.error('Monnify integration failed:', monnifyError);
      // Return basic wallet if Monnify integration fails
      return basicWalletData;
    }

    return basicWalletData;
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw error;
  }
};

/**
 * Generate Monnify authentication token
 */
const generateMonnifyToken = async () => {
  try {
    const credentials = `${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`;
    const encodedCredentials = btoa(credentials);

    const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`
      }
    });

    const data = await response.json();
    if (!data.requestSuccessful) {
      throw new Error(data.responseMessage || 'Failed to generate token');
    }
    return data.responseBody.accessToken;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

/**
 * Reserve Monnify account
 */
const reserveMonnifyAccount = async (token, userId, fullName, email) => {
  try {
    const response = await fetch(`${MONNIFY_BASE_URL}/api/v2/bank-transfer/reserved-accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountReference: userId,
        accountName: fullName,
        customerEmail: email,
        customerName: fullName,
        currencyCode: 'NGN',
        contractCode: MONNIFY_CONTRACT_CODE,
        getAllAvailableBanks: false,
        preferredBanks: ['035'] // Wema bank code
      })
    });

    const data = await response.json();
    console.log('Monnify Account Creation Response:', data);
    return data;
  } catch (error) {
    console.error('Error reserving Monnify account:', error);
    throw error;
  }
};

/**
 * Initialize payment
 */
export const initializePayment = async ({ amount, userId, email }) => {
  try {
    const token = await generateMonnifyToken();
    const reference = `PAY-${Date.now()}-${userId}`;

    const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        customerName: email,
        customerEmail: email,
        paymentReference: reference,
        paymentDescription: 'Wallet funding',
        currencyCode: 'NGN',
        contractCode: MONNIFY_CONTRACT_CODE,
        redirectUrl: `${window.location.origin}/payment-callback`,
        paymentMethods: ['CARD', 'ACCOUNT_TRANSFER']
      })
    });

    const data = await response.json();
    
    if (!data.requestSuccessful) {
      throw new Error(data.responseMessage);
    }

    // Save payment intent
    await addDoc(collection(db, 'paymentIntents'), {
      userId,
      reference,
      amount,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    return {
      checkoutUrl: data.responseBody.checkoutUrl,
      reference
    };
  } catch (error) {
    console.error('Error initializing payment:', error);
    throw error;
  }
};

/**
 * Get wallet balance
 * @param {string} userId - User's ID
 */
export const getWalletBalance = async (userId) => {
  try {
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);

    if (!walletDoc.exists()) {
      throw new Error('Wallet not found');
    }

    return walletDoc.data().balance;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw error;
  }
};

/**
 * Update wallet balance
 * @param {string} userId - User's ID
 * @param {number} amount - Amount to add/subtract
 * @param {string} type - Transaction type
 */
export const updateWalletBalance = async (userId, amount, type) => {
  try {
    const walletRef = doc(db, 'wallets', userId);
    
    await updateDoc(walletRef, {
      balance: increment(amount),
      updatedAt: new Date(),
      ...(amount > 0 ? { totalEarnings: increment(amount) } : { totalWithdrawals: increment(Math.abs(amount)) })
    });

    // Record transaction
    await addDoc(collection(db, 'transactions'), {
      userId,
      type,
      amount,
      status: 'completed',
      createdAt: new Date(),
      description: `${type} transaction`
    });
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    throw error;
  }
};

// ... rest of the existing functions (transferFunds, getTransactionHistory, etc.) ...

export const verifyPayment = async (reference) => {
  try {
    const response = await fetch(
      `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/query?paymentReference=${reference}`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`)}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Payment verification failed:', error);
    throw error;
  }
};

// Update the transaction recording function
const recordTransaction = async (transactionData) => {
  try {
    await addDoc(collection(db, 'transactions'), {
      ...transactionData,
      createdAt: serverTimestamp(),
      timestamp: serverTimestamp()
    });

    // Create activity for the transaction
    await createActivity({
      userId: transactionData.userId,
      type: transactionData.type,
      text: getTransactionActivityText(transactionData),
      icon: getTransactionIcon(transactionData.type),
      amount: transactionData.amount,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error recording transaction:', error);
    throw error;
  }
};

// Helper function to get transaction activity text
const getTransactionActivityText = (transaction) => {
  switch (transaction.type) {
    case 'deposit':
      return `Funded wallet with ₦${transaction.amount}`;
    case 'withdrawal':
      return `Withdrew ₦${transaction.amount} from wallet`;
    case 'payment_received':
      return `Received payment of ₦${transaction.amount} for ${transaction.description}`;
    case 'payment_sent':
      return `Sent payment of ₦${transaction.amount} for ${transaction.description}`;
    default:
      return `${transaction.type} transaction of ₦${transaction.amount}`;
  }
};

// Helper function to get transaction icon
const getTransactionIcon = (type) => {
  switch (type) {
    case 'deposit':
      return '💰';
    case 'withdrawal':
      return '🏧';
    case 'payment_received':
      return '💵';
    case 'payment_sent':
      return '💸';
    default:
      return '💱';
  }
};

// Update getTransactionHistory to properly fetch all transaction types
export const getTransactionHistory = async (userId) => {
  try {
    const transactionsRef = collection(db, 'transactions');
    
    // Query for transactions where user is involved (either sender or receiver)
    const userTransactionsQuery = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const relatedTransactionsQuery = query(
      transactionsRef,
      where('toUserId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const [userTransactions, relatedTransactions] = await Promise.all([
      getDocs(userTransactionsQuery),
      getDocs(relatedTransactionsQuery)
    ]);

    // Combine and sort all transactions
    const allTransactions = [
      ...userTransactions.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        direction: doc.data().amount > 0 ? 'received' : 'sent'
      })),
      ...relatedTransactions.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        direction: 'received'
      }))
    ].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB - dateA;
    });

    return allTransactions;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
};

// Update transferFunds to properly record transactions
export const transferFunds = async (fromUserId, toUserId, amount, description) => {
  try {
    await runTransaction(db, async (transaction) => {
      const fromWalletRef = doc(db, 'wallets', fromUserId);
      const toWalletRef = doc(db, 'wallets', toUserId);

      const fromWallet = await transaction.get(fromWalletRef);
      const toWallet = await transaction.get(toWalletRef);

      if (!fromWallet.exists() || !toWallet.exists()) {
        throw new Error('One or both wallets not found');
      }

      if (fromWallet.data().balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Update wallets
      transaction.update(fromWalletRef, {
        balance: increment(-amount),
        updatedAt: serverTimestamp()
      });

      transaction.update(toWalletRef, {
        balance: increment(amount),
        totalEarnings: increment(amount),
        updatedAt: serverTimestamp()
      });

      // Create transactions collection entries
      const transactionsRef = collection(db, 'transactions');
      
      // Sender's transaction
      const senderTransaction = {
        userId: fromUserId,
        toUserId: toUserId,
        type: 'payment_sent',
        amount: -amount,
        description,
        status: 'completed',
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      };

      // Receiver's transaction
      const receiverTransaction = {
        userId: toUserId,
        fromUserId: fromUserId,
        type: 'payment_received',
        amount: amount,
        description,
        status: 'completed',
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      };

      // Add transactions
      transaction.set(doc(transactionsRef), senderTransaction);
      transaction.set(doc(transactionsRef), receiverTransaction);

      // Create activities for both users
      const activitiesRef = collection(db, 'activities');
      
      // Sender's activity
      transaction.set(doc(activitiesRef), {
        userId: fromUserId,
        type: 'payment_sent',
        text: `Sent payment of ₦${amount} for ${description}`,
        icon: '💸',
        amount: -amount,
        timestamp: serverTimestamp()
      });

      // Receiver's activity
      transaction.set(doc(activitiesRef), {
        userId: toUserId,
        type: 'payment_received',
        text: `Received payment of ₦${amount} for ${description}`,
        icon: '💰',
        amount: amount,
        timestamp: serverTimestamp()
      });
    });

    return true;
  } catch (error) {
    console.error('Transfer failed:', error);
    throw error;
  }
};

// Handle withdrawal
export const handleWithdrawal = async (userId, amount, bankDetails) => {
  try {
    const walletRef = doc(db, 'wallets', userId);
    
    return await runTransaction(db, async (transaction) => {
      const walletDoc = await transaction.get(walletRef);
      
      if (!walletDoc.exists()) {
        throw new Error('Wallet not found');
      }

      const walletData = walletDoc.data();
      
      if (walletData.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Get Monnify token
      const token = await generateMonnifyToken();
      const reference = `WD-${Date.now()}-${userId}`;

      // Make disbursement request
      const response = await fetch(`${MONNIFY_BASE_URL}/api/v2/disbursements/single`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reference: reference,
          destinationAccountNumber: bankDetails.accountNumber,
          destinationBankCode: bankDetails.bankCode,
          destinationAccountName: bankDetails.accountName,
          amount: amount,
          currency: "NGN",
          narration: bankDetails.narration || "Withdrawal from wallet",
          recipientName: bankDetails.accountName,
          sourceAccountNumber: import.meta.env.VITE_MONNIFY_SOURCE_ACCOUNT || '0123456789',
          contractCode: import.meta.env.VITE_MONNIFY_CONTRACT_CODE,
          transferFee: 0
        })
      });

      const data = await response.json();
      console.log('Monnify withdrawal response:', data);

      if (!data.requestSuccessful) {
        throw new Error(data.responseMessage || 'Withdrawal failed');
      }

      // Update wallet balance
      transaction.update(walletRef, {
        balance: increment(-amount),
        totalWithdrawals: increment(amount),
        updatedAt: serverTimestamp()
      });

      // Record transaction
      await addDoc(collection(db, 'transactions'), {
        userId,
        type: 'withdrawal',
        amount: -amount,
        currency: 'NGN',
        reference,
        status: 'completed',
        description: 'Withdrawal to bank account',
        bankDetails: {
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber,
          accountName: bankDetails.accountName,
          bankCode: bankDetails.bankCode
        },
        createdAt: serverTimestamp(),
        metadata: {
          monnifyReference: data.responseBody?.transactionReference || reference,
          withdrawalStatus: data.responseBody?.status || 'PROCESSING',
          disbursementId: data.responseBody?.disbursementId,
          sourceAccountNumber: import.meta.env.VITE_MONNIFY_SOURCE_ACCOUNT || '0123456789'
        }
      });

      return {
        success: true,
        message: 'Withdrawal processed successfully',
        reference: reference,
        status: data.responseBody?.status || 'PROCESSING'
      };
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    throw error;
  }
};

export const initiateWithdrawal = async (userId, amount, bankDetails) => {
  return handleWithdrawal(userId, amount, bankDetails);
};

// Add a function to handle payment callback
export const handlePaymentCallback = async (reference) => {
  try {
    // First, check our payment intents collection
    const paymentIntentsRef = collection(db, 'paymentIntents');
    const q = query(paymentIntentsRef, where('reference', '==', reference));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Payment intent not found');
    }

    const paymentIntent = querySnapshot.docs[0];
    const paymentIntentData = paymentIntent.data();

    if (paymentIntentData.status === 'completed') {
      return { success: true, message: 'Payment already processed' };
    }

    // Verify payment status with Monnify
    const token = await generateMonnifyToken();
    
    const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/merchant/transactions/query?paymentReference=${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Monnify payment verification response:', data);
    
    if (data.requestSuccessful && 
        (data.responseBody.paymentStatus === 'PAID' || data.responseBody.paymentStatus === 'COMPLETED')) {
      const { amount } = data.responseBody;
      const userId = paymentIntentData.userId;
      
      // Update wallet balance using transaction
      const walletRef = doc(db, 'wallets', userId);
      await runTransaction(db, async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) {
          throw new Error('Wallet not found');
        }

        // Update balance
        transaction.update(walletRef, {
          balance: increment(amount),
          totalEarnings: increment(amount),
          updatedAt: serverTimestamp()
        });

        // Update payment intent status
        transaction.update(doc(paymentIntentsRef, paymentIntent.id), {
          status: 'completed',
          completedAt: serverTimestamp(),
          verificationResponse: data.responseBody
        });
      });

      // Record transaction
      await addDoc(collection(db, 'transactions'), {
        userId,
        type: 'deposit',
        amount,
        currency: 'NGN',
        reference,
        status: 'completed',
        description: 'Wallet funding',
        paymentMethod: data.responseBody.paymentMethod,
        createdAt: serverTimestamp(),
        metadata: {
          monnifyReference: data.responseBody.transactionReference,
          paymentStatus: data.responseBody.paymentStatus
        }
      });

      return { success: true, message: 'Payment processed successfully' };
    } else if (data.requestSuccessful && data.responseBody.paymentStatus === 'PENDING') {
      return { success: false, message: 'Payment is still pending', isPending: true };
    }
    
    throw new Error(data.responseMessage || 'Payment verification failed');
  } catch (error) {
    console.error('Error handling payment callback:', error);
    throw error;
  }
};

// Get wallet details
export const getWalletDetails = async (userId) => {
  try {
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);

    if (!walletDoc.exists()) {
      throw new Error('Wallet not found');
    }

    return walletDoc.data();
  } catch (error) {
    console.error('Error getting wallet details:', error);
    throw error;
  }
};

// Get bank list
export const getBankList = async () => {
  try {
    const token = await generateMonnifyToken();
    
    const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/banks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!data.requestSuccessful) {
      throw new Error(data.responseMessage);
    }

    return data.responseBody.map(bank => ({
      code: bank.code,
      name: bank.name
    }));
  } catch (error) {
    console.error('Error fetching bank list:', error);
    throw error;
  }
};

// Validate bank account
export const validateBankAccount = async (accountNumber, bankCode) => {
  try {
    const token = await generateMonnifyToken();
    
    const response = await fetch(
      `${MONNIFY_BASE_URL}/api/v1/disbursements/account/validate?accountNumber=${accountNumber}&bankCode=${bankCode}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();
    
    if (!data.requestSuccessful) {
      throw new Error(data.responseMessage);
    }

    return {
      accountName: data.responseBody.accountName,
      accountNumber: data.responseBody.accountNumber,
      bankCode: data.responseBody.bankCode,
      bankName: data.responseBody.bankName
    };
  } catch (error) {
    console.error('Error validating bank account:', error);
    throw error;
  }
};

// Add this new function
export const getWalletStats = async (userId) => {
  try {
    const walletRef = doc(db, 'wallets', userId);
    const transactionsRef = collection(db, 'transactions');
    
    const [walletDoc, receivedTransactions, sentTransactions] = await Promise.all([
      getDoc(walletRef),
      getDocs(query(transactionsRef, 
        where('userId', '==', userId),
        where('type', '==', 'payment_received')
      )),
      getDocs(query(transactionsRef, 
        where('userId', '==', userId),
        where('type', '==', 'payment_sent')
      ))
    ]);

    const wallet = walletDoc.data() || { balance: 0, totalEarnings: 0 };
    const totalReceived = receivedTransactions.docs.reduce((sum, doc) => 
      sum + Math.abs(doc.data().amount), 0);
    const totalSent = sentTransactions.docs.reduce((sum, doc) => 
      sum + Math.abs(doc.data().amount), 0);

    return {
      currentBalance: wallet.balance || 0,
      totalEarnings: wallet.totalEarnings || totalReceived || 0,
      totalSpent: totalSent || 0,
      pendingPayments: 0, // You can implement this based on pending milestones
      lastTransaction: wallet.lastTransactionDate || null
    };
  } catch (error) {
    console.error('Error getting wallet stats:', error);
    return {
      currentBalance: 0,
      totalEarnings: 0,
      totalSpent: 0,
      pendingPayments: 0,
      lastTransaction: null
    };
  }
};

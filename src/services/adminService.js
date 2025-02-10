import { db } from '../firebase/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp,
  getCountFromServer,
  orderBy,
  getDoc
} from 'firebase/firestore';

// Check if user is admin
export const checkAdminStatus = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() && userSnap.data().isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get all users
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Add admin role to user
export const addAdminRole = async (currentAdminId, targetUserEmail) => {
  try {
    // First verify the current user is an admin
    const adminStatus = await checkAdminStatus(currentAdminId);
    if (!adminStatus) {
      throw new Error('Unauthorized: Only admins can add other admins');
    }

    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', targetUserEmail));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('User not found');
    }

    const userDoc = snapshot.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), {
      isAdmin: true,
      updatedAt: serverTimestamp(),
      updatedBy: currentAdminId
    });

    return { success: true, message: 'Admin role granted successfully' };
  } catch (error) {
    console.error('Error adding admin role:', error);
    throw error;
  }
};

// Remove admin role
export const removeAdminRole = async (currentAdminId, targetUserEmail) => {
  try {
    const adminStatus = await checkAdminStatus(currentAdminId);
    if (!adminStatus) {
      throw new Error('Unauthorized: Only admins can remove admin privileges');
    }

    // Prevent removing the last admin
    const adminsQuery = query(collection(db, 'users'), where('isAdmin', '==', true));
    const adminsSnapshot = await getDocs(adminsQuery);
    
    if (adminsSnapshot.size <= 1) {
      throw new Error('Cannot remove the last admin');
    }

    const userQuery = query(collection(db, 'users'), where('email', '==', targetUserEmail));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      throw new Error('User not found');
    }

    const userDoc = userSnapshot.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), {
      isAdmin: false,
      updatedAt: serverTimestamp(),
      updatedBy: currentAdminId
    });

    return { success: true, message: 'Admin role removed successfully' };
  } catch (error) {
    console.error('Error removing admin role:', error);
    throw error;
  }
};

// Ban user
export const banUser = async (adminId, userId) => {
  try {
    const adminStatus = await checkAdminStatus(adminId);
    if (!adminStatus) {
      throw new Error('Unauthorized: Only admins can ban users');
    }

    await updateDoc(doc(db, 'users', userId), {
      isBanned: true,
      bannedAt: serverTimestamp(),
      bannedBy: adminId
    });

    return { success: true, message: 'User banned successfully' };
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
};

// Unban user
export const unbanUser = async (adminId, userId) => {
  try {
    const adminStatus = await checkAdminStatus(adminId);
    if (!adminStatus) {
      throw new Error('Unauthorized: Only admins can unban users');
    }

    await updateDoc(doc(db, 'users', userId), {
      isBanned: false,
      unbannedAt: serverTimestamp(),
      unbannedBy: adminId
    });

    return { success: true, message: 'User unbanned successfully' };
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw error;
  }
};

// Delete user
export const deleteUserAccount = async (adminId, userId) => {
  try {
    const adminStatus = await checkAdminStatus(adminId);
    if (!adminStatus) {
      throw new Error('Unauthorized: Only admins can delete users');
    }

    await deleteDoc(doc(db, 'users', userId));
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Get admin statistics
export const getAdminStats = async () => {
  try {
    // Get all collections data in parallel for better performance
    const [usersSnap, jobsSnap, kycSnap, transactionsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'jobs')),
      getDocs(query(collection(db, 'users'), where('kycStatus', '==', 'pending'))),
      getDocs(collection(db, 'transactions'))
    ]);

    // Count active jobs (status is 'open' or 'in_progress')
    const activeJobsCount = jobsSnap.docs.filter(doc => {
      const jobData = doc.data();
      return jobData.status === 'open' || jobData.status === 'in_progress';
    }).length;

    console.log('Active jobs count:', activeJobsCount); // Debug log

    return {
      totalUsers: usersSnap.size,
      activeJobs: activeJobsCount,
      pendingKYC: kycSnap.size,
      totalTransactions: transactionsSnap.size
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    throw error;
  }
};

// Add other admin-related service functions here
export const getAdminActivities = async () => {
  try {
    const activitiesRef = collection(db, 'systemActivities');
    const q = query(
      activitiesRef, 
      where('type', '==', 'admin'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching admin activities:', error);
    return [];
  }
};

// Add other admin-related functions
export const getActiveJobs = async () => {
  try {
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, where('status', 'in', ['open', 'in_progress']));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      datePosted: doc.data().datePosted?.toDate()
    }));
  } catch (error) {
    console.error('Error fetching active jobs:', error);
    return [];
  }
};

export const getPendingKYC = async () => {
  try {
    const kycRef = collection(db, 'kycRequests');
    const q = query(kycRef, where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching pending KYC requests:', error);
    return [];
  }
};

// Add these new functions
export const updateUserStatus = async (userId, isActive) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isActive });
    return true;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Add these new functions for job management
export const getAllJobs = async () => {
  try {
    const jobsRef = collection(db, 'jobs');
    const querySnapshot = await getDocs(jobsRef);
    
    const jobsPromises = querySnapshot.docs.map(async doc => {
      const data = doc.data();
      
      // If there's a freelancerId, get the freelancer's name
      let freelancerName = 'Not Assigned';
      if (data.freelancerId) {
        try {
          const freelancerDoc = await getDoc(doc(db, 'users', data.freelancerId));
          if (freelancerDoc.exists()) {
            const freelancerData = freelancerDoc.data();
            freelancerName = freelancerData.fullName || freelancerData.displayName;
          }
        } catch (error) {
          console.error('Error fetching freelancer data:', error);
        }
      }

      return {
        id: doc.id,
        ...data,
        // Format all possible date fields
        postedAt: data.postedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        datePosted: data.datePosted?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        assignedAt: data.assignedAt?.toDate(),
        // Ensure freelancer info and status are included
        freelancerName: data.freelancerName || freelancerName,
        status: data.status || 'open',
        contractStatus: data.contractStatus
      };
    });

    return await Promise.all(jobsPromises);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
};

export const updateJob = async (jobId, jobData) => {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, {
      ...jobData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
};

export const deleteJob = async (jobId) => {
  try {
    await deleteDoc(doc(db, 'jobs', jobId));
    return true;
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
}; 
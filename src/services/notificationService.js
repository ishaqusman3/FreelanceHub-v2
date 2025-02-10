import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, query, where, getDocs, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Initialize Firebase Cloud Messaging
const messaging = getMessaging();

// Request permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Save FCM token to user's document
export const saveFCMToken = async (userId, token) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
      notificationsEnabled: true
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

// Send a notification
export const sendNotification = async ({
  userId,
  type,
  title,
  message,
  icon,
  jobId,
  milestoneId,
  senderId,
  data = {}
}) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const notification = {
      userId,
      type,
      title,
      message,
      icon,
      jobId,
      milestoneId,
      senderId,
      data,
      read: false,
      createdAt: serverTimestamp()
    };

    await addDoc(notificationsRef, notification);

    // If it's a milestone notification, also send a direct message
    if (type.includes('milestone')) {
      const messageData = {
        senderId,
        receiverId: userId,
        content: message,
        type: 'milestone_notification',
        jobId,
        milestoneId,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'messages'), messageData);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Get user's notifications
export const getNotifications = async (userId, limit = 20) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Listen for new notifications
export const listenForNotifications = (callback) => {
  onMessage(messaging, (payload) => {
    callback(payload);
  });
};

// Schedule milestone reminders
export const scheduleMilestoneReminder = async (jobId, milestoneId, userId, dueDate) => {
  try {
    const reminderRef = collection(db, 'reminders');
    await addDoc(reminderRef, {
      jobId,
      milestoneId,
      userId,
      dueDate,
      type: 'milestone_deadline',
      sent: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    throw error;
  }
};

// Get unread notifications count
export const getUnreadNotificationsCount = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    throw error;
  }
};

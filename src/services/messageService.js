import { db } from '../firebase/firebaseConfig';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  serverTimestamp, 
  updateDoc, 
  or, 
  and,
  orderBy,
  increment
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../firebase/firebaseConfig';

/**
 * Create or get a chat between users
 */
export const getOrCreateChat = async ({ clientId, freelancerId, clientName, freelancerName }) => {
  try {
    // First, check if a chat already exists between these users
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      or(
        and(
          where('clientId', '==', clientId),
          where('freelancerId', '==', freelancerId)
        ),
        and(
          where('clientId', '==', freelancerId),
          where('freelancerId', '==', clientId)
        )
      )
    );

    const querySnapshot = await getDocs(q);
    
    // If chat exists, return its ID
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }

    // If no chat exists, create a new one
    const newChat = await addDoc(chatsRef, {
      clientId,
      freelancerId,
      clientName,
      freelancerName,
      participants: [clientId, freelancerId],
      participantNames: [clientName, freelancerName],
      createdAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTime: null,
      unreadMessages: {
        [clientId]: 0,
        [freelancerId]: 0
      },
      typing: {
        [clientId]: false,
        [freelancerId]: false
      }
    });

    return newChat.id;
  } catch (error) {
    console.error('Error in getOrCreateChat:', error);
    throw error;
  }
};

/**
 * Send a message in a chat
 */
export const sendMessage = async (chatId, messageData) => {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    
    // Add the message to the messages sub-collection
    const newMessage = await addDoc(messagesRef, {
      ...messageData,
      timestamp: serverTimestamp(),
    });

    // Update the chat document
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    const chatData = chatDoc.data();
    
    // Get the other participant's ID
    const otherParticipantId = chatData.participants.find(
      id => id !== messageData.senderId
    );

    // Update last message and unread count
    await updateDoc(chatRef, {
      lastMessage: messageData.text || 'Sent an attachment',
      lastMessageTime: serverTimestamp(),
      [`unreadMessages.${otherParticipantId}`]: increment(1)
    });

    return newMessage.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Get all messages in a chat
 */
export const getMessagesInChat = async (chatId) => {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

/**
 * Upload a file and get its URL
 */
export const uploadFile = async (file, chatId) => {
  try {
    const storage = getStorage();
    const timestamp = new Date().getTime();
    const filePath = `chat_attachments/${chatId}/${timestamp}_${file.name}`;
    const fileRef = ref(storage, filePath);
    
    // Upload the file
    const snapshot = await uploadBytes(fileRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      name: file.name,
      type: file.type,
      size: file.size,
      path: filePath
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (chatId, userId) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`unreadMessages.${userId}`]: 0
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Update typing status
 */
export const updateTypingStatus = async (chatId, userId, isTyping) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`typing.${userId}`]: isTyping
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
    throw error;
  }
};

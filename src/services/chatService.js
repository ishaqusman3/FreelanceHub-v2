import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * Create a chat if it doesn't exist.
 * @param {string} chatId - Unique ID for the chat (e.g., `userId1_userId2`).
 * @param {Array} participants - Array of user IDs in the chat.
 * @param {Array} participantNames - Array of user names in the chat.
 */
export const createChat = async (chatId, participants, participantNames) => {
  const chatRef = doc(db, "chats", chatId);
  const chatDoc = await getDoc(chatRef);

  if (!chatDoc.exists()) {
    await setDoc(chatRef, {
      participants, // Array of user IDs
      participantNames, // Array of user names
      lastMessage: "",
      lastMessageTimestamp: null,
    });
    console.log("Chat created:", chatId);
  } else {
    console.log("Chat already exists:", chatId);
  }
};
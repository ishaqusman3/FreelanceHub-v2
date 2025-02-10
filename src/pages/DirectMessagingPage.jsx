import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from '../context/FirebaseAuthContext';
import { FaPaperPlane, FaMoneyBillWave, FaTasks, FaPaperclip, FaSmile, FaEllipsisV, FaVideo } from 'react-icons/fa';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { showNotification } from '../utils/notification';
import { uploadFile } from '../services/messageService';
import EmojiPicker from 'emoji-picker-react';
import { format } from 'date-fns';
import PageLayout from '../components/PageLayout';

export default function DirectMessagingPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const { currentUser, userData } = useAuth();
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [otherUserOnline, setOtherUserOnline] = useState(false);

  useEffect(() => {
    if (!chatId || !currentUser) {
      navigate('/messages');
      return;
    }

    const fetchChatInfo = async () => {
      try {
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (chatDoc.exists()) {
          const data = chatDoc.data();
          setChatInfo(data);
          
          // Get other user's online status
          const otherUserId = data.clientId === currentUser.uid ? data.freelancerId : data.clientId;
          if (otherUserId) {
            const userDoc = await getDoc(doc(db, "users", otherUserId));
            if (userDoc.exists()) {
              setOtherUserOnline(userDoc.data().isOnline || false);
            }
          }
        } else {
          showNotification.error('Chat not found');
          navigate('/messages');
        }
      } catch (error) {
        console.error('Error fetching chat:', error);
        showNotification.error('Error loading chat');
      }
    };

    // Subscribe to messages
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() // Convert timestamp to Date object
      }));
      setMessages(msgs);
      setLoading(false);
      scrollToBottom();
    });

    // Update read status
    const updateReadStatus = async () => {
      try {
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
          [`unreadMessages.${currentUser.uid}`]: 0
        });
      } catch (error) {
        console.error('Error updating read status:', error);
      }
    };

    fetchChatInfo();
    updateReadStatus();

    return () => unsubscribe();
  }, [chatId, currentUser, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || !chatId || !chatInfo) return;

    try {
      const messageData = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: userData.fullName,
        timestamp: serverTimestamp(),
        attachments: []
      };

      // Upload attachments if any
      if (attachments.length > 0) {
        const uploadPromises = attachments.map(file => uploadFile(file, chatId));
        const uploadedFiles = await Promise.all(uploadPromises);
        messageData.attachments = uploadedFiles;
      }

      // Add message to subcollection
      await addDoc(collection(db, "chats", chatId, "messages"), messageData);

      // Get the other participant's ID
      const otherParticipantId = chatInfo.clientId === currentUser.uid ? chatInfo.freelancerId : chatInfo.clientId;

      // Update chat's last message
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: newMessage.trim() || 'Sent an attachment',
        lastMessageTime: serverTimestamp(),
        [`unreadMessages.${otherParticipantId}`]: increment(1)
      });

      setNewMessage('');
      setAttachments([]);
      setShowEmojiPicker(false);
    } catch (error) {
      showNotification.error('Failed to send message');
      console.error('Error sending message:', error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleEmojiSelect = (event, emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const handleTyping = () => {
    if (!isTyping && chatInfo) {
      setIsTyping(true);
      // Update typing status in Firestore
      updateDoc(doc(db, "chats", chatId), {
        [`typing.${currentUser.uid}`]: true
      });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (chatInfo) {
        updateDoc(doc(db, "chats", chatId), {
          [`typing.${currentUser.uid}`]: false
        });
      }
    }, 2000);
  };

  if (loading) return <Loader />;

  // Only try to get other user info if chatInfo exists
  const otherUser = chatInfo.clientId === currentUser.uid ? chatInfo.freelancerId : chatInfo.clientId;
  const otherUserName = chatInfo.clientId === currentUser.uid ? chatInfo.freelancerName : chatInfo.clientName;

  if (!chatInfo || !otherUser || !otherUserName) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">Chat not found</h2>
            <Link to="/messages" className="text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
              Return to Messages
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Chat Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/messages" className="text-gray-600 hover:text-gray-800">
              ←
            </Link>
            <div>
              <h2 className="text-lg font-semibold">{otherUserName}</h2>
              {chatInfo?.typing?.[otherUser] ? (
                <p className="text-sm text-gray-500">Typing...</p>
              ) : (
                <p className="text-sm text-gray-500">
                  {otherUserOnline ? 'Online' : 'Offline'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <FaVideo className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-4">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message, index) => {
                const isCurrentUser = message.senderId === currentUser.uid;
                const showAvatar = index === 0 || 
                  messages[index - 1].senderId !== message.senderId;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                      {!isCurrentUser && showAvatar && (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          {message.senderName?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isCurrentUser
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-900'
                        }`}
                      >
                        {message.text}
                        {message.attachments?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((file, fileIndex) => (
                              <a
                                key={fileIndex}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-sm underline"
                              >
                                <FaPaperclip />
                                <span>{file.name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="text-xs opacity-75 mt-1">
                          {message.timestamp ? format(message.timestamp, 'h:mm a') : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t p-4">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center bg-gray-100 rounded px-2 py-1">
                  <span className="text-sm truncate max-w-xs">{file.name}</span>
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                    className="ml-2 text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-500 hover:text-indigo-600"
            >
              <FaSmile className="w-6 h-6" />
            </button>
            <label className="cursor-pointer text-gray-500 hover:text-indigo-600">
              <FaPaperclip className="w-6 h-6" />
              <input
                type="file"
                ref={fileInputRef}
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
            <div className="relative flex-1">
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2">
                  <EmojiPicker onEmojiClick={handleEmojiSelect} />
                </div>
              )}
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type your message..."
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() && attachments.length === 0}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <FaPaperPlane className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
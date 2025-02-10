import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, or } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from '../context/FirebaseAuthContext';
import { Link } from 'react-router-dom';
import { FaUser, FaSearch, FaCircle, FaTimes } from 'react-icons/fa';
import PageLayout from '../components/PageLayout';
import Loader from '../components/Loader';
import { showNotification } from '../utils/notification';
import { format } from 'date-fns';

export default function MessagesPage() {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    // Query for chats where the user is either client or freelancer
    const chatsQuery = query(
      collection(db, "chats"),
      or(
        where("clientId", "==", currentUser.uid),
        where("freelancerId", "==", currentUser.uid)
      ),
      orderBy("lastMessageTime", "desc")
    );

    // Subscribe to the query
    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(fetchedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getOtherParticipantName = (chat) => {
    return currentUser.uid === chat.clientId ? chat.freelancerName : chat.clientName;
  };

  const filteredChats = chats.filter(chat => {
    const otherParticipant = getOtherParticipantName(chat);
    return otherParticipant.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return <Loader />;

  return (
    <PageLayout>
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
        {/* Mobile Toggle Button */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="md:hidden fixed top-4 right-4 z-50 bg-indigo-600 text-white p-2 rounded-full shadow-lg"
        >
          {showSidebar ? <FaTimes /> : <FaSearch />}
        </button>

        {/* Chat List Sidebar */}
        <div className={`
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'} 
          transform transition-transform duration-300 ease-in-out
          fixed md:relative md:translate-x-0
          w-full md:w-80 lg:w-96 
          h-full 
          bg-white border-r border-gray-200
          z-40 md:z-auto
        `}>
          <div className="p-4 border-b sticky top-0 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100%-73px)]">
            {filteredChats.length > 0 ? (
              filteredChats.map(chat => (
                <Link
                  key={chat.id}
                  to={`/chat/${chat.id}`}
                  onClick={() => setShowSidebar(false)}
                  className="block p-4 border-b hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <FaUser className="text-indigo-600" />
                      </div>
                      {chat.unreadMessages?.[currentUser.uid] > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white">
                            {chat.unreadMessages[currentUser.uid]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900 truncate">
                          {getOtherParticipantName(chat)}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {chat.lastMessageTime && format(chat.lastMessageTime.toDate(), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FaCircle className="w-2 h-2 mr-2 text-green-500" />
                        <span className="text-gray-500">Online</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No conversations match your search' : 'No conversations yet'}
              </div>
            )}
          </div>
        </div>

        {/* Welcome Screen (for larger screens) */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <FaUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Welcome to Messages</h3>
            <p className="text-gray-500">Select a conversation to start chatting</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

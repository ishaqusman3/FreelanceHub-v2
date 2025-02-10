import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import MilestoneProgress from '../components/MilestoneProgress';
import MilestoneTimeline from '../components/MilestoneTimeline';
import { getMilestones, updateMilestone } from '../services/milestoneService';
import { uploadMilestoneAttachment } from '../services/attachmentService';
import { sendNotification } from '../services/notificationService';
import { createMessage } from '../services/messageService';
import Loader from '../components/Loader';
import { FaComments } from 'react-icons/fa';

const MilestonePage = () => {
  const { jobId } = useParams();
  const { currentUser } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [message, setMessage] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchMilestones();
  }, [jobId]);

  const fetchMilestones = async () => {
    try {
      const fetchedMilestones = await getMilestones(jobId);
      setMilestones(fetchedMilestones);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (milestoneId, file) => {
    try {
      const attachment = await uploadMilestoneAttachment(jobId, milestoneId, file, currentUser.uid);
      
      // Update local state
      setMilestones(prev => prev.map(m => {
        if (m.id === milestoneId) {
          return {
            ...m,
            attachments: [...(m.attachments || []), attachment]
          };
        }
        return m;
      }));

      // Send notification
      await sendNotification({
        userId: milestone.assignedTo,
        type: 'milestone_attachment',
        title: 'New Attachment Added',
        message: `${currentUser.displayName} added a new file to milestone "${milestone.name}"`,
        icon: '📎',
        jobId,
        milestoneId,
        senderId: currentUser.uid
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedMilestone) return;

    try {
      await createMessage({
        jobId,
        milestoneId: selectedMilestone.id,
        senderId: currentUser.uid,
        receiverId: selectedMilestone.assignedTo,
        content: message,
        type: 'milestone_message'
      });

      setMessage('');
      
      // Send notification
      await sendNotification({
        userId: selectedMilestone.assignedTo,
        type: 'milestone_message',
        title: 'New Message',
        message: `${currentUser.displayName} sent a message regarding milestone "${selectedMilestone.name}"`,
        icon: '💬',
        jobId,
        milestoneId: selectedMilestone.id,
        senderId: currentUser.uid
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const updateMilestoneProgress = async (milestoneId, progress) => {
    try {
      await updateMilestone(jobId, milestoneId, { progress });
      
      // Update local state
      setMilestones(prev => prev.map(m => {
        if (m.id === milestoneId) {
          return { ...m, progress };
        }
        return m;
      }));

      // Send notification if progress is updated
      const milestone = milestones.find(m => m.id === milestoneId);
      await sendNotification({
        userId: milestone.assignedTo,
        type: 'milestone_progress',
        title: 'Milestone Progress Updated',
        message: `Progress for milestone "${milestone.name}" has been updated to ${progress}%`,
        icon: '📊',
        jobId,
        milestoneId,
        senderId: currentUser.uid
      });
    } catch (error) {
      console.error('Error updating milestone progress:', error);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Project Milestones</h1>
        <button
          onClick={() => setShowChat(!showChat)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <FaComments className="mr-2" />
          Messages
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Milestones List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Progress Tracking</h2>
              {milestones.map(milestone => (
                <MilestoneProgress
                  key={milestone.id}
                  milestone={milestone}
                  onFileUpload={handleFileUpload}
                  onUpdateProgress={(progress) => updateMilestoneProgress(milestone.id, progress)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Timeline and Chat */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Timeline</h2>
            <MilestoneTimeline milestones={milestones} />
          </div>

          {/* Chat Section */}
          {showChat && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Messages</h2>
              <div className="h-96 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {selectedMilestone?.messages?.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.senderId === currentUser.uid
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <span className="text-xs opacity-75">
                          {new Date(msg.createdAt?.seconds * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MilestonePage;

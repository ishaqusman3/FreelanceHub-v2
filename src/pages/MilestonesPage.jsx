import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import MilestoneProgress from '../components/MilestoneProgress';
import { FaCheckCircle, FaMoneyBillWave, FaClock, FaUser } from 'react-icons/fa';
import Loader from '../components/Loader';
import { showNotification } from '../utils/notification';
import { formatFirebaseTimestamp } from '../utils/dateUtils';

const MilestonesPage = () => {
  const { jobId } = useParams();
  const { currentUser, userData } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedMilestones, setCompletedMilestones] = useState(0);

  useEffect(() => {
    const fetchJobAndMilestones = async () => {
      try {
        setLoading(true);

        // Fetch job details
        const jobRef = doc(db, 'jobs', jobId);
        const jobDoc = await getDoc(jobRef);
        
        if (!jobDoc.exists()) {
          throw new Error('Job not found');
        }
        
        const jobData = { id: jobDoc.id, ...jobDoc.data() };
        setJob(jobData);

        // Fetch milestones from the job's subcollection
        const milestonesRef = collection(db, `jobs/${jobId}/milestones`);
        const milestonesSnapshot = await getDocs(milestonesRef);
        
        const milestonesData = milestonesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setMilestones(milestonesData);
        setCompletedMilestones(milestonesData.filter(m => m.status === 'completed').length);
      } catch (err) {
        console.error('Error fetching job and milestones:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobAndMilestones();
    }
  }, [jobId]);

  const handleMarkMilestoneComplete = async (milestoneId) => {
    try {
      if (!currentUser || currentUser.uid !== job.clientId) {
        throw new Error('Only the client can mark milestones as complete');
      }

      const milestoneRef = doc(db, `jobs/${jobId}/milestones/${milestoneId}`);
      await updateDoc(milestoneRef, {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      });

      // Refresh milestones
      const milestonesRef = collection(db, `jobs/${jobId}/milestones`);
      const milestonesSnapshot = await getDocs(milestonesRef);
      const milestonesData = milestonesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMilestones(milestonesData);
      setCompletedMilestones(milestonesData.filter(m => m.status === 'completed').length);

      // Check if all milestones are completed
      if (milestonesData.every(m => m.status === 'completed')) {
        const jobRef = doc(db, 'jobs', jobId);
        await updateDoc(jobRef, {
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        });
        setJob(prev => ({ ...prev, status: 'completed' }));
      }

      showNotification.success('Milestone marked as complete');
    } catch (error) {
      console.error('Error marking milestone as complete:', error);
      showNotification.error(error.message);
    }
  };

  const handleUpdateProgress = async (milestoneId, progress) => {
    try {
      const milestoneRef = doc(db, `jobs/${jobId}/milestones/${milestoneId}`);
      await updateDoc(milestoneRef, {
        progress,
        updatedAt: new Date()
      });
      
      // Update local state
      setMilestones(prev => 
        prev.map(m => m.id === milestoneId ? { ...m, progress } : m)
      );
      
      showNotification.success('Progress updated successfully');
    } catch (error) {
      console.error('Error updating progress:', error);
      showNotification.error('Failed to update progress');
    }
  };

  const handleFileUpload = async (milestoneId, file) => {
    try {
      // Upload file to storage
      const storageRef = ref(storage, `milestones/${jobId}/${milestoneId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update milestone document with file info
      const milestoneRef = doc(db, `jobs/${jobId}/milestones/${milestoneId}`);
      await updateDoc(milestoneRef, {
        attachments: arrayUnion({
          name: file.name,
          url: downloadURL,
          uploadedAt: new Date()
        })
      });

      showNotification.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      showNotification.error('Failed to upload file');
    }
  };

  if (loading) return <Loader loading={loading} />;
  if (error) return <div className="text-center text-red-500 mt-8">{error}</div>;
  if (!job) return <div className="text-center mt-8">Job not found</div>;

  const totalAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  const progress = (completedMilestones / milestones.length) * 100;
  const isClient = currentUser?.uid === job.clientId;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">{job.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center">
            <FaMoneyBillWave className="text-green-500 mr-2" />
            <span className="font-semibold">Budget: ₦{job.acceptedAmount || job.budget}</span>
          </div>
          <div className="flex items-center">
            <FaClock className="text-indigo-500 mr-2" />
            <span>Duration: {job.acceptedDuration || job.duration} weeks</span>
          </div>
          <div className="flex items-center">
            <FaUser className="text-blue-500 mr-2" />
            <span>Payment: {job.paymentPreference === 'per_milestone' ? 'Per Milestone' : 'On Completion'}</span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Progress Overview</h3>
          <div className="bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{completedMilestones} of {milestones.length} milestones completed</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        {job.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <FaCheckCircle className="text-green-500 mr-2" />
              <span className="text-green-700">
                Job completed on {formatFirebaseTimestamp(job.completedAt)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {milestones.map((milestone) => (
          <MilestoneProgress
            key={milestone.id}
            milestone={milestone}
            job={job}
            onFileUpload={handleFileUpload}
            onUpdateProgress={handleUpdateProgress}
            onComplete={handleMarkMilestoneComplete}
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  );
};

export default MilestonesPage;
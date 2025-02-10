import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
import { getMyProposals } from '../services/proposalService';
import { getJobById } from '../services/jobService';
import { FaClock, FaMoneyBillWave, FaStar, FaTasks, FaMapMarkerAlt } from 'react-icons/fa';
import Loader from '../components/Loader';
import MilestoneViewModal from '../components/MilestoneViewModal';
import { formatFirebaseTimestamp } from '../utils/dateUtils';
import { showNotification } from '../utils/notification';
import { db } from '../firebase/firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const MyProposalsPage = () => {
  const { currentUser, userData } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [jobs, setJobs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMilestones, setSelectedMilestones] = useState(null);
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);

  const fetchJobsWithClientNames = async (proposals) => {
    const jobDetails = {};
    await Promise.all(
      proposals.map(async (proposal) => {
        try {
          const job = await getJobById(proposal.jobId);
          const clientDoc = await getDoc(doc(db, 'users', job.clientId));
          jobDetails[proposal.jobId] = {
            ...job,
            clientName: clientDoc.exists() ? clientDoc.data().fullName : 'Unknown Client'
          };
        } catch (err) {
          console.error(`Error fetching job ${proposal.jobId}:`, err);
        }
      })
    );
    return jobDetails;
  };

  useEffect(() => {
    const fetchProposals = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const fetchedProposals = await getMyProposals(currentUser.uid);
        setProposals(fetchedProposals);
        const jobDetails = await fetchJobsWithClientNames(fetchedProposals);
        setJobs(jobDetails);
      } catch (err) {
        setError('Failed to fetch proposals');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [currentUser]);

  const handleViewMilestones = (proposal) => {
    if (proposal.milestones && proposal.milestones.length > 0) {
      setSelectedMilestones(proposal.milestones);
      setShowMilestonesModal(true);
    } else {
      showNotification.info('No milestones defined for this proposal');
    }
  };

  const handleChatClick = (proposal) => {
    // Add chat functionality
  };

  const formatDuration = (duration) => {
    if (!duration) return 'Not specified';
    if (typeof duration === 'number') {
      return `${duration} weeks`;
    }
    if (duration.seconds) {
      const weeks = Math.ceil(duration.seconds / (7 * 24 * 60 * 60));
      return `${weeks} weeks`;
    }
    return `${duration} weeks`;
  };

  if (loading) return <Loader loading={loading} />;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-indigo-700">My Proposals</h1>
      
      <div className="space-y-6">
        {proposals.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>You haven't submitted any proposals yet.</p>
            <Link
              to="/jobs"
              className="text-indigo-600 hover:text-indigo-800 font-medium inline-block mt-2"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          proposals.map((proposal) => {
            const job = jobs[proposal.jobId];
            if (!job) return null;

            return (
              <div
                key={proposal.id}
                className="bg-white rounded-lg shadow-md p-6 transition duration-300 hover:shadow-lg"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      {job.title}
                    </h2>
                    <p className="text-gray-500">Client: {job.clientName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    proposal.status === 'accepted'
                      ? 'bg-green-100 text-green-800'
                      : proposal.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-gray-600">
                    <FaMoneyBillWave className="mr-2 text-indigo-500" />
                    <span>Bid Amount: ₦{proposal.proposedAmount}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaClock className="mr-2 text-indigo-500" />
                    <span>Duration: {formatDuration(proposal.completionDate)}</span>
                  </div>
                  {job.requiredSkills && (
                    <div className="flex items-center text-gray-600">
                      <FaTasks className="mr-2 text-indigo-500" />
                      <span>{job.requiredSkills.join(', ')}</span>
                    </div>
                  )}
                  {job.clientLocation && (
                    <div className="flex items-center text-gray-600">
                      <FaMapMarkerAlt className="mr-2 text-indigo-500" />
                      <span>{job.clientLocation}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewMilestones(proposal)}
                    className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition duration-300"
                  >
                    View Milestones
                  </button>
                  <button
                    onClick={() => handleChatClick(proposal)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300"
                  >
                    Chat
                  </button>
                  {proposal.status === 'accepted' && (
                    <Link
                      to={`/jobs/${proposal.jobId}/milestones`}
                      className="inline-flex items-center space-x-2 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition duration-300"
                    >
                      <FaTasks />
                      <span>View Progress</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <MilestoneViewModal
        isOpen={showMilestonesModal}
        onClose={() => setShowMilestonesModal(false)}
        milestones={selectedMilestones}
        userRole={userData?.role}
      />
    </div>
  );
};

export default MyProposalsPage;
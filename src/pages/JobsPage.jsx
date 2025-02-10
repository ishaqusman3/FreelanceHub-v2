import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
import { getAllJobs } from '../services/jobService';
import { getProposalsByFreelancer } from '../services/proposalService';
import { createActivity } from '../services/activityService';
import { serverTimestamp } from 'firebase/firestore';
import { formatTimeAgo } from '../utils/dateUtils';
import { FaStar, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import SubmitProposalForm from '../components/SubmitProposalForm';
import { db } from '../firebase/firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import Loader from '../components/Loader';

const JobsPage = () => {
  const { currentUser, userData } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [showFilteredJobs, setShowFilteredJobs] = useState(false);

  useEffect(() => {
    fetchJobsAndProposals();
  }, [currentUser]);

  const fetchJobsAndProposals = async () => {
    setLoading(true);
    try {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const [fetchedJobs, fetchedProposals] = await Promise.all([
        getAllJobs(),
        getProposalsByFreelancer(currentUser.uid)
      ]);

      await createActivity({
        userId: currentUser.uid,
        type: 'view_jobs',
        text: 'Viewed available jobs',
        icon: '🔍',
        timestamp: serverTimestamp()
      });

      const jobsWithClientNames = await fetchClientNames(fetchedJobs);
      setJobs(jobsWithClientNames);
      setProposals(fetchedProposals);
    } catch (err) {
      setError(err.message);
      showNotification.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientNames = async (jobs) => {
    const updatedJobs = await Promise.all(
      jobs.map(async (job) => {
        try {
          const clientDoc = await getDoc(doc(db, 'users', job.clientId));
          return {
            ...job,
            clientName: clientDoc.exists() ? clientDoc.data().fullName : 'Unknown Client'
          };
        } catch (error) {
          console.error('Error fetching client name:', error);
          return { ...job, clientName: 'Unknown Client' };
        }
      })
    );
    return updatedJobs;
  };

  const handleProposalSubmit = async () => {
    await fetchJobsAndProposals();
    setShowProposalForm(false);
    setSelectedJob(null);
  };

  const openProposalForm = (job) => {
    if (!currentUser) {
      showNotification.error('Please log in to submit a proposal');
      return;
    }
    setSelectedJob(job);
    setShowProposalForm(true);
  };

  const getFilteredJobs = () => {
    if (!showFilteredJobs || !userData?.skills) return jobs;
    return jobs.filter(job => 
      job.technologiesRequired?.some(tech => 
        userData.skills.includes(tech)
      )
    );
  };

  if (loading) return <Loader loading={loading} />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Available Jobs</h1>
      
      <div className="mb-6">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showFilteredJobs}
            onChange={(e) => setShowFilteredJobs(e.target.checked)}
            className="form-checkbox h-5 w-5 text-purple-600"
          />
          <span className="ml-2 text-gray-700">Show jobs matching my skills</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredJobs().map((job) => {
          const hasProposed = proposals.some(p => p.jobId === job.id);
          
          return (
            <div key={job.id} className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
                <span className="text-sm text-gray-500">{formatTimeAgo(job.postedAt)}</span>
              </div>

              <div className="space-y-2">
                <p className="text-gray-600 line-clamp-3">{job.description}</p>
                
                <div className="flex items-center text-gray-500">
                  <FaMapMarkerAlt className="mr-1" />
                  <span>{job.clientLocation || 'Location not specified'}</span>
                </div>

                <div className="flex items-center text-gray-600 mb-2">
                  <FaUser className="mr-2" />
                  <span>Posted by: {job.clientName}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-indigo-600">₦{job.budget}</span>
                  <span className="text-sm text-gray-500">{job.duration} weeks</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {job.technologiesRequired?.map((tech, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => openProposalForm(job)}
                disabled={hasProposed}
                className={`w-full py-2 px-4 rounded ${
                  hasProposed
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {hasProposed ? 'Already Proposed' : 'Submit Proposal'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Proposal Form Modal */}
      {showProposalForm && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Submit Proposal for {selectedJob.title}</h2>
            <SubmitProposalForm
              jobId={selectedJob.id}
              onSubmitSuccess={handleProposalSubmit}
              onClose={() => setShowProposalForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;

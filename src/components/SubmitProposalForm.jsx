import React, { useState } from 'react';
import { FaMoneyBillWave, FaClock, FaFileAlt } from 'react-icons/fa';
import { createProposal } from '../services/proposalService';
import { showNotification } from '../utils/notification';
import MilestoneDefinitionForm from './MilestoneDefinitionForm';
import { useAuth } from '../context/FirebaseAuthContext';

const SubmitProposalForm = ({ jobId, onSubmitSuccess, onClose }) => {
  const { currentUser, userData } = useAuth();
  const [formData, setFormData] = useState({
    proposedAmount: '',
    completionDate: '',
    coverLetter: '',
    paymentPreference: 'completion',
    milestones: []
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMilestonesChange = (milestones) => {
    setFormData(prev => ({ ...prev, milestones }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      showNotification.error('Please log in to submit a proposal');
      return;
    }

    if (!jobId) {
      showNotification.error('Invalid job ID');
      return;
    }

    setLoading(true);

    try {
      // Validate required fields
      if (!formData.proposedAmount || !formData.completionDate || !formData.coverLetter) {
        throw new Error('Please fill in all required fields');
      }

      // Validate milestones if payment preference is per_milestone
      if (formData.paymentPreference === 'per_milestone') {
        const totalMilestoneAmount = formData.milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
        const proposedAmount = parseFloat(formData.proposedAmount);
        
        if (Math.abs(totalMilestoneAmount - proposedAmount) > 0.01) {
          throw new Error('Total milestone amounts must equal the proposed amount');
        }

        if (!formData.milestones.every(m => m.name && m.description && m.amount && m.duration)) {
          throw new Error('Please complete all milestone details');
        }
      }

      // Create proposal with user data
      const proposal = {
        ...formData,
        jobId,
        freelancerId: currentUser.uid,
        freelancerName: userData?.fullName || 'Unknown',
        freelancerLocation: userData.location,
        proposedAmount: parseFloat(formData.proposedAmount),
        status: 'pending',
        createdAt: new Date()
      };

      await createProposal(proposal);
      showNotification.success('Proposal submitted successfully');
      onSubmitSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error submitting proposal:', error);
      showNotification.error(error.message || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Proposed Amount (₦)
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaMoneyBillWave className="text-gray-400" />
          </div>
          <input
            type="number"
            name="proposedAmount"
            value={formData.proposedAmount}
            onChange={handleChange}
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">₦</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Completion Time (Weeks)
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaClock className="text-gray-400" />
          </div>
          <input
            type="number"
            name="completionDate"
            value={formData.completionDate}
            onChange={handleChange}
            min="1"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
            placeholder="Enter number of weeks"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">weeks</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Payment Preference
        </label>
        <select
          name="paymentPreference"
          value={formData.paymentPreference}
          onChange={handleChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="completion">On Completion</option>
          <option value="per_milestone">Per Milestone</option>
        </select>
      </div>

      {formData.paymentPreference === 'per_milestone' && (
        <MilestoneDefinitionForm
          initialMilestones={formData.milestones}
          totalBidAmount={parseFloat(formData.proposedAmount) || 0}
          onMilestonesChange={handleMilestonesChange}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Cover Letter
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
            <FaFileAlt className="text-gray-400" />
          </div>
          <textarea
            name="coverLetter"
            value={formData.coverLetter}
            onChange={handleChange}
            rows={4}
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            placeholder="Explain why you're the best fit for this job..."
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Proposal'}
        </button>
      </div>
    </form>
  );
};

export default SubmitProposalForm;

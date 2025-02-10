import React, { useState } from 'react';
import { FaCheckCircle, FaHourglassHalf, FaPaperclip, FaMoneyBillWave } from 'react-icons/fa';
import { formatFirebaseTimestamp } from '../utils/dateUtils';
import { releaseMilestonePayment, releaseJobPayment } from '../services/escrowService';
import { showNotification } from '../utils/notification';

const MilestoneProgress = ({ 
  milestone, 
  job, 
  onFileUpload, 
  onUpdateProgress, 
  onComplete,
  currentUser 
}) => {
  const [progress, setProgress] = useState(milestone.progress || 0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'in_progress':
        return 'bg-indigo-600';
      case 'disputed':
        return 'bg-red-600';
      default:
        return 'bg-gray-300';
    }
  };

  const handleProgressChange = (e) => {
    const newProgress = parseInt(e.target.value);
    setProgress(newProgress);
    if (onUpdateProgress) {
      onUpdateProgress(milestone.id, newProgress);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onFileUpload) {
      onFileUpload(milestone.id, file);
    }
  };

  const handleReleasePayment = async () => {
    try {
      setIsProcessingPayment(true);
      if (job.paymentPreference === 'per_milestone') {
        await releaseMilestonePayment(
          job.id,
          milestone.id,
          milestone.amount,
          job.clientId,
          job.awardedTo
        );
        showNotification.success('Payment released successfully');
      } else {
        await releaseJobPayment(
          job.id,
          job.acceptedAmount,
          job.clientId,
          job.awardedTo
        );
        showNotification.success('Full payment released successfully');
      }
    } catch (error) {
      console.error('Error releasing payment:', error);
      showNotification.error('Failed to release payment: ' + error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const calculateTimeProgress = () => {
    if (!milestone.startDate) return 0;
    const start = milestone.startDate.toDate();
    const end = milestone.dueDate ? milestone.dueDate.toDate() : new Date(start.getTime() + (milestone.duration * 7 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const isClient = currentUser?.uid === job.clientId;
  const isFreelancer = currentUser?.uid === job.awardedTo;
  const canUpdateProgress = isFreelancer && milestone.status !== 'completed';
  const canReleasePay = isClient && milestone.status === 'completed' && !milestone.paymentStatus;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${
      milestone.status === 'completed' ? 'border-l-4 border-green-500' : ''
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center">
            {milestone.name}
            {milestone.status === 'completed' && (
              <FaCheckCircle className="text-green-500 ml-2" />
            )}
          </h3>
          <p className="text-gray-600 mt-1">{milestone.description}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end mb-1">
            <FaMoneyBillWave className="text-green-500 mr-2" />
            <span className="font-semibold">₦{milestone.amount}</span>
          </div>
          <div className="text-sm text-gray-500">
            Duration: {milestone.duration} weeks
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Tracking */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          </div>
          {canUpdateProgress && (
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          )}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getStatusColor(milestone.status)} transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Time Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Time Progress</span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(calculateTimeProgress())}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${calculateTimeProgress()}%` }}
            />
          </div>
        </div>

        {/* Status and Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            {milestone.status === 'completed' ? (
              <>
                <FaCheckCircle className="text-green-500" />
                <span className="text-sm text-green-500">
                  Completed {milestone.completedAt ? formatFirebaseTimestamp(milestone.completedAt) : ''}
                </span>
              </>
            ) : (
              <>
                <FaHourglassHalf className="text-indigo-500" />
                <span className="text-sm text-indigo-500">In Progress</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* File Upload */}
            {isFreelancer && (
              <div className="flex items-center space-x-2">
                {milestone.attachments?.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {milestone.attachments.length} file(s)
                  </span>
                )}
                <label className="cursor-pointer text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
                  <FaPaperclip />
                  <span className="text-sm">Add File</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
            )}

            {/* Complete Button */}
            {onComplete && milestone.status !== 'completed' && isClient && (
              <button
                onClick={() => onComplete(milestone.id)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300 flex items-center space-x-2"
              >
                <FaCheckCircle />
                <span>Mark Complete</span>
              </button>
            )}

            {/* Release Payment Button */}
            {canReleasePay && (
              <button
                onClick={handleReleasePayment}
                disabled={isProcessingPayment}
                className={`bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition duration-300 flex items-center space-x-2 ${
                  isProcessingPayment ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FaMoneyBillWave />
                <span>{isProcessingPayment ? 'Processing...' : 'Release Payment'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Attachments List */}
        {milestone.attachments?.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {milestone.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <FaPaperclip className="text-gray-400" />
                    <span className="text-gray-600 truncate">{file.name}</span>
                  </div>
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MilestoneProgress;

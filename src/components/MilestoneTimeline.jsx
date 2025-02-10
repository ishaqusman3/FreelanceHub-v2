import React from 'react';
import { format } from 'date-fns';
import { FaCheckCircle, FaClock, FaExclamationCircle, FaFileAlt } from 'react-icons/fa';

const MilestoneTimeline = ({ milestones }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'in_progress':
        return <FaClock className="text-indigo-500" />;
      case 'disputed':
        return <FaExclamationCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'border-green-500';
      case 'in_progress':
        return 'border-indigo-500';
      case 'disputed':
        return 'border-red-500';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Milestones */}
      <div className="space-y-8">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="relative flex items-start">
            {/* Status Icon */}
            <div className={`absolute left-6 w-5 h-5 rounded-full bg-white border-2 ${getStatusColor(milestone.status)}`}>
              {getStatusIcon(milestone.status)}
            </div>

            {/* Milestone Content */}
            <div className="ml-20 flex-1">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{milestone.name}</h3>
                    <p className="text-sm text-gray-500">{milestone.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium text-indigo-600">₦{milestone.amount}</div>
                    <div className="text-sm text-gray-500">
                      Due: {format(new Date(milestone.completionDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>

                {/* Progress and Attachments */}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${milestone.progress}%` }}
                        />
                      </div>
                      <span className="text-gray-600">{milestone.progress}%</span>
                    </div>
                    {milestone.attachments?.length > 0 && (
                      <div className="flex items-center text-gray-600">
                        <FaFileAlt className="mr-1" />
                        <span>{milestone.attachments.length} files</span>
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                    milestone.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                    milestone.status === 'disputed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {milestone.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Messages and Updates */}
                {milestone.messages?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Latest update: {milestone.messages[milestone.messages.length - 1].content}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MilestoneTimeline;

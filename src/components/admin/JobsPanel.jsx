import React, { useState } from 'react';
import { FaSearch, FaEye, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

const JobsPanel = ({ jobs, onJobAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = (
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    switch (filter) {
      case 'active':
        return matchesSearch && job.status === 'active';
      case 'completed':
        return matchesSearch && job.status === 'completed';
      case 'cancelled':
        return matchesSearch && job.status === 'cancelled';
      default:
        return matchesSearch;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Job Management</h2>
        <div className="flex gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Jobs</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posted Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredJobs.map((job) => (
              <tr key={job.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{job.title}</div>
                  <div className="text-sm text-gray-500">{job.description.substring(0, 100)}...</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{job.clientName}</div>
                  <div className="text-sm text-gray-500">{job.clientEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    job.status === 'active' ? 'bg-green-100 text-green-800' :
                    job.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(job.postedAt?.seconds * 1000).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onJobAction(job.id, 'view')}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    {job.status === 'active' && (
                      <>
                        <button
                          onClick={() => onJobAction(job.id, 'complete')}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as Completed"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={() => onJobAction(job.id, 'cancel')}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Cancel Job"
                        >
                          <FaTimes />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
                          onJobAction(job.id, 'delete');
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Job"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobsPanel; 
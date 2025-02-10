import React, { useState } from 'react';
import { FaBan, FaUnlock, FaTrash, FaUserShield, FaSearch } from 'react-icons/fa';

const UsersPanel = ({ users, onUserAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = (
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    switch (filter) {
      case 'admin':
        return matchesSearch && user.isAdmin;
      case 'banned':
        return matchesSearch && user.isBanned;
      case 'active':
        return matchesSearch && !user.isBanned;
      default:
        return matchesSearch;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
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
            <option value="all">All Users</option>
            <option value="admin">Admins</option>
            <option value="active">Active Users</option>
            <option value="banned">Banned Users</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}`}
                        alt=""
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.fullName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.isAdmin ? 'Admin' : user.role || 'User'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isBanned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.isBanned ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt?.seconds * 1000).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {!user.isAdmin && (
                      <button
                        onClick={() => onUserAction(user.id, 'makeAdmin')}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Make Admin"
                      >
                        <FaUserShield />
                      </button>
                    )}
                    {user.isBanned ? (
                      <button
                        onClick={() => onUserAction(user.id, 'unban')}
                        className="text-green-600 hover:text-green-900"
                        title="Unban User"
                      >
                        <FaUnlock />
                      </button>
                    ) : (
                      <button
                        onClick={() => onUserAction(user.id, 'ban')}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Ban User"
                      >
                        <FaBan />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                          onUserAction(user.id, 'delete');
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete User"
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

export default UsersPanel; 
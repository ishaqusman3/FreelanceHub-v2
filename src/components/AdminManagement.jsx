import React, { useState } from 'react';
import { FaUserShield, FaTrash } from 'react-icons/fa';

const AdminManagement = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [admins, setAdmins] = useState([]);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add admin');
      }

      setSuccess('Admin added successfully');
      setEmail('');
      // Refresh admin list
      fetchAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminEmail) => {
    if (!window.confirm(`Are you sure you want to remove admin privileges from ${adminEmail}?`)) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: adminEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove admin');
      }

      setSuccess('Admin removed successfully');
      // Refresh admin list
      fetchAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Admin Management</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleAddAdmin} className="mb-6">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter user email"
            className="flex-1 p-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center gap-2"
          >
            <FaUserShield />
            {loading ? 'Adding...' : 'Add Admin'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <h4 className="font-semibold mb-3">Current Admins</h4>
        <div className="space-y-2">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <div>
                <p className="font-medium">{admin.email}</p>
                <p className="text-sm text-gray-500">Added: {new Date(admin.addedAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => handleRemoveAdmin(admin.email)}
                className="text-red-600 hover:text-red-800"
                title="Remove admin privileges"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminManagement; 
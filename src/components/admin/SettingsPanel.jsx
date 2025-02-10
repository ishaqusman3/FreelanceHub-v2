import React, { useState, useEffect } from 'react';
import { FaCog, FaPercent, FaMoneyBillWave, FaUserShield } from 'react-icons/fa';
import AdminManagement from '../AdminManagement';

const SettingsPanel = () => {
  const [settings, setSettings] = useState({
    platformFee: 10,
    minimumWithdrawal: 1000,
    maximumWithdrawal: 100000,
    kycRequired: true,
    autoApproveJobs: false,
    maintenanceMode: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        // Implement getSystemSettings in your adminService
        const systemSettings = await getSystemSettings();
        setSettings(systemSettings);
      } catch (err) {
        setError('Failed to load settings');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Implement updateSystemSettings in your adminService
      await updateSystemSettings(settings);
      setSuccess('Settings updated successfully');
    } catch (err) {
      setError('Failed to update settings');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="text-center">Loading settings...</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">System Settings</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Platform Fees */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaPercent className="mr-2" /> Platform Fees
          </h3>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              value={settings.platformFee}
              onChange={(e) => handleSettingChange('platformFee', Number(e.target.value))}
              className="w-24 px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
              min="0"
              max="100"
            />
            <span className="text-gray-500">%</span>
          </div>
        </div>

        {/* Withdrawal Limits */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaMoneyBillWave className="mr-2" /> Withdrawal Limits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum (₦)</label>
              <input
                type="number"
                value={settings.minimumWithdrawal}
                onChange={(e) => handleSettingChange('minimumWithdrawal', Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Maximum (₦)</label>
              <input
                type="number"
                value={settings.maximumWithdrawal}
                onChange={(e) => handleSettingChange('maximumWithdrawal', Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* System Controls */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaCog className="mr-2" /> System Controls
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Require KYC Verification</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.kycRequired}
                  onChange={(e) => handleSettingChange('kycRequired', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-14 h-7 rounded-full transition-colors ${
                  settings.kycRequired ? 'bg-indigo-600' : 'bg-gray-200'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                    settings.kycRequired ? 'translate-x-8' : 'translate-x-1'
                  }`} />
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">Auto-approve Jobs</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.autoApproveJobs}
                  onChange={(e) => handleSettingChange('autoApproveJobs', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-14 h-7 rounded-full transition-colors ${
                  settings.autoApproveJobs ? 'bg-indigo-600' : 'bg-gray-200'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                    settings.autoApproveJobs ? 'translate-x-8' : 'translate-x-1'
                  }`} />
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">Maintenance Mode</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-14 h-7 rounded-full transition-colors ${
                  settings.maintenanceMode ? 'bg-indigo-600' : 'bg-gray-200'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                    settings.maintenanceMode ? 'translate-x-8' : 'translate-x-1'
                  }`} />
                </div>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Admin Management Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaUserShield className="mr-2" /> Admin Management
        </h3>
        <AdminManagement />
      </div>
    </div>
  );
};

export default SettingsPanel; 
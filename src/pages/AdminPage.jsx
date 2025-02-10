import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaBriefcase,
  FaIdCard,
  FaCog,
  FaChartLine,
  FaUserShield,
  FaCheckCircle,
  FaTimesCircle,
  FaBan,
  FaUnlock
} from 'react-icons/fa';
import AdminManagement from '../components/AdminManagement';
import { getAllUsers, getAdminStats, getAdminActivities } from '../services/adminService';
import Loader from '../components/Loader';
import { showNotification } from '../utils/notification';

const AdminPage = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log('AdminPage Check:', {
    currentUser: !!currentUser,
    userData,
    isAdmin: userData?.isAdmin
  });

  useEffect(() => {
    if (!userData?.isAdmin) {
      console.log('Not admin, redirecting from AdminPage');
      navigate('/home');
      return;
    }
  }, [userData, navigate]);

  useEffect(() => {
    // Check if user is admin
    if (!userData?.isAdmin) {
      navigate('/home');
      return;
    }

    const fetchAdminData = async () => {
      try {
        // Fetch users, jobs, and KYC requests
        // Implement these functions in your services
        const fetchedUsers = await getAllUsers();
        const fetchedJobs = await getAllJobs();
        const fetchedKYC = await getAllKYCRequests();

        setUsers(fetchedUsers);
        setJobs(fetchedJobs);
        setKycRequests(fetchedKYC);
      } catch (err) {
        showNotification.error(err.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [userData, navigate]);

  const handleUserAction = async (userId, action) => {
    try {
      switch (action) {
        case 'ban':
          await banUser(userId);
          break;
        case 'unban':
          await unbanUser(userId);
          break;
        case 'delete':
          await deleteUser(userId);
          break;
        default:
          break;
      }
      // Refresh users list
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);
    } catch (err) {
      setError('Failed to perform user action');
    }
  };

  const handleKYCAction = async (kycId, action) => {
    try {
      await updateKYCStatus(kycId, action);
      const updatedKYC = await getAllKYCRequests();
      setKycRequests(updatedKYC);
    } catch (err) {
      setError('Failed to update KYC status');
    }
  };

  if (loading) return <Loader loading={loading} />;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-indigo-800 min-h-screen p-4">
          <h2 className="text-white text-xl font-bold mb-8">Admin Panel</h2>
          <nav className="space-y-2">
            <SidebarItem
              icon={<FaChartLine />}
              text="Dashboard"
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            />
            <SidebarItem
              icon={<FaUsers />}
              text="Users"
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
            />
            <SidebarItem
              icon={<FaBriefcase />}
              text="Jobs"
              active={activeTab === 'jobs'}
              onClick={() => setActiveTab('jobs')}
            />
            <SidebarItem
              icon={<FaIdCard />}
              text="KYC Requests"
              active={activeTab === 'kyc'}
              onClick={() => setActiveTab('kyc')}
            />
            <SidebarItem
              icon={<FaCog />}
              text="Settings"
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <DashboardPanel
              users={users}
              jobs={jobs}
              kycRequests={kycRequests}
            />
          )}
          {activeTab === 'users' && (
            <UsersPanel
              users={users}
              onUserAction={handleUserAction}
            />
          )}
          {activeTab === 'jobs' && (
            <JobsPanel
              jobs={jobs}
            />
          )}
          {activeTab === 'kyc' && (
            <KYCPanel
              kycRequests={kycRequests}
              onKYCAction={handleKYCAction}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsPanel />
          )}
        </div>
      </div>
    </div>
  );
};

// Sidebar Item Component
const SidebarItem = ({ icon, text, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
      active ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-700'
    }`}
  >
    {icon}
    <span>{text}</span>
  </button>
);

// Panel Components
const DashboardPanel = ({ users, jobs, kycRequests }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Dashboard Overview</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        icon={<FaUsers />}
        title="Total Users"
        value={users.length}
        color="bg-blue-500"
      />
      <StatCard
        icon={<FaBriefcase />}
        title="Active Jobs"
        value={jobs.length}
        color="bg-green-500"
      />
      <StatCard
        icon={<FaIdCard />}
        title="Pending KYC"
        value={kycRequests.filter(req => req.status === 'pending').length}
        color="bg-yellow-500"
      />
    </div>
  </div>
);

const SettingsPanel = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold mb-6">Settings</h2>
    
    {/* Admin Management Section */}
    <AdminManagement />
    
    {/* Other settings sections can go here */}
  </div>
);

// Add other panel components (UsersPanel, JobsPanel, KYCPanel, SettingsPanel)
// and helper components (StatCard) here...

export default AdminPage; 
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/FirebaseAuthContext";
import { getUserStats, getFreelancerStats, getClientStats } from "../services/userService";
import { getAdminStats, getAdminActivities, getAllUsers, getActiveJobs, getPendingKYC, getAllJobs, updateJob, deleteJob } from "../services/adminService";
import { getRecentActivities } from "../services/activityService";
import { getTrendingSkills } from "../services/jobService";
import { Link } from "react-router-dom";
import WalletBalance from "../components/WalletBalance";
import { FaUser, FaSearch, FaFileAlt, FaComments, FaUserCircle, FaPencilAlt, FaChartBar, FaIdCard, FaMoneyBillWave, FaExchangeAlt, FaHistory, FaChartLine, FaStar, FaEdit, FaUsers, FaBriefcase, FaUserShield, FaCog, FaEye, FaTrash, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import Loader from "../components/Loader";
import { showNotification } from '../utils/notification';
import TransactionHistory from '../components/TransactionHistory';
import { formatFirebaseTimestamp } from '../utils/dateUtils';

const HomePage = () => {
  const { currentUser, userData, isAdmin } = useAuth();
  const userRole = userData?.role || (isAdmin ? "admin" : "client");

  const [userStats, setUserStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeJobs: 0,
    pendingKYC: 0,
    totalTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!currentUser) return;

        if (isAdmin) {
          // Fetch admin statistics
          const stats = await getAdminStats();
          console.log('Admin stats:', stats); // Debug log
          
          // If stats.activeJobs is undefined or null, calculate from jobs array
          if (stats.activeJobs === undefined || stats.activeJobs === null) {
            const activeJobs = await getActiveJobs();
            stats.activeJobs = activeJobs.length;
          }
          
          setAdminStats(stats);
          
          // Fetch admin-specific activities
          const adminActivities = await getAdminActivities();
          setRecentActivity(adminActivities);
        } else {
          // Existing stats fetching for freelancer/client
          let stats = null;
          if (userRole === "freelancer") {
            stats = await getFreelancerStats(currentUser.uid);
          } else {
            stats = await getClientStats(currentUser.uid);
          }
          setUserStats(stats);
          
          // Fetch user-specific activities
          const activities = await getRecentActivities(currentUser.uid);
          setRecentActivity(activities);

          // Fetch trending skills for non-admin users
          const skills = await getTrendingSkills();
          setTrendingSkills(skills);
        }

        // TODO: Fetch wallet balance
        // For now, we'll use a placeholder value
        setWalletBalance(1000);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        showNotification.error("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser, userRole, isAdmin]);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!isAdmin) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data in parallel
        const [stats, fetchedUsers, fetchedJobs] = await Promise.all([
          getAdminStats(),
          getAllUsers(),
          getAllJobs()
        ]);
        
        console.log('Admin stats:', stats);
        console.log('Fetched users:', fetchedUsers);
        console.log('Fetched jobs:', fetchedJobs);
        
        setAdminStats(stats);
        setUsers(fetchedUsers);
        setJobs(fetchedJobs);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  if (loading) {
    return <Loader loading={loading} />;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  const renderAdminDashboard = () => (
    <>
      <AdminTabs activeTab={activeAdminTab} onTabChange={setActiveAdminTab} />
      
      {activeAdminTab === 'dashboard' && (
        <>
          {/* Admin Welcome Section */}
          <section className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6 mb-8">
            <h3 className="text-2xl font-semibold mb-4">
              Welcome, Admin {userData?.fullName}!
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={adminStats.totalUsers}
                icon={<FaUsers className="text-3xl" />}
                color="bg-blue-500"
              />
              <StatCard
                title="Active Jobs"
                value={adminStats.activeJobs}
                icon={<FaBriefcase className="text-3xl" />}
                color="bg-green-500"
              />
              <StatCard
                title="Pending KYC"
                value={adminStats.pendingKYC}
                icon={<FaIdCard className="text-3xl" />}
                color="bg-yellow-500"
              />
              <StatCard
                title="Total Transactions"
                value={adminStats.totalTransactions}
                icon={<FaMoneyBillWave className="text-3xl" />}
                color="bg-purple-500"
              />
            </div>
          </section>

          {/* Admin Quick Actions */}
          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionCard 
                onClick={() => setActiveAdminTab('users')}
                title="Manage Users" 
                icon={<FaUsers />} 
              />
              <QuickActionCard 
                onClick={() => setActiveAdminTab('jobs')}
                title="Manage Jobs" 
                icon={<FaBriefcase />} 
              />
              <QuickActionCard 
                onClick={() => setActiveAdminTab('kyc')}
                title="KYC Requests" 
                icon={<FaIdCard />} 
              />
              <QuickActionCard 
                onClick={() => setActiveAdminTab('settings')}
                title="Settings" 
                icon={<FaCog />} 
              />
            </div>
          </section>

          {/* Recent Activity for Admin */}
          <section className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6">
            <h3 className="text-2xl font-semibold mb-4">Recent System Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-center text-gray-300">No recent activity</p>
            ) : (
              <ul className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <li key={index} className="flex justify-between items-center p-3 bg-white bg-opacity-10 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{activity.icon || '🔔'}</span>
                      <span>{activity.text}</span>
                    </div>
                    <span className="text-sm text-gray-300">
                      {formatFirebaseTimestamp(activity.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      
      {activeAdminTab === 'users' && <UsersTab users={users} />}
      {activeAdminTab === 'jobs' && <JobsTab jobs={jobs} />}
      {activeAdminTab === 'kyc' && <KYCTab kycRequests={kycRequests} />}
      {activeAdminTab === 'settings' && <SettingsTab />}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 text-white">
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold text-center mb-8 text-white drop-shadow-lg">
          {isAdmin ? "Admin Dashboard" : 
           userRole === "freelancer" ? "Freelancer Dashboard" : 
           "Client Dashboard"}
        </h2>

        {isAdmin ? renderAdminDashboard() : (
          <>
            {/* Welcome Section */}
            <section className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6 mb-8">
              <h3 className="text-2xl font-semibold mb-4">
                Welcome back, {userData?.fullName || currentUser?.displayName || "User"}!
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Section */}
                <div className="col-span-1">
                  {userRole === "freelancer" ? (
                    <div className="space-y-4">
                      <div className="bg-white bg-opacity-10 rounded-lg p-4">
                        <p className="text-3xl font-bold">{userStats?.completedJobs || 0}</p>
                        <p className="text-sm">Completed Jobs</p>
                      </div>
                      <div className="bg-white bg-opacity-10 rounded-lg p-4">
                        <p className="text-3xl font-bold">₦{userStats?.earnings || 0}</p>
                        <p className="text-sm">Total Earnings</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-white bg-opacity-10 rounded-lg p-4">
                        <p className="text-3xl font-bold">{userStats?.postedJobs || 0}</p>
                        <p className="text-sm">Posted Jobs</p>
                      </div>
                      <div className="bg-white bg-opacity-10 rounded-lg p-4">
                        <p className="text-3xl font-bold">{userStats?.activeContracts || 0}</p>
                        <p className="text-sm">Active Contracts</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wallet Section */}
                <div className="col-span-2 bg-white bg-opacity-10 rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-4">Wallet Details</h4>
                  <WalletBalance />
                  <div className="flex gap-4 mt-4">
                    <Link
                      to="/fund-wallet"
                      className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300"
                    >
                      <FaMoneyBillWave className="mr-2" />
                      Fund Wallet
                    </Link>
                    <Link
                      to="/withdraw-funds"
                      className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300"
                    >
                      <FaExchangeAlt className="mr-2" />
                      Withdraw
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="mb-8">
              <h3 className="text-2xl font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {userRole === "freelancer" ? (
                  <>
                    <QuickActionCard to="/jobs" title="Browse Jobs" icon={<FaSearch />} />
                    <QuickActionCard to="/proposals" title="My Proposals" icon={<FaFileAlt />} />
                    <QuickActionCard to="/messages" title="Messages" icon={<FaComments />} />
                    <QuickActionCard to="/profile" title="Update Profile" icon={<FaUserCircle />} />
                    <QuickActionCard to="/kyc" title="KYC Verification" icon={<FaIdCard />} />
                  </>
                ) : (
                  <>
                    <QuickActionCard to="/post-job" title="Post a Job" icon={<FaPencilAlt />} />
                    <QuickActionCard to="/my-jobs" title="My Jobs" icon={<FaChartBar />} />
                    <QuickActionCard to="/messages" title="Messages" icon={<FaComments />} />
                    <QuickActionCard to="/profile" title="Update Profile" icon={<FaUserCircle />} />
                    <QuickActionCard to="/kyc" title="KYC Verification" icon={<FaIdCard />} />
                  </>
                )}
              </div>
            </section>

            {/* Recent Activity */}
            <section className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6 mb-8">
              <h3 className="text-2xl font-semibold mb-4">Recent Activity</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Activities */}
                <div>
                  <h4 className="text-xl font-semibold mb-4">System Activities</h4>
                  {recentActivity.length === 0 ? (
                    <p className="text-center text-gray-300">No recent activity</p>
                  ) : (
                    <ul className="space-y-2">
                      {recentActivity.map((activity, index) => (
                        <li key={index} className="flex justify-between items-center p-3 bg-white bg-opacity-10 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{activity.icon || '🔔'}</span>
                            <span>{activity.text}</span>
                          </div>
                          <span className="text-sm text-gray-300">
                            {formatFirebaseTimestamp(activity.timestamp)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Transaction History */}
                <div>
                  <h4 className="text-xl font-semibold mb-4">Transaction History</h4>
                  <TransactionHistory />
                </div>
              </div>
            </section>

            {/* Trending Skills */}
            <section className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6">
              <h3 className="text-2xl font-semibold mb-4">Trending Skills</h3>
              <div className="flex flex-wrap gap-2">
                {trendingSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-purple-600 bg-opacity-80 px-4 py-2 rounded-full text-sm text-white flex items-center gap-2"
                  >
                    <span>{skill.name}</span>
                    <span className="bg-purple-800 px-2 py-0.5 rounded-full text-xs">
                      {skill.percentage}%
                    </span>
                  </span>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

const QuickActionCard = ({ to, title, icon, onClick }) => {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="bg-white bg-opacity-20 backdrop-blur-lg text-white p-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-opacity-30 transition-all duration-300 flex flex-col items-center text-center w-full"
      >
        <span className="text-3xl mb-2">{icon}</span>
        <h4 className="text-lg font-semibold">{title}</h4>
      </button>
    );
  }

  return (
    <Link
      to={to}
      className="bg-white bg-opacity-20 backdrop-blur-lg text-white p-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-opacity-30 transition-all duration-300 flex flex-col items-center text-center"
    >
      <span className="text-3xl mb-2">{icon}</span>
      <h4 className="text-lg font-semibold">{title}</h4>
    </Link>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className={`${color} rounded-xl p-4 flex items-center justify-between`}>
    <div>
      <h4 className="text-lg font-semibold">{title}</h4>
      <p className="text-2xl font-bold">{value}</p>
    </div>
    <div className="text-white opacity-80">
      {icon}
    </div>
  </div>
);

const AdminTabs = ({ activeTab, onTabChange }) => (
  <div className="flex space-x-4 mb-8 bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-2">
    <TabButton 
      active={activeTab === 'dashboard'} 
      onClick={() => onTabChange('dashboard')}
      icon={<FaChartLine />}
      text="Dashboard"
    />
    <TabButton 
      active={activeTab === 'users'} 
      onClick={() => onTabChange('users')}
      icon={<FaUsers />}
      text="Users"
    />
    <TabButton 
      active={activeTab === 'jobs'} 
      onClick={() => onTabChange('jobs')}
      icon={<FaBriefcase />}
      text="Jobs"
    />
    <TabButton 
      active={activeTab === 'kyc'} 
      onClick={() => onTabChange('kyc')}
      icon={<FaIdCard />}
      text="KYC"
    />
    <TabButton 
      active={activeTab === 'settings'} 
      onClick={() => onTabChange('settings')}
      icon={<FaCog />}
      text="Settings"
    />
  </div>
);

const TabButton = ({ active, onClick, icon, text }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
      active 
        ? 'bg-white text-purple-700 shadow-lg' 
        : 'text-white hover:bg-white hover:bg-opacity-20'
    }`}
  >
    {icon}
    <span>{text}</span>
  </button>
);

const UsersTab = ({ users }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    // Handle both Firestore Timestamp and regular dates
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }
    return 'N/A';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user?.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' ? user?.isActive : !user?.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAction = async (action, user) => {
    setSelectedUser(user);
    setModalType(action);
    setShowModal(true);
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await updateUserStatus(userId, !currentStatus);
      // Refresh users list after update
      window.location.reload();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  return (
    <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <h3 className="text-2xl font-semibold">User Management</h3>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search users..."
            className="px-4 py-2 rounded-lg bg-white bg-opacity-10 text-white placeholder-gray-300 border border-white border-opacity-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="px-4 py-2 rounded-lg bg-white bg-opacity-10 text-white border border-white border-opacity-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="freelancer">Freelancers</option>
            <option value="client">Clients</option>
            <option value="admin">Admins</option>
          </select>
          <select
            className="px-4 py-2 rounded-lg bg-white bg-opacity-10 text-white border border-white border-opacity-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white bg-opacity-10 rounded-lg">
          <thead>
            <tr className="text-left">
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t border-white border-opacity-20">
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-300 mr-3 flex items-center justify-center">
                      {(user.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                    {user.fullName || 'Unknown'}
                  </div>
                </td>
                <td className="p-4">{user.email || 'N/A'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    user.role === 'admin' ? 'bg-purple-500' :
                    user.role === 'freelancer' ? 'bg-blue-500' :
                    'bg-green-500'
                  }`}>
                    {user.role || 'N/A'}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleStatusToggle(user.id, user.isActive)}
                    className={`px-2 py-1 rounded-full text-sm ${
                      user.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-4">
                  {formatDate(user.createdAt)}
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAction('view', user)}
                      className="text-blue-400 hover:text-blue-300"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleAction('edit', user)}
                      className="text-yellow-400 hover:text-yellow-300"
                      title="Edit User"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleAction('delete', user)}
                      className="text-red-400 hover:text-red-300"
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

      {showModal && (
        <UserActionModal
          user={selectedUser}
          type={modalType}
          onClose={() => setShowModal(false)}
          onConfirm={async (updatedData) => {
            try {
              if (modalType === 'delete') {
                await deleteUser(selectedUser.id);
              } else if (modalType === 'edit') {
                await updateUser(selectedUser.id, updatedData);
              }
              setShowModal(false);
              window.location.reload();
            } catch (error) {
              console.error('Error handling user action:', error);
              alert('Failed to perform action');
            }
          }}
        />
      )}
    </div>
  );
};

// Add UserActionModal component
const UserActionModal = ({ user, type, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    role: user.role || 'client',
    isActive: user.isActive || false,
    skills: user.skills || '',
    location: user.location || ''
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-white border-opacity-20">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-white">
            {type === 'view' ? 'User Details' :
             type === 'edit' ? 'Edit User' :
             'Delete User'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {type === 'delete' ? (
          <div className="text-center">
            <FaExclamationTriangle className="text-5xl text-yellow-500 mx-auto mb-4" />
            <p className="text-white mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm()}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                disabled={type === 'view'}
                className="w-full p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={type === 'view'}
                className="w-full p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                disabled={type === 'view'}
                className="w-full p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                disabled={type === 'view'}
                className="w-full p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {formData.role === 'freelancer' && (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Skills
                </label>
                <textarea
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  disabled={type === 'view'}
                  className="w-full p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
                  placeholder="Enter skills separated by commas"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                disabled={type === 'view'}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label className="text-gray-300">Active Account</label>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                {type === 'view' ? 'Close' : 'Cancel'}
              </button>
              {type === 'edit' && (
                <button
                  onClick={() => onConfirm(formData)}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const JobsTab = ({ jobs }) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = 
      (job?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job?.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || job?.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAction = (action, job) => {
    setSelectedJob(job);
    setModalType(action);
    setShowModal(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      // Handle different timestamp formats
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      }
      // Handle string timestamps
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
      }
      return 'N/A';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-purple-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <h3 className="text-2xl font-semibold">Job Management</h3>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search jobs..."
            className="px-4 py-2 rounded-lg bg-white bg-opacity-10 text-white placeholder-gray-300 border border-white border-opacity-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="px-4 py-2 rounded-lg bg-white bg-opacity-10 text-white border border-white border-opacity-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white bg-opacity-10 rounded-lg">
          <thead>
            <tr className="text-left">
              <th className="p-4">Title</th>
              <th className="p-4">Client</th>
              <th className="p-4">Freelancer</th>
              <th className="p-4">Budget</th>
              <th className="p-4">Status</th>
              <th className="p-4">Posted</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs?.map((job) => (
              <tr key={job.id} className="border-t border-white border-opacity-20">
                <td className="p-4">
                  <div className="font-medium">{job.title || 'Untitled'}</div>
                  <div className="text-sm text-gray-300">{job.category || 'Uncategorized'}</div>
                </td>
                <td className="p-4">{job.clientName || 'Unknown Client'}</td>
                <td className="p-4">{job.freelancerName || 'Not Assigned'}</td>
                <td className="p-4">₦{job.budget?.toLocaleString() || 'N/A'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${getStatusBadgeColor(job.status)}`}>
                    {(job.status || 'open').replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  {job.postedAt ? formatDate(job.postedAt) : 
                   job.createdAt ? formatDate(job.createdAt) : 
                   job.datePosted ? formatDate(job.datePosted) : 'N/A'}
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAction('view', job)}
                      className="text-blue-400 hover:text-blue-300"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleAction('edit', job)}
                      className="text-yellow-400 hover:text-yellow-300"
                      title="Edit Job"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleAction('delete', job)}
                      className="text-red-400 hover:text-red-300"
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

      {showModal && (
        <JobActionModal
          job={selectedJob}
          type={modalType}
          onClose={() => setShowModal(false)}
          onConfirm={async (updatedData) => {
            try {
              if (modalType === 'delete') {
                await deleteJob(selectedJob.id);
              } else if (modalType === 'edit') {
                await updateJob(selectedJob.id, updatedData);
              }
              setShowModal(false);
              window.location.reload();
            } catch (error) {
              console.error('Error handling job action:', error);
              alert('Failed to perform action');
            }
          }}
        />
      )}
    </div>
  );
};

const JobActionModal = ({ job, type, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    title: job.title || '',
    description: job.description || '',
    budget: job.budget || '',
    category: job.category || '',
    status: job.status || 'open',
    freelancerId: job.freelancerId || '',
    freelancerName: job.freelancerName || ''
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-white border-opacity-20">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-white">
            {type === 'view' ? 'Job Details' :
             type === 'edit' ? 'Edit Job' :
             'Delete Job'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {type === 'delete' ? (
          <div className="text-center">
            <FaExclamationTriangle className="text-5xl text-yellow-500 mx-auto mb-4" />
            <p className="text-white mb-6">Are you sure you want to delete this job? This action cannot be undone.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm()}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                disabled={type === 'view'}
                className="w-full p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                disabled={type === 'view'}
                className="w-full p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Budget ($)
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                disabled={type === 'view'}
                className="w-full p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                disabled={type === 'view'}
                className="w-full p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                disabled={type === 'view'}
                className="w-full p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                {type === 'view' ? 'Close' : 'Cancel'}
              </button>
              {type === 'edit' && (
                <button
                  onClick={() => onConfirm(formData)}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const KYCTab = ({ kycRequests }) => (
  <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6">
    <h3 className="text-2xl font-semibold mb-4">KYC Requests</h3>
    {/* Similar table structure for KYC requests */}
  </div>
);

const SettingsTab = () => (
  <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6">
    <h3 className="text-2xl font-semibold mb-4">Admin Settings</h3>
    {/* Add settings form */}
  </div>
);

export default HomePage;
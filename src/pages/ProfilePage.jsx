import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { FaUser, FaMapMarkerAlt, FaTools, FaPhone, FaBriefcase, FaGlobe, FaMoneyBillWave } from 'react-icons/fa';
import Loader from '../components/Loader';
import { showNotification } from '../utils/notification';

const ProfilePage = () => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    location: '',
    phone: '',
    bio: '',
    skills: '',
    portfolio: '',
    hourlyRate: '',
    availability: 'full-time',
    companyName: '',
    industry: '',
    website: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!currentUser) return;
        
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData(prev => ({
            ...prev,
            ...data
          }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        showNotification.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, formData);
      showNotification.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <Loader loading={loading} />;

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Update Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <FaUser className="absolute top-3 left-3 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Location
              </label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute top-3 left-3 text-gray-400" />
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Location</option>
                  {/* Add Nigerian states here */}
                </select>
              </div>
            </div>
          </div>

          {/* Role-specific Fields */}
          {userData?.role === 'freelancer' ? (
            <FreelancerFields formData={formData} handleChange={handleChange} />
          ) : (
            <ClientFields formData={formData} handleChange={handleChange} />
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FreelancerFields = ({ formData, handleChange }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Skills
        </label>
        <div className="relative">
          <FaTools className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., Web Development, Design"
          />
        </div>
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Hourly Rate (₦)
        </label>
        <div className="relative">
          <FaMoneyBillWave className="absolute top-3 left-3 text-gray-400" />
          <input
            type="number"
            name="hourlyRate"
            value={formData.hourlyRate}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Your hourly rate"
          />
        </div>
      </div>
    </div>

    <div>
      <label className="block text-white text-sm font-medium mb-2">
        Portfolio URL
      </label>
      <div className="relative">
        <FaGlobe className="absolute top-3 left-3 text-gray-400" />
        <input
          type="url"
          name="portfolio"
          value={formData.portfolio}
          onChange={handleChange}
          className="w-full pl-10 pr-3 py-2 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="https://your-portfolio.com"
        />
      </div>
    </div>
  </>
);

const ClientFields = ({ formData, handleChange }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Company Name
        </label>
        <div className="relative">
          <FaBriefcase className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Your company name"
          />
        </div>
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Industry
        </label>
        <div className="relative">
          <FaBriefcase className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Your industry"
          />
        </div>
      </div>
    </div>

    <div>
      <label className="block text-white text-sm font-medium mb-2">
        Company Website
      </label>
      <div className="relative">
        <FaGlobe className="absolute top-3 left-3 text-gray-400" />
        <input
          type="url"
          name="website"
          value={formData.website}
          onChange={handleChange}
          className="w-full pl-10 pr-3 py-2 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="https://your-company.com"
        />
      </div>
    </div>
  </>
);

export default ProfilePage; 
import React, { useState } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { FaUser, FaMapMarkerAlt, FaTools } from 'react-icons/fa';
import Loader from '../components/Loader';
import { showNotification } from '../utils/notification';

const ProfileCompletionPage = () => {
  const { currentUser } = useAuth();
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
    'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
    'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
    'Federal Capital Territory',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!role || !location) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);

      // Check if the document exists
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userDocRef, {
          role,
          location,
          skills: role === 'freelancer' ? skills : null,
        });
        showNotification.success('Profile updated successfully!');
      } else {
        // Create the document if it doesn't exist
        await setDoc(userDocRef, {
          fullName: currentUser.displayName || '',
          email: currentUser.email || '',
          role,
          location,
          skills: role === 'freelancer' ? skills : null,
        });
        showNotification.success('Profile created successfully!');
      }

      navigate('/home');
    } catch (err) {
      console.error("Error updating profile:", err);
      showNotification.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Complete Your Profile</h2>
        </div>
        
        {error && <p className="text-red-500 text-center mb-4 bg-red-100 p-2 rounded">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative">
              <label htmlFor="role" className="sr-only">Role</label>
              <FaUser className="absolute top-3 left-3 text-gray-400" />
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select Role</option>
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
              </select>
            </div>
            <div className="relative">
              <label htmlFor="location" className="sr-only">Location</label>
              <FaMapMarkerAlt className="absolute top-3 left-3 text-gray-400" />
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select your state</option>
                {nigerianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            {role === 'freelancer' && (
              <div className="relative">
                <label htmlFor="skills" className="sr-only">Skills</label>
                <FaTools className="absolute top-3 left-3 text-gray-400" />
                <input
                  id="skills"
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your skills (comma-separated)"
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
      {loading && <Loader loading={loading} />}
    </div>
  );
};

export default ProfileCompletionPage;
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { addUserToFirestore } from '../services/userService';
import { createWallet } from '../services/walletService';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaUserTag, 
  FaMapMarkerAlt, 
  FaTools, 
  FaEye, 
  FaEyeSlash 
} from 'react-icons/fa';
import Loader from '../components/Loader';
import { showNotification } from '../utils/notification';
import { PREDEFINED_SKILLS } from '../constants/skills';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: '',
    location: '',
    skills: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
    'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
    'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
    'Federal Capital Territory'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.fullName || !formData.location || !formData.role) {
      setError("Please complete all required fields");
      return;
    }

    setLoading(true);

    try {
      // 1. Create Firebase Auth user
      const userCredential = await signUp(formData.email, formData.password, formData.fullName);
      const user = userCredential.user;

      // 2. Prepare user data for Firestore
      const userData = {
        email: formData.email,
        fullName: formData.fullName.trim(),
        role: formData.role,
        location: formData.location,
        skills: formData.role === 'freelancer' ? formData.skills.split(',').map(skill => skill.trim()) : [],
      };

      // 3. Add user to Firestore
      await addUserToFirestore(user.uid, userData);

      // 4. Create wallet for the user
      const walletData = await createWallet(user.uid, formData.fullName, formData.email);
      
      // 5. Verify wallet creation
      if (!walletData || !walletData.accountNumber) {
        throw new Error('Failed to create wallet properly');
      }

      // 6. Navigate to home page
      showNotification.success('Account created successfully!');
      navigate('/home');
    } catch (err) {
      showNotification.error(err.message || 'Failed to create account');
      console.error('Signup error:', err);
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>

        {error && (
          <p className="text-red-500 text-center mb-4 bg-red-100 p-2 rounded">{error}</p>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative">
              <label htmlFor="fullName" className="sr-only">
                Full Name
              </label>
              <FaUser className="absolute top-3 left-3 text-gray-400" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <FaLock className="absolute top-3 left-3 text-gray-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              >
                {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
              </button>
            </div>

            <div className="relative">
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <FaLock className="absolute top-3 left-3 text-gray-400" />
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role" className="sr-only">
                Role
              </label>
              <select
                id="role"
                name="role"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="">Select Role</option>
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
              </select>
            </div>

            <div className="relative">
              <label htmlFor="location" className="sr-only">
                Location
              </label>
              <FaMapMarkerAlt className="absolute top-3 left-3 text-gray-400" />
              <select
                id="location"
                name="location"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                value={formData.location}
                onChange={handleChange}
              >
                <option value="">Select your state</option>
                {nigerianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {formData.role === 'freelancer' && (
              <div className="relative">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Select Your Skills
                </label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                  {PREDEFINED_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        const currentSkills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
                        const updatedSkills = currentSkills.includes(skill)
                          ? currentSkills.filter(s => s !== skill)
                          : [...currentSkills, skill];
                        setFormData({
                          ...formData,
                          skills: updatedSkills.join(', ')
                        });
                      }}
                      className={`px-3 py-1 rounded-full text-sm ${
                        formData.skills.includes(skill)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign Up
            </button>
          </div>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Log In
          </Link>
        </p>
      </div>
      {loading && <Loader loading={loading} />}
    </div>
  );
};

export default SignupPage;

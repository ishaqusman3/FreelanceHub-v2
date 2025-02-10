// // src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import Loader from '../components/Loader';
import { showNotification } from '../utils/notification';

const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      showNotification.success('Password reset email sent. Please check your inbox.');
    } catch (err) {
      showNotification.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader loading={loading} />}
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset Your Password</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email to receive a password reset link.
            </p>
          </div>
          {error && <p className="text-red-500 text-center mb-4 bg-red-100 p-2 rounded">{error}</p>}
          {message && <p className="text-green-500 text-center mb-4 bg-green-100 p-2 rounded">{message}</p>}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
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
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Send Reset Email
              </button>
            </div>
          </form>

          <div className="text-sm text-center">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Remember your password? Log in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
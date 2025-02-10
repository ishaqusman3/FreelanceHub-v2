import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';
import { initializePayment } from '../services/walletService';
import { useAuth } from '../context/FirebaseAuthContext';
import Loader from '../components/Loader';
import { showNotification } from '../utils/notification';

export default function FundWalletPage() {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletDetails, setWalletDetails] = useState(null);
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const paymentResponse = await initializePayment({
        amount: parseFloat(amount),
        userId: currentUser.uid,
        email: currentUser.email
      });

      // Redirect to Monnify checkout page
      window.location.href = paymentResponse.checkoutUrl;
    } catch (err) {
      setError(err.message || 'Failed to initiate payment');
      showNotification.error(err.message || 'Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center">
          <FaMoneyBillWave className="mr-2" /> Fund Your Wallet
        </h2>

        {walletDetails && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Bank Transfer Details</h3>
            <p>Account Number: {walletDetails.accountNumber}</p>
            <p>Bank: {walletDetails.bankName}</p>
            <p className="text-sm text-gray-500 mt-2">
              Transfer to this account to fund your wallet automatically
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-700 font-bold mb-2">
              Amount (₦)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter amount"
              min="100"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <FaMoneyBillWave className="mr-2" />
                Proceed to Payment
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
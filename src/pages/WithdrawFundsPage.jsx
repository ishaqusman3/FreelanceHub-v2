import React, { useState, useEffect } from 'react';
import { FaExchangeAlt, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/FirebaseAuthContext';
import { handleWithdrawal, getWalletBalance } from '../services/walletService';
import { showNotification } from '../utils/notification';
import Loader from '../components/Loader';

export default function WithdrawFundsPage() {
  const { currentUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankCode: '',
    accountNumber: '',
    accountName: '',
    narration: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState('');

  // Nigerian banks list (you can fetch this from Monnify API)
  const banks = [
    { code: '057', name: 'Zenith Bank' },
    { code: '011', name: 'First Bank' },
    { code: '044', name: 'Access Bank' },
    { code: '058', name: 'GTBank' },
    // Add more banks as needed
  ];

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const walletBalance = await getWalletBalance(currentUser.uid);
        setBalance(walletBalance);
      } catch (err) {
        console.error('Error fetching balance:', err);
      }
    };

    fetchBalance();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (parseFloat(amount) > balance) {
        throw new Error('Insufficient balance');
      }

      await handleWithdrawal(currentUser.uid, parseFloat(amount), bankDetails);
      showNotification.success('Withdrawal initiated successfully');
      setAmount('');
      setBankDetails({
        bankCode: '',
        accountNumber: '',
        accountName: '',
        narration: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to process withdrawal');
      showNotification.error(err.message || 'Failed to process withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center">
          <FaExchangeAlt className="mr-2" /> Withdraw Funds
        </h2>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Available Balance</h3>
          <p className="text-2xl text-indigo-600">₦{balance.toLocaleString()}</p>
        </div>

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

          <div className="mb-4">
            <label htmlFor="bankCode" className="block text-gray-700 font-bold mb-2">
              Select Bank
            </label>
            <select
              id="bankCode"
              value={bankDetails.bankCode}
              onChange={(e) => setBankDetails({ ...bankDetails, bankCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select a bank</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="accountNumber" className="block text-gray-700 font-bold mb-2">
              Account Number
            </label>
            <input
              type="text"
              id="accountNumber"
              value={bankDetails.accountNumber}
              onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter account number"
              maxLength="10"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="accountName" className="block text-gray-700 font-bold mb-2">
              Account Name
            </label>
            <input
              type="text"
              id="accountName"
              value={bankDetails.accountName}
              onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter account name"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="narration" className="block text-gray-700 font-bold mb-2">
              Narration (Optional)
            </label>
            <input
              type="text"
              id="narration"
              value={bankDetails.narration}
              onChange={(e) => setBankDetails({ ...bankDetails, narration: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter narration"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <FaExchangeAlt className="mr-2" />
                Withdraw Funds
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
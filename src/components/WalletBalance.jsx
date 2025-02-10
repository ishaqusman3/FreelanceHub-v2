import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
import { getWalletBalance, createWallet } from '../services/walletService';

const WalletBalance = () => {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletDetails, setWalletDetails] = useState(null);

  useEffect(() => {
    const fetchWalletDetails = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        try {
          const walletBalance = await getWalletBalance(currentUser.uid);
          setBalance(walletBalance);
        } catch (error) {
          if (error.message === 'Wallet not found') {
            const wallet = await createWallet(
              currentUser.uid,
              currentUser.displayName || 'User',
              currentUser.email
            );
            setWalletDetails(wallet);
            setBalance(wallet.balance);
          } else {
            throw error;
          }
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching wallet:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletDetails();
  }, [currentUser]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="text-white">
      <div className="font-semibold mb-2">Balance: ₦{balance.toLocaleString()}</div>
      {walletDetails && (
        <div className="text-sm">
          <div>Account Number: {walletDetails.accountNumber}</div>
          <div>Bank: {walletDetails.bankName}</div>
        </div>
      )}
    </div>
  );
};

export default WalletBalance;
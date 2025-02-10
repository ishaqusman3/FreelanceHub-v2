import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handlePaymentCallback } from '../services/walletService';
import { showNotification } from '../utils/notification';
import Loader from './Loader';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processPayment = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const reference = params.get('paymentReference');
        
        if (!reference) {
          throw new Error('Payment reference not found');
        }

        const result = await handlePaymentCallback(reference);
        showNotification.success(result.message);
        setTimeout(() => {
          navigate('/home');
        }, 2000);
      } catch (error) {
        console.error('Payment processing error:', error);
        showNotification.error(error.message);
        setTimeout(() => {
          navigate('/fund-wallet');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-700">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-4">
          {loading ? 'Processing Payment...' : 'Payment Complete'}
        </h2>
        {loading ? (
          <Loader loading={loading} />
        ) : (
          <p className="text-center text-gray-600">
            You will be redirected shortly...
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback; 
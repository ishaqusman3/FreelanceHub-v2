import React from 'react';
import { PulseLoader } from 'react-spinners';

const Loader = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-r from-blue-600/90 to-purple-700/90 backdrop-blur-sm z-50">
      <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl p-8 flex flex-col items-center space-y-4">
        <PulseLoader
          color="#ffffff"
          loading={loading}
          size={15}
          speedMultiplier={0.8}
        />
        <p className="text-white text-lg font-semibold animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
};

export default Loader; 
import React, { useState } from 'react';
import { FaUser, FaIdCard, FaFileUpload } from 'react-icons/fa';
import Loader from '../components/Loader';
import { showNotification } from '../utils/notification';

export default function KYCPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    bvn: '',
    idType: '',
    idNumber: '',
  });
  const [idFile, setIdFile] = useState(null);
  const [kycStatus, setKycStatus] = useState('Not Verified'); // Can be 'Not Verified', 'Pending', or 'Verified'
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setIdFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Your KYC submission logic here
      await submitKYC(formData, idFile);
      setKycStatus('Pending');
      showNotification.success('KYC information submitted successfully');
    } catch (err) {
      showNotification.error(err.message || 'Failed to submit KYC information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader loading={loading} />}
      <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-indigo-600 p-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <FaUser className="mr-2" /> KYC Verification
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-lg font-semibold">KYC Status: <span className={`${kycStatus === 'Verified' ? 'text-green-600' : kycStatus === 'Pending' ? 'text-yellow-600' : 'text-red-600'}`}>{kycStatus}</span></p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="fullName" className="block text-gray-700 font-bold mb-2">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="bvn" className="block text-gray-700 font-bold mb-2">BVN (Bank Verification Number)</label>
                <input
                  type="text"
                  id="bvn"
                  name="bvn"
                  value={formData.bvn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="idType" className="block text-gray-700 font-bold mb-2">Government-issued ID Type</label>
                <select
                  id="idType"
                  name="idType"
                  value={formData.idType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select ID Type</option>
                  <option value="nationalId">National ID</option>
                  <option value="driversLicense">Driver's License</option>
                  <option value="passport">International Passport</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="idNumber" className="block text-gray-700 font-bold mb-2">ID Number</label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="idFile" className="block text-gray-700 font-bold mb-2">Upload ID Document</label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="idFile"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FaFileUpload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500">PNG, JPG or PDF (MAX. 5MB)</p>
                    </div>
                    <input
                      id="idFile"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".png,.jpg,.jpeg,.pdf"
                      required
                    />
                  </label>
                </div>
                {idFile && <p className="mt-2 text-sm text-gray-500">{idFile.name}</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300"
              >
                Submit KYC Information
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
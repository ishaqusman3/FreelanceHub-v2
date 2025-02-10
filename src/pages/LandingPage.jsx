// // src/pages/LandingPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import { showNotification } from '../utils/notification';

const LandingPage = () => {
  const [loading, setLoading] = useState(false);

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setLoading(false);
    showNotification.error('Failed to load some resources');
  };

  return (
    <>
      {loading && <Loader loading={loading} />}
      <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <img
          src="https://i.ibb.co/QnhpZHQ/Screenshot-20241111-220931-1.png"
          alt="FreelanceHub Logo"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className="w-24 h-24 rounded-full mx-auto mb-6 shadow-lg"
        />
        <main className="flex-grow container mx-auto px-4 py-12 sm:py-20">
          {/* Hero Section */}
          <section className="text-center mb-20">
            <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 leading-tight">
              Welcome to FreelanceHub
            </h1>
            <p className="text-xl sm:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Connect with top freelancers and clients for amazing projects.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/signup"
                id="signup"
                className="px-8 py-4 bg-white text-blue-600 hover:bg-blue-100 font-bold rounded-full shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-transparent border-2 border-white hover:bg-white hover:text-blue-600 font-bold rounded-full shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
                Log In
              </Link>
            </div>
          </section>

          {/* Features Section */}
          <section className="mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Why Choose FreelanceHub?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon="📝"
                title="Post Jobs"
                description="Easily post jobs and find talented freelancers for your projects."
              />
              <FeatureCard
                icon="🔒"
                title="Secure Payments"
                description="Complete transactions securely and efficiently with our escrow system."
              />
              <FeatureCard
                icon="💬"
                title="Real-Time Messaging"
                description="Communicate seamlessly with clients or freelancers in real-time."
              />
              <FeatureCard
                icon="🌟"
                title="Skill Matching"
                description="Our AI matches you with the perfect freelancers for your job requirements."
              />
              <FeatureCard
                icon="📊"
                title="Project Management"
                description="Manage your projects with ease using our intuitive tools and dashboards."
              />
              <FeatureCard
                icon="🏆"
                title="Top Talent"
                description="Access a pool of verified, top-rated freelancers from around the world."
              />
            </div>
          </section>

          {/* Call to Action */}
          <section className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join FreelanceHub today and experience the future of freelancing. Whether you're looking to hire or get hired, we've got you covered.
            </p>
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-blue-600 hover:bg-blue-100 font-bold rounded-full shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 inline-block"
            >
              Create Your Free Account
            </Link>
          </section>
        </main>
      </div>
    </>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl p-6 shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-200">{description}</p>
  </div>
);

export default LandingPage;
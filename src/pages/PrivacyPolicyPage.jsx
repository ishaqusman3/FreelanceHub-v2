import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-center text-indigo-700 mb-8">Privacy Policy</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-700">
              Welcome to FreelanceHub. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect personal information that you provide to us when you register on our platform, such as:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Name: Ishaq Usman</li>
              <li>Email: ishaquusmanu3@gmail.com</li>
              <li>Location: Department of Software Engineering, Bayero University Kano</li>
              <li>Professional experience and skills</li>
              <li>Payment information</li>
              <li>Communication between users on our platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect for various purposes, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Providing and maintaining our services</li>
              <li>Improving and personalizing user experience</li>
              <li>Communicating with you about our services</li>
              <li>Ensuring the security and integrity of our platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>
            <p className="text-gray-700">
              We may share your information with third parties in certain situations, such as with your consent, to comply with legal obligations, or to protect our rights and those of our users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights and Choices</h2>
            <p className="text-gray-700">
              You have certain rights regarding your personal information, including the right to access, correct, or delete your data. You can manage your privacy settings and communication preferences in your account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Security of Your Information</h2>
            <p className="text-gray-700">
              We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <div className="mt-8 text-gray-600 text-sm">
            Last updated: January 21, 2025
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
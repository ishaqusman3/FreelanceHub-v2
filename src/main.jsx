import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { FirebaseAuthProvider } from './context/FirebaseAuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import Footer from './components/Footer';
import './index.css'; // Import Tailwind CSS here

// Import your page components
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import GoogleSignInHandler from './pages/GoogleSignInHandler';
import ProfileCompletionPage from './pages/ProfileCompletionPage';
import PostJobPage from './pages/PostJobPage';
import JobsPage from './pages/JobsPage';
import MyJobsPage from './pages/MyJobsPage';
import MyProposalsPage from './pages/MyProposalsPage';
import MessagesPage from './pages/MessagesPage';
import DirectMessagingPage from './pages/DirectMessagingPage';
import FundWalletPage from './pages/FundWalletPage';
import WithdrawFundsPage from './pages/WithdrawFundsPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import KYCPage from './pages/KYCPage';
import MilestonesPage from './pages/MilestonesPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminSignupPage from './pages/AdminSignupPage';
import PageLayout from './components/PageLayout';
import ProfilePage from './pages/ProfilePage';
import PaymentCallback from './components/PaymentCallback';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

const App = () => {
  const location = useLocation();
  const shouldShowFooter = !location.pathname.startsWith('/chat');

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <PageLayout>
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/google-signin" element={<GoogleSignInHandler />} />
            <Route path="/profile-completion" element={<ProfileCompletionPage />} />
            <Route path="/post-job" element={<PostJobPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/my-jobs" element={<MyJobsPage />} />
            <Route path="/proposals" element={<MyProposalsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/chat/:chatId" element={<DirectMessagingPage />} />
            <Route path="/fund-wallet" element={<FundWalletPage />} />
            <Route path="/withdraw-funds" element={<WithdrawFundsPage />} />
            <Route path="/transactions" element={<TransactionHistoryPage />} />
            <Route path="/kyc" element={<KYCPage />} />
            <Route path="/jobs/:jobId/milestones" element={<MilestonesPage />} />
            <Route path="/payment-callback" element={<PaymentCallback />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/admin-signup" element={<AdminSignupPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} /> 
          </Routes>
        </main>
      </PageLayout>
      {shouldShowFooter && <Footer />}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{
          top: '4rem', // Adjusted to match header height
          zIndex: 9999
        }}
      />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Router>
    <FirebaseAuthProvider>
      <App />
    </FirebaseAuthProvider>
  </Router>
);

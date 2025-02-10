// // // src/components/Header.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { FaBars, FaTimes, FaHome, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaUserShield } from 'react-icons/fa';

const Header = () => {
  const { currentUser, userData, logOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Generate initials from the full name if no profile picture exists
  const getInitials = (name) => {
    if (!name) return 'U'; // Default to 'U' for "Unknown"
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
    return initials;
  };

  // Determine profile picture or initials
  const profileContent = currentUser?.photoURL ? (
    <img
      src={currentUser.photoURL}
      alt="User Profile"
      className="w-10 h-10 rounded-full border-2 border-white"
    />
  ) : (
    <div className="w-10 h-10 bg-purple-500 text-white flex items-center justify-center rounded-full text-lg font-bold border-2 border-white">
      {getInitials(userData?.fullName)}
    </div>
  );

  console.log('Header Check:', {
    currentUser: !!currentUser,
    userData,
    isAdmin: userData?.isAdmin
  });

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg fixed top-0 left-0 right-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and App Title */}
          <div
            onClick={() => navigate('/home')}
            className="flex items-center cursor-pointer"
          >
            <img
              src="https://i.ibb.co/QnhpZHQ/Screenshot-20241111-220931-1.png"
              alt="App Logo"
              className="w-10 h-10 rounded-full mr-2"
            />
            <h1 className="text-2xl font-bold hover:text-purple-200 transition duration-300">
              FreelanceHub
            </h1>
          </div>

          {/* Mobile Hamburger and Profile */}
          <div className="flex items-center space-x-4 md:hidden">
            {currentUser && profileContent}
            <button
              onClick={toggleMobileMenu}
              className="text-white text-2xl focus:outline-none transition duration-300 ease-in-out transform hover:scale-110"
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {!currentUser ? (
              <>
                <NavLink to="/" icon={<FaHome />} text="Home" />
                <NavLink to="/login" icon={<FaSignInAlt />} text="Login" />
                <NavLink to="/signup" icon={<FaUserPlus />} text="Sign Up" />
              </>
            ) : (
              <>
                <NavLink to="/home" icon={<FaHome />} text="Home" />
                <button
                  onClick={handleLogout}
                  className="flex items-center hover:text-purple-200 transition duration-300"
                >
                  <FaSignOutAlt className="mr-2" /> Logout
                </button>
                {profileContent}
                {currentUser && userData?.isAdmin && (
                  <NavLink 
                    to="/admin" 
                    className={({ isActive }) => `
                      flex items-center hover:text-purple-200 transition duration-300
                      ${isActive ? 'text-purple-200' : ''}
                    `}
                  >
                    <FaUserShield className="mr-2" />
                    Admin Panel
                  </NavLink>
                )}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <nav className="md:hidden bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg">
          <div className="container mx-auto px-4 py-2">
            {!currentUser ? (
              <>
                <MobileNavLink to="/" icon={<FaHome />} text="Home" onClick={toggleMobileMenu} />
                <MobileNavLink to="/login" icon={<FaSignInAlt />} text="Login" onClick={toggleMobileMenu} />
                <MobileNavLink to="/signup" icon={<FaUserPlus />} text="Sign Up" onClick={toggleMobileMenu} />
              </>
            ) : (
              <>
                <MobileNavLink to="/home" icon={<FaHome />} text="Home" onClick={toggleMobileMenu} />
                <button
                  onClick={() => {
                    toggleMobileMenu();
                    handleLogout();
                  }}
                  className="w-full text-left py-2 hover:text-purple-200 transition duration-300"
                >
                  <FaSignOutAlt className="inline mr-2" /> Logout
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

const NavLink = ({ to, icon, text }) => (
  <Link to={to} className="flex items-center hover:text-purple-200 transition duration-300">
    {icon}
    <span className="ml-2">{text}</span>
  </Link>
);

const MobileNavLink = ({ to, icon, text, onClick }) => (
  <Link
    to={to}
    className="block py-2 hover:text-purple-200 transition duration-300"
    onClick={onClick}
  >
    {icon}
    <span className="ml-2">{text}</span>
  </Link>
);

export default Header;

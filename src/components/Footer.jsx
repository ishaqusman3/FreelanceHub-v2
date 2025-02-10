import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-8 ">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Footer Links */}
          <div className="flex space-x-6">
            <FooterLink to="/about" text="About Us" />
            <FooterLink to="/contact" text="Contact" />
            <FooterLink to="/privacy" text="Privacy Policy" />
          </div>

          {/* Copyright */}
          <div className="text-sm text-purple-200">
            &copy; {new Date().getFullYear()} FreelanceHub. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({ to, text }) => (
  <Link to={to} className="hover:text-purple-200 transition duration-300">
    {text}
  </Link>
);

export default Footer;
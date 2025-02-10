import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FirebaseAuthProvider } from './context/FirebaseAuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MainApp from './main';

const App = () => {
  return (
    <Router>
      <FirebaseAuthProvider>
        <MainApp />
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
            top: '5rem',
            zIndex: 9999
          }}
        />
      </FirebaseAuthProvider>
    </Router>
  );
};

export default App;

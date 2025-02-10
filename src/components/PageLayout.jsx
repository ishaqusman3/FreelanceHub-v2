import React from 'react';

const PageLayout = ({ children }) => {
  return (
    <div className="min-h-screen pt-16"> {/* Reduced padding-top from 20 to 16 */}
      {children}
    </div>
  );
};

export default PageLayout;
/**
 * Layout Component
 * Provides the main structural layout for the application
 * Includes consistent navigation, content area, and footer across all pages
 */
import React from 'react';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';

/**
 * Layout component that wraps all page content
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render in the content area
 * @returns {React.ReactElement} Layout structure with navigation, content, and footer
 */
const Layout = ({ children }) => {
  return (
    // Main container for the entire page
    <div className="page-container">
      {/* Navigation bar fixed at the top */}
      <Navbar />
      
      {/* Main content area where page-specific content is rendered */}
      <div className="content-container">
        {children}
      </div>
      
      {/* Footer section fixed at the bottom */}
      <Footer />
    </div>
  );
};

export default Layout; 
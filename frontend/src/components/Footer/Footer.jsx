import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} Kudos Management System. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 
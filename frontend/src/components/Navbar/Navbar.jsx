/**
 * Navigation Bar Component
 * Provides the main navigation header for the application
 * Includes responsive menu, navigation links, and user profile dropdown
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

/**
 * Navbar component that handles navigation and user account actions
 * Features:
 * - Responsive mobile menu
 * - Active route highlighting
 * - Profile dropdown with logout functionality
 * @returns {React.ReactElement} Navigation bar with links and user controls
 */
const Navbar = () => {
  // Hooks for routing and navigation
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management for mobile menu and profile dropdown
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Navigation menu items configuration
  const navigationItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/team', label: 'Team', icon: '👥' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' }
  ];

  /**
   * Check if the given path matches current location
   * @param {string} path - Route path to check
   * @returns {boolean} True if current route matches path
   */
  const isActive = (path) => location.pathname === path;

  /**
   * Handle clicks outside of profile dropdown to close it
   * Implements click-outside behavior for better UX
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle user logout action
   * Clears authentication and redirects to login
   */
  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Application Logo and Title */}
        <div className="logo">
          <Link to="/">
            <h1>
              <span className="logo-icon">✨</span>
              Kudos Management
            </h1>
          </Link>
        </div>
        
        {/* Mobile Menu Toggle Button */}
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="menu-icon"></span>
        </button>
        
        {/* Main Navigation Menu */}
        <nav className={`main-nav ${isMenuOpen ? 'menu-open' : ''}`}>
          <ul>
            {/* Dynamic Navigation Items */}
            {navigationItems.map(({ path, label, icon }) => (
              <li key={path}>
                <Link to={path} className={isActive(path) ? 'active' : ''}>
                  <span className="nav-icon">{icon}</span>
                  <span className="nav-label">{label}</span>
                </Link>
              </li>
            ))}

            {/* Profile Dropdown Menu */}
            <li className="profile-dropdown" ref={dropdownRef}>
              <button 
                className={`profile-dropdown-btn ${isProfileDropdownOpen ? 'active' : ''}`}
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <span className="nav-icon">👤</span>
                <span className="nav-label">Account</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {/* Profile Dropdown Content */}
              {isProfileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <Link to="/profile" className="dropdown-item" onClick={() => setIsProfileDropdownOpen(false)}>
                    <span className="dropdown-icon">👤</span>
                    My Profile
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item">
                    <span className="dropdown-icon">🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar; 
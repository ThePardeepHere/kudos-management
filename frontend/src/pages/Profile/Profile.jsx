/**
 * Profile Component
 * Displays the authenticated user's profile information including kudos availability,
 * personal details, and organization information.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { API_CONFIG } from '../../config/api.config';
import { authService } from '../../services/auth.service';

const Profile = () => {
  // State management for profile data and UI states
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Flag to prevent state updates after component unmount
    let isMounted = true;

    /**
     * Fetches the user's profile data from the API
     * Handles authentication checks and error states
     */
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // Verify authentication status before making API call
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }

        // Fetch profile data from the API
        const response = await authService.get(API_CONFIG.ENDPOINTS.USERS.PROFILE);
        
        // Update state only if component is still mounted
        if (isMounted) {
          setProfile(response.data.data.profile);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        // Handle unauthorized access
        if (err.response?.status === 401 && isMounted) {
          navigate('/login');
        }
        // Set error state if component is still mounted
        if (isMounted) {
          setError('Failed to load profile data');
        }
      } finally {
        // Reset loading state if component is still mounted
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initial profile data fetch
    fetchProfile();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [navigate]); // Re-run effect if navigation function changes

  // Display loading spinner while fetching data
  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  // Display error message if data fetch failed
  if (error) {
    return (
      <Layout>
        <div className="content-container">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Display message and login button if profile data is not available
  if (!profile) {
    return (
      <Layout>
        <div className="content-container">
          <div className="error-message">
            <h2>Profile Not Available</h2>
            <p>We couldn't load your profile information. Please try logging in again.</p>
            <button 
              className="primary-button" 
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Main profile display
  return (
    <Layout>
      <div className="content-container">
        <div className="profile-card">
          {/* Profile Header Section */}
          <div className="profile-header">
            <div className="profile-info">
              <h1>My Profile</h1>
              {/* Kudos Information Display */}
              <div className="kudos-info">
                <span className="kudos-label-profile">Available Kudos:</span>
                <span className="kudos-value-profile">{profile.kudos_available}</span>
                <span className="kudos-label-profile">Next Kudos Reset:</span>
                <span className="kudos-value-profile">
                  {/* Format the kudos reset date in a user-friendly way */}
                  {new Date(profile.next_kudos_reset).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="profile-tabs-container">
            <div className="details-grid">
              {/* Full Name Display */}
              <div className="detail-item">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">
                  {`${profile.first_name} ${profile.last_name}`}
                </span>
              </div>

              {/* Email Display */}
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{profile.email}</span>
              </div>

              {/* Username Display */}
              <div className="detail-item">
                <span className="detail-label">Username</span>
                <span className="detail-value">{profile.username}</span>
              </div>

              {/* Organization Display */}
              <div className="detail-item">
                <span className="detail-label">Organization</span>
                <span className="detail-value">{profile.organization.name}</span>
              </div>

              {/* Role Display with Badge */}
              <div className="detail-item">
                <span className="detail-label">Role</span>
                <span className="detail-value">
                  <span className={`role-badge ${profile.role}`}>
                    {/* Format role name for display (e.g., 'org_owner' -> 'ORG OWNER') */}
                    {profile.role.replace('_', ' ').toUpperCase()}
                  </span>
                </span>
              </div>

              {/* Status Display with Badge */}
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  <span className={`status-badge ${profile.is_active ? 'active' : 'inactive'}`}>
                    {profile.is_active ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile; 
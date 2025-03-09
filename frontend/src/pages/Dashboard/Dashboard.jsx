import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import Layout from '../../components/Layout/Layout';
import { API_CONFIG } from '../../config/api.config.js';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    kudosReceived: 0,
    kudosGiven: 0,
    teamMembers: 0
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardPagination, setLeaderboardPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [kudosMessage, setKudosMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kudosError, setKudosError] = useState(null);
  const [kudosSuccess, setKudosSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated before making API calls
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }

        const [profileResponse, statsResponse, leaderboardResponse] = await Promise.all([
          authService.get(API_CONFIG.ENDPOINTS.USERS.PROFILE),
          authService.get(API_CONFIG.ENDPOINTS.DASHBOARD.STATS),
          authService.get(API_CONFIG.ENDPOINTS.DASHBOARD.LEADERBOARD)
        ]);
        
        // Add these console.logs to debug the responses
        console.log('Profile Response:', profileResponse.data);
        console.log('Stats Response:', statsResponse.data);
        console.log('Leaderboard Response:', leaderboardResponse.data);
        
        if (isMounted) {
          // Make sure we're accessing the correct path in the response
          const userData = profileResponse.data?.data?.profile || {};
          console.log('User profile data:', userData);
          setUser(userData);
          
          // Make sure we're accessing the correct path in the stats response
          const statsData = statsResponse.data?.data || {};
          setStats({
            kudosReceived: statsData.total_kudos_received || 0,
            kudosGiven: statsData.total_kudos_sent || 0,
            teamMembers: statsData.total_team_members || 0
          });
          
          // Make sure we're accessing the correct path in the leaderboard response
          const leaderboardData = leaderboardResponse.data || {};
          setLeaderboard(leaderboardData.data || []);
          setLeaderboardPagination({
            currentPage: leaderboardData.current_page || 1,
            totalPages: leaderboardData.total_pages || 1,
            pageSize: leaderboardData.page_size || 10
          });
        }
        
      } catch (err) {
        console.error('Error fetching user profile:', err);
        if (err.response?.status === 401 && isMounted) {
          navigate('/login');
        }
        if (isMounted) {
          setError('Failed to load user profile');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array

  // Helper function to check if user has admin privileges
  const isAdmin = () => {
    return user && (user.role === 'org_owner');
  };

  // Helper function to get role display name
  const getRoleDisplayName = (role) => {
    const roleMap = {
      'org_owner': 'Organization Owner',
      'org_member': 'Organization Member',
    
    };
    return roleMap[role] || role;
  };

  // Helper function to safely access nested properties
  const getNestedValue = (obj, path, defaultValue = '') => {
    try {
      const result = path.split('.').reduce((o, key) => (o && o[key] !== undefined) ? o[key] : undefined, obj);
      return result !== undefined ? result : defaultValue;
    } catch (e) {
      console.error('Error accessing nested property:', path, e);
      return defaultValue;
    }
  };

  // Add this function to handle page changes
  const handlePageChange = async (page) => {
    try {
      const response = await authService.get(`${API_CONFIG.ENDPOINTS.DASHBOARD.LEADERBOARD}?page=${page}`);
      setLeaderboard(response.data.data);
      setLeaderboardPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.total_pages,
        pageSize: response.data.page_size
      });
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  // Add this function to handle kudos submission
  const handleGiveKudos = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setKudosError(null);
    setKudosSuccess(null);
    
    if (!user?.kudos_available) {
      setKudosError("You don't have any kudos available to give");
      return;
    }

    try {
      await authService.post(API_CONFIG.ENDPOINTS.KUDOS.GIVE, {
        receiver: selectedReceiver,
        message: kudosMessage
      });
      
      setKudosSuccess('Kudos given successfully!');
      setKudosMessage('');
      
      // Fetch updated user profile
      try {
        const profileResponse = await authService.get(API_CONFIG.ENDPOINTS.USERS.PROFILE);
        if (profileResponse.data?.data?.profile) {
          const profileData = profileResponse.data.data.profile;
          // Update localStorage with complete profile data
          localStorage.setItem('user', JSON.stringify({
            id: profileData.id,
            email: profileData.email,
            firstName: profileData.first_name,
            lastName: profileData.last_name,
            organization: profileData.organization,
            role: profileData.role,
            kudosAvailable: profileData.kudos_available,
            isActive: profileData.is_active,
            groups: profileData.groups,
            username: profileData.username,
            nextKudosReset: profileData.next_kudos_reset
          }));
        }
      } catch (profileError) {
        console.error('Error updating user profile:', profileError);
        setKudosError('Kudos sent but failed to update profile. Please refresh the page.');
        return;
      }
      
      setTimeout(() => {
        setIsModalOpen(false);
        setKudosSuccess(null);
        setSelectedReceiver(null);
        window.location.reload(); // Refresh the page to ensure all components have latest data
      }, 2000);
    } catch (err) {
      console.error('Error giving kudos:', err.response?.data);
      let errorMessage;
      
      if (err.response?.data?.errors) {
        if (err.response.data.errors.receiver) {
          errorMessage = err.response.data.errors.receiver[0];
        } else if (err.response.data.errors.sender) {
          errorMessage = err.response.data.errors.sender[0];
        } else {
          errorMessage = 'Validation error occurred';
        }
      } else {
        errorMessage = err.response?.data?.message || 'Failed to give kudos';
      }
      
      setKudosError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

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

  if (!user) {
    return (
      <div className="dashboard-error">
        <h2>User data not available</h2>
        <p>We couldn't load your profile information. Please try logging in again.</p>
        <button 
          className="primary-button" 
          onClick={() => navigate('/login')}
        >
          Go to Login
        </button>
      </div>
    );
  }

  // For debugging
  console.log('Rendering dashboard with user:', user);

  return (
    <Layout>
      <div className="dashboard-layout">
        {/* Modern Welcome Card */}
        <div className="welcome-card">
          <div className="welcome-card-header">
            <div className="welcome-user">
              <div className="user-avatar">
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </div>
              <div className="user-info">
                <h1>Welcome back, {user?.first_name || 'User'}</h1>
                <p className="user-role">{getRoleDisplayName(user?.role || '')}</p>
              </div>
            </div>
            <div className="kudos-badge-container">
              <div className="kudos-badge">
                <span className="kudos-count">{user?.kudos_available || 0}</span>
                <span className="kudos-label">Kudos Available</span>
              </div>
            </div>
          </div>

          
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3 className="stat-title">Kudos Received</h3>
            <div className="stat-value">{stats.kudosReceived}</div>
            <Link to="/kudos-received" className="stat-link">
              View history →
            </Link>
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Kudos Given</h3>
            <div className="stat-value">{stats.kudosGiven}</div>
            <Link to="/kudos-history" className="stat-link">
              View history →
            </Link>
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Team Members</h3>
            <div className="stat-value">{stats.teamMembers}</div>
            <Link to="/team" className="stat-link">
              View all →
            </Link>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-card">
          <div className="table-header">
            <h2>Leaderboard</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Kudos Received</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((member, index) => (
                  <tr key={member.id}>
                    <td className="rank-cell">
                      {(leaderboardPagination.currentPage - 1) * leaderboardPagination.pageSize + index + 1}
                    </td>
                    <td className="name-cell">
                      {`${member.first_name || ''} ${member.last_name || ''}`}
                    </td>
                    <td className="kudos-cell">
                      {member.kudos_received_count}
                    </td>
                    <td className="actions-cell">
                      {member.id === user?.id ? (
                        <button
                          className="button button-self"
                          disabled
                        >
                          It's You
                        </button>
                      ) : (
                        <button
                          className="give-kudos-btn button button-kudos"
                          onClick={() => {
                            setSelectedReceiver(member.id);
                            setIsModalOpen(true);
                          }}
                          disabled={!user?.kudos_available}
                        >
                          {user?.kudos_available ? 'Give Kudos' : 'No Kudos Available'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {leaderboardPagination.totalPages > 1 && (
            <div className="table-footer">
              <div className="pagination">
                <button
                  className="give-kudos-btn button button-kudos"
                  disabled={leaderboardPagination.currentPage === 1}
                  onClick={() => handlePageChange(leaderboardPagination.currentPage - 1)}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {leaderboardPagination.currentPage} of {leaderboardPagination.totalPages}
                </span>
                <button
                  className="give-kudos-btn button button-kudos"
                  disabled={leaderboardPagination.currentPage === leaderboardPagination.totalPages}
                  onClick={() => handlePageChange(leaderboardPagination.currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Kudos Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Give Kudos</h2>
            <form onSubmit={handleGiveKudos}>
              {kudosError && (
                <div className="error-message mb-4">
                  {kudosError}
                </div>
              )}
              
              {kudosSuccess && (
                <div className="success-message mb-4">
                  {kudosSuccess}
                </div>
              )}
              
              <div className="modal-body">
                <label htmlFor="kudos-message">Message:</label>
                <textarea
                  id="kudos-message"
                  value={kudosMessage}
                  onChange={(e) => setKudosMessage(e.target.value)}
                  placeholder="Write your kudos message here..."
                  required
                  rows="4"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Kudos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
   
    </Layout>
  );
};

export default Dashboard; 
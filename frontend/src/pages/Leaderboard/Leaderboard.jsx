/**
 * Leaderboard Component
 * Displays a ranked list of users based on the number of kudos they have received.
 * Includes pagination and user display name formatting.
 */
import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../../config/api.config';
import { authService } from '../../services/auth.service';
import Navbar from '../../components/Navbar/Navbar';

const Leaderboard = () => {
  // State management for leaderboard data and UI states
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state configuration
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    count: 0
  });

  // Load leaderboard data when component mounts
  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  /**
   * Fetches leaderboard data from the API with pagination support
   * Updates the leaderboard data and pagination state
   * @param {number} page - The page number to fetch (defaults to 1)
   */
  const fetchLeaderboardData = async (page = 1) => {
    try {
      setLoading(true);
      const response = await authService.get(`${API_CONFIG.ENDPOINTS.DASHBOARD.LEADERBOARD}?page=${page}`);
      
      // Check if response is valid and update state accordingly
      if (response.data && response.data.status_code === 200) {
        setLeaderboardData(response.data.data);
        setPagination({
          currentPage: response.data.current_page,
          totalPages: response.data.total_pages,
          pageSize: response.data.page_size,
          count: response.data.count
        });
      } else {
        setError('Failed to load leaderboard data.');
      }
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles pagination navigation
   * Validates page number and fetches new data if valid
   * @param {number} newPage - The page number to navigate to
   */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLeaderboardData(newPage);
    }
  };

  /**
   * Formats user display name based on available information
   * Prioritizes full name, then first name, last name, and finally email username
   * @param {Object} user - User object containing name and email information
   * @returns {string} Formatted display name
   */
  const getUserDisplayName = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else if (user.last_name) {
      return user.last_name;
    } else {
      // Extract username from email if no name is available
      return user.email.split('@')[0];
    }
  };

  /**
   * Generates rank icon based on user's position
   * Returns trophy for 1st, silver medal for 2nd, bronze medal for 3rd
   * @param {number} rank - User's rank in the leaderboard
   * @returns {JSX.Element} Icon element representing the rank
   */
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <span className="trophy gold">🏆</span>;
      case 2:
        return <span className="medal silver">🥈</span>;
      case 3:
        return <span className="medal bronze">🥉</span>;
      default:
        return <span className="rank-number">{rank}</span>;
    }
  };

  // Display loading spinner while fetching data
  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="spinner"></div>
        <p>Loading leaderboard data...</p>
      </div>
    );
  }

  // Main component render
  return (
    <div className="page-container">
      <Navbar />
      
      <div className="content-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Kudos Leaderboard</h1>
          </div>
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        
        {/* Leaderboard Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Kudos Received</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((user, index) => (
                <tr 
                  key={`rank-${index + 1}`}
                  className={`${index < 3 ? `rank-${index + 1}` : ''}`} // Special styling for top 3
                >
                  <td className="name-cell">{getUserDisplayName(user)}</td>
                  <td className="email-cell">{user.email}</td>
                  <td className="kudos-cell">{user.kudos_received_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="table-footer">
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="give-kudos-btn button button-kudos"
              >
                Previous
              </button>
              <span className="page-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="give-kudos-btn button button-kudos"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard; 
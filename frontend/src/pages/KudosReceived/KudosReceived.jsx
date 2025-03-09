/**
 * KudosReceived Component
 * Displays a list of kudos received by the current user with pagination support
 * and detailed message viewing functionality.
 */
import React, { useState, useEffect } from 'react';
import { authService } from '../../services/auth.service';
import Layout from '../../components/Layout/Layout';
import { API_CONFIG } from '../../config/api.config';

const KudosReceived = () => {
  // State management for kudos data and UI states
  const [receivedKudos, setReceivedKudos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state configuration
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10
  });

  // State for managing the kudos detail popup
  const [selectedKudos, setSelectedKudos] = useState(null);

  /**
   * Fetches received kudos from the API with pagination support
   * Updates the receivedKudos state and pagination information
   * @param {number} page - The page number to fetch (defaults to 1)
   */
  const fetchReceivedKudos = async (page = 1) => {
    try {
      setLoading(true);
      const response = await authService.get(`${API_CONFIG.ENDPOINTS.KUDOS.RECEIVED}?page=${page}`);
      setReceivedKudos(response.data.data);
      setPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.total_pages,
        pageSize: response.data.page_size
      });
    } catch (err) {
      console.error('Error fetching received kudos:', err);
      setError('Failed to load received kudos');
    } finally {
      setLoading(false);
    }
  };

  // Load received kudos when component mounts
  useEffect(() => {
    fetchReceivedKudos();
  }, []);

  /**
   * Formats a date string into a user-friendly format
   * @param {string} dateString - ISO date string to format
   * @returns {string} Formatted date string with date and time
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Generates a display name for a user
   * @param {Object} user - User object containing first_name and last_name
   * @returns {string} Full name or 'Anonymous User' if no name available
   */
  const getUserFullName = (user) => {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Anonymous User';
  };

  /**
   * Truncates a message if it exceeds the maximum length
   * @param {string} message - The message to truncate
   * @param {number} maxLength - Maximum length before truncation (default: 20)
   * @returns {string} Truncated message with ellipsis or original message
   */
  const truncateMessage = (message, maxLength = 20) => {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return `${message.substring(0, maxLength)}...`;
  };

  /**
   * MessagePopup Component
   * Displays the full kudos message in a modal popup
   * @param {Object} props - Component props
   * @param {Object} props.kudos - The kudos object to display
   * @param {Function} props.onClose - Function to call when closing the popup
   */
  const MessagePopup = ({ kudos, onClose }) => {
    if (!kudos) return null;
    
    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-content" onClick={e => e.stopPropagation()}>
          <div className="popup-header">
            <h3>Kudos Message</h3>
            <button className="close-button" onClick={onClose}>&times;</button>
          </div>
          <div className="popup-body">
            <p className="popup-message">{kudos.message}</p>
            <div className="popup-details">
              <p>From: {getUserFullName(kudos.sender)}</p>
              <p>Date: {formatDate(kudos.created_at)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Display loading spinner while fetching data
  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading received kudos...</p>
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

  // Main component render
  return (
    <Layout>
      <div className="kudos-received-content">
        {/* Page Header */}
        <div className="page-header">
          <h1>Received Kudos</h1>
        </div>

        {/* Kudos Table Container */}
        <div className="table-container">
          {/* Display message if no kudos received */}
          {receivedKudos.length === 0 ? (
            <div className="no-kudos-message">
              <p>You haven't received any kudos yet.</p>
            </div>
          ) : (
            // Kudos Table
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>From</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {receivedKudos.map((kudos) => (
                  <tr key={kudos.id}>
                    <td className="date-column">{formatDate(kudos.created_at)}</td>
                    <td className="sender-column">
                      <div className="sender-info">
                        <span className="sender-name">{getUserFullName(kudos.sender)}</span>
                      </div>
                    </td>
                    <td className="message-column">
                      {truncateMessage(kudos.message)}
                      {/* Show "View More" button for long messages */}
                      {kudos.message.length > 20 && (
                        <button 
                          className="view-more-btn"
                          onClick={() => setSelectedKudos(kudos)}
                        >
                          View More
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Message Popup Modal */}
        {selectedKudos && (
          <MessagePopup 
            kudos={selectedKudos} 
            onClose={() => setSelectedKudos(null)} 
          />
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="give-kudos-btn button button-kudos"
              onClick={() => fetchReceivedKudos(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </button>
            <span className="page-info">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              className="give-kudos-btn button button-kudos"
              onClick={() => fetchReceivedKudos(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default KudosReceived; 
/**
 * Team Component
 * Displays and manages team members, allows giving kudos, and handles user management for organization owners.
 */
import React, { useState, useEffect } from 'react';
import { authService } from '../../services/auth.service';
import Layout from '../../components/Layout/Layout';
import { API_CONFIG } from '../../config/api.config';

const Team = () => {
  // State for managing team members list and loading states
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for managing the "Add Member" modal and form
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    email: '',
    password: '',
    password_confirm: ''
  });
  const [formError, setFormError] = useState(null);

  // Pagination state for team members list
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    count: 0
  });

  // State for managing the "Give Kudos" modal and functionality
  const [kudosModal, setKudosModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [kudosMessage, setKudosMessage] = useState('');
  const [kudosError, setKudosError] = useState(null);
  const [kudosSuccess, setKudosSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  /**
   * Fetches the current user's profile from the API
   * Updates the currentUser state with the latest profile data
   * @returns {Promise<Object|null>} The user profile data or null if fetch fails
   */
  const getCurrentUser = async () => {
    try {
      const response = await authService.get(API_CONFIG.ENDPOINTS.USERS.PROFILE);
      if (response.data?.data?.profile) {
        const profileData = response.data.data.profile;
        setCurrentUser(profileData);
        return profileData;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  };

  // Load user profile when component mounts
  useEffect(() => {
    getCurrentUser();
  }, []);

  // Computed properties based on current user's role and kudos availability
  const isOrgOwner = currentUser?.role === 'org_owner';
  const hasAvailableKudos = currentUser?.kudos_available > 0;

  /**
   * Fetches team members from the API with pagination support
   * Updates the teamMembers state and pagination information
   * @param {number} page - The page number to fetch (defaults to 1)
   */
  const fetchTeamMembers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await authService.get(`${API_CONFIG.ENDPOINTS.USERS.LIST}?page=${page}`);
      setTeamMembers(response.data.data || []);
      setPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.total_pages,
        pageSize: response.data.page_size,
        count: response.data.count
      });
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  // Load team members when component mounts
  useEffect(() => {
    fetchTeamMembers();
  }, []);

  /**
   * Converts role identifiers to display-friendly names
   * @param {string} role - The role identifier from the API
   * @returns {string} The formatted role name for display
   */
  const getRoleDisplayName = (role) => {
    const roleMap = {
      'org_owner': 'Organization Owner',
      'org_member': 'Member',
    };
    return roleMap[role] || role;
  };

  /**
   * Handles input changes in the Add User form
   * @param {Event} e - The input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handles the submission of the Add User form
   * Creates a new user and refreshes the team members list
   * @param {Event} e - The form submission event
   */
  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError(null);

    try {
      await authService.post(
        `${API_CONFIG.ENDPOINTS.USERS.ADD}`,
        formData
      );
      
      // Reset form and close modal on success
      setFormData({
        first_name: '',
        email: '',
        password: '',
        password_confirm: ''
      });
      setShowModal(false);
      
      // Refresh team members list
      fetchTeamMembers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add user');
    }
  };

  /**
   * Handles the submission of kudos to another team member
   * Updates the current user's kudos availability after successful submission
   * @param {Event} e - The form submission event
   */
  const handleGiveKudos = async (e) => {
    e.preventDefault();
    setKudosError(null);
    setKudosSuccess(null);
    setIsSubmitting(true);

    // Validate kudos availability
    if (!hasAvailableKudos) {
      setKudosError("You don't have any kudos available to give");
      setIsSubmitting(false);
      return;
    }

    try {
      // Submit kudos to the selected user
      await authService.post(API_CONFIG.ENDPOINTS.KUDOS.GIVE, {
        receiver: selectedUser.id,
        message: kudosMessage
      });
      
      // Update user profile to reflect new kudos availability
      try {
        const profileResponse = await authService.get(API_CONFIG.ENDPOINTS.USERS.PROFILE);
        if (profileResponse.data?.data?.profile) {
          const profileData = profileResponse.data.data.profile;
          setCurrentUser(profileData); // Update the current user state
        }
      } catch (profileError) {
        console.error('Error updating user profile:', profileError);
        setKudosError('Kudos sent but failed to update profile. Please refresh the page.');
        return;
      }

      // Handle successful kudos submission
      setKudosSuccess('Kudos given successfully!');
      setKudosMessage('');
      
      // Clean up and refresh data after delay
      setTimeout(() => {
        setKudosModal(false);
        setKudosSuccess(null);
        setSelectedUser(null);
        fetchTeamMembers(); // Refresh team members list
      }, 2000);
    } catch (err) {
      // Handle various error cases
      console.error('Error giving kudos:', err.response?.data);
      let errorMessage;
      if (err.response?.data?.errors) {
        // Extract specific validation errors
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

  /**
   * Opens the kudos modal for a specific user
   * Validates kudos availability before opening
   * @param {Object} user - The user to give kudos to
   */
  const openKudosModal = (user) => {
    if (!hasAvailableKudos) {
      setKudosError("You don't have any kudos available to give");
      return;
    }
    setSelectedUser(user);
    setKudosModal(true);
    setKudosError(null);
    setKudosSuccess(null);
    setKudosMessage('');
  };

  // Loading state UI
  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading team members...</p>
        </div>
      </Layout>
    );
  }

  // Error state UI
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
      <div className="team-content">
        {/* Header section with kudos count and add member button */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Team Members</h1>
            <div className="header-actions">
              <div className="kudos-available">
                Available Kudos: <span className={hasAvailableKudos ? 'kudos-count' : 'kudos-count-zero'}>
                  {currentUser?.kudos_available || 0}
                </span>
              </div>
              {isOrgOwner && (
                <button
                  className="give-kudos-btn button button-kudos"
                  onClick={() => setShowModal(true)}
                >
                  Add Member
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Team members table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Organization</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td className="name-cell">
                    {member.first_name} {member.last_name}
                  </td>
                  <td className="email-cell">{member.email}</td>
                  <td>{member.organization}</td>
                  <td>
                    <span className={`role-badge ${member.role}`}>
                      {getRoleDisplayName(member.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${member.is_active ? 'active' : 'inactive'}`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {/* Conditional rendering of action buttons based on user state */}
                    {member.id === currentUser?.id ? (
                      <button className="button button-self" disabled>You</button>
                    ) : member.is_active ? (
                      hasAvailableKudos ? (
                        <button
                          className="give-kudos-btn button button-kudos"
                          onClick={() => openKudosModal(member)}
                          title="Give Kudos"
                        >
                          Give Kudos
                        </button>
                      ) : (
                        <button
                          className="give-kudos-btn button button-kudos"
                          disabled
                          title="No kudos available to give"
                        >
                          No Kudos Available
                        </button>
                      )
                    ) : (
                      <button
                        className="give-kudos-btn button button-kudos"
                        disabled
                      >
                        Inactive User
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="give-kudos-btn button button-kudos"
              onClick={() => fetchTeamMembers(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </button>
            <span className="page-info">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              className="give-kudos-btn button button-kudos"
              onClick={() => fetchTeamMembers(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </button>
          </div>
        )}

        {/* Add User Modal - Only render if user is org_owner */}
        {isOrgOwner && showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Add New User</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAddUser}>
                {formError && (
                  <div className="error-message mb-4">
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password_confirm">Confirm Password</label>
                  <input
                    type="password"
                    id="password_confirm"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Give Kudos Modal */}
        {kudosModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Give Kudos to {selectedUser.first_name} {selectedUser.last_name}</h2>
                <button
                  className="icon-button close-icon"
                  onClick={() => setKudosModal(false)}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              
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

                <div className="form-group">
                  <label htmlFor="kudos-message">Message</label>
                  <textarea
                    id="kudos-message"
                    name="message"
                    value={kudosMessage}
                    onChange={(e) => setKudosMessage(e.target.value)}
                    required
                    rows="4"
                    placeholder="Write your kudos message here..."
                    className="form-textarea"
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setKudosModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={!kudosMessage.trim()}
                  >
                    Send Kudos
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Team;
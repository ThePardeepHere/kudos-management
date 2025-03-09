/**
 * Authentication Service Class
 * Handles all authentication-related operations including:
 * - Token management (access & refresh tokens)
 * - User authentication state
 * - API request interceptors
 * - Token refresh logic
 */
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

class AuthService {
  /**
   * Initialize the authentication service with:
   * - Custom axios instance
   * - Token management
   * - Request/Response interceptors
   */
  constructor() {
    // Create axios instance with default configuration
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: 30000, // Fixed: 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize tokens from localStorage for persistence across page reloads
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.isRefreshing = false;
    // Queue for storing failed requests during token refresh
    this.failedQueue = [];

    // Set up request/response interceptors
    this.setupInterceptors();
  }

  /**
   * Process queued requests after token refresh
   * @param {Error} error - Error object if token refresh failed
   * @param {string} token - New access token if refresh successful
   */
  processQueue(error, token = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  /**
   * Configure axios interceptors for:
   * 1. Adding authentication headers to requests
   * 2. Handling token refresh on 401 errors
   * 3. Queuing failed requests during token refresh
   */
  setupInterceptors() {
    // Request interceptor - Add Authorization header
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Skip refresh logic if not 401 or already retried
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        // If already refreshing, queue the failed request
        if (this.isRefreshing) {
          try {
            const token = await new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            });
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.axiosInstance(originalRequest);
          } catch (err) {
            return Promise.reject(err);
          }
        }

        // Attempt token refresh
        originalRequest._retry = true;
        this.isRefreshing = true;

        try {
          const newTokens = await this.refreshTokens();
          this.processQueue(null, newTokens.access_token);
          originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
          return this.axiosInstance(originalRequest);
        } catch (refreshError) {
          this.processQueue(refreshError, null);
          // Clear authentication state on refresh failure
          this.clearTokens();
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          this.isRefreshing = false;
        }
      }
    );
  }

  /**
   * Store authentication tokens in memory and localStorage
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   */
  setTokens(accessToken, refreshToken) {
    console.debug('Setting new tokens');
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    // Verify token storage success
    const storedAccess = localStorage.getItem('access_token');
    const storedRefresh = localStorage.getItem('refresh_token');
    if (!storedAccess || !storedRefresh) {
      console.error('Failed to store tokens');
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Refresh authentication tokens using the refresh token
   * @returns {Promise<Object>} New access and refresh tokens
   */
  async refreshTokens() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        API_CONFIG.ENDPOINTS.AUTH.REFRESH,
        { refresh_token: this.refreshToken },
        {
          baseURL: API_CONFIG.BASE_URL,
          timeout: 30000,
        }
      );

      const { access_token, refresh_token } = response.data.data;
      
      if (!access_token || !refresh_token) {
        throw new Error('Invalid token response');
      }

      this.setTokens(access_token, refresh_token);
      return { access_token, refresh_token };
    } catch (error) {
      // Clear authentication state on refresh failure
      this.clearTokens();
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Token refresh failed'
      );
    }
  }

  /**
   * Check if user is currently authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return !!this.accessToken;
  }

  /**
   * Authenticate user with credentials
   * @param {Object} credentials - User login credentials
   * @returns {Promise<Object>} Authentication response data
   */
  async login(credentials) {
    try {
      const response = await this.axiosInstance.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
      
      if (response.data?.data) {
        const { access_token, refresh_token, user } = response.data.data;
        console.log(access_token, refresh_token, user);
        // Clear existing authentication state
        this.clearTokens();
        localStorage.removeItem('user');
        
        // Set new authentication state
        this.setTokens(access_token, refresh_token);
        this.setUserData(user);
        
        // Verify authentication success
        if (!this.isAuthenticated()) {
          throw new Error('Authentication failed after login');
        }
        
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      // Ensure clean state on login failure
      this.clearTokens();
      localStorage.removeItem('user');
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user account
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} password_confirm - Password confirmation
   * @param {string} first_name - User first name
   * @param {string} last_name - User last name
   * @param {string} organization_name - Organization name
   * @returns {Promise<Object>} Registration response data
   */
  async register(email, password, password_confirm, first_name, last_name, organization_name) {
    const response = await this.axiosInstance.post(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, {
      email,
      password,
      password_confirm,
      first_name,
      last_name,
      organization_name
    });
    if (response.data.data) {
      const { access_token, refresh_token, user } = response.data.data;
      this.setTokens(access_token, refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  }

  /**
   * Clear authentication state and log out user
   */
  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  /**
   * Wrapper methods for authenticated API requests
   */
  get(url, config = {}) {
    return this.axiosInstance.get(url, config);
  }

  post(url, data, config = {}) {
    return this.axiosInstance.post(url, data, config);
  }

  put(url, data, config = {}) {
    return this.axiosInstance.put(url, data, config);
  }

  delete(url, config = {}) {
    return this.axiosInstance.delete(url, config);
  }

  /**
   * Clear authentication tokens from memory and storage
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Store user data in localStorage with proper formatting
   * @param {Object} user - User data object
   */
  setUserData(user) {
    // Format and store complete user profile
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      organization: user.organization,
      role: user.role,
      kudosAvailable: user.kudos_available,
      isActive: user.is_active,
      groups: user.groups
    };
    localStorage.setItem('user', JSON.stringify(userData));
    // Verify user data storage
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      console.error('Failed to store user data');
      throw new Error('Failed to store user data');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
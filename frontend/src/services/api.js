/**
 * API Service Module
 * Provides a simplified interface for making authenticated HTTP requests
 * Wraps the authService methods to maintain consistent API access throughout the application
 */
import { authService } from './auth.service';

/**
 * API object containing wrapper methods for HTTP requests
 * All methods automatically include authentication and token refresh handling
 * @type {Object}
 */
const api = {
  /**
   * Make authenticated GET request
   * @param {string} url - The endpoint URL
   * @param {Object} config - Optional axios configuration
   * @returns {Promise<Object>} API response
   */
  get: (url, config = {}) => authService.get(url, config),

  /**
   * Make authenticated POST request
   * @param {string} url - The endpoint URL
   * @param {Object} data - Request payload
   * @param {Object} config - Optional axios configuration
   * @returns {Promise<Object>} API response
   */
  post: (url, data, config = {}) => authService.post(url, data, config),

  /**
   * Make authenticated PUT request
   * @param {string} url - The endpoint URL
   * @param {Object} data - Request payload
   * @param {Object} config - Optional axios configuration
   * @returns {Promise<Object>} API response
   */
  put: (url, data, config = {}) => authService.put(url, data, config),

  /**
   * Make authenticated DELETE request
   * @param {string} url - The endpoint URL
   * @param {Object} config - Optional axios configuration
   * @returns {Promise<Object>} API response
   */
  delete: (url, config = {}) => authService.delete(url, config),
};

export default api; 
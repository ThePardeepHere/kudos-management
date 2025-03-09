import React, { useState, useEffect } from 'react';
import { authService } from '../../services/auth.service';
import { Link, useNavigate } from 'react-router-dom';


const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [formTouched, setFormTouched] = useState({
    email: false,
    password: false
  });
  const [emailValidation, setEmailValidation] = useState({
    isValid: false,
    isTouched: false
  });

  const navigate = useNavigate();

  // Validate email on change
  useEffect(() => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    setEmailValidation({
      isValid: emailRegex.test(formData.email),
      isTouched: formTouched.email
    });
  }, [formData.email, formTouched.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setFormTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const isFormValid = () => {
    return emailValidation.isValid && formData.password.length > 0;
  };

  // Helper function to parse API error responses
  const parseErrorResponse = (error) => {
    if (!error.response) {
      return 'Network error. Please check your connection and try again.';
    }

    const { data } = error.response;
    
    // Handle structured error responses based on custom_messages.py format
    if (data) {
      // Check for specific error types from custom_messages.py
      if (data.status_code === 401) {
        if (data.action === 'unauthorized') {
          return 'Authentication required. Please log in.';
        }
        if (data.action === 'token_invalid') {
          return 'Your session has expired. Please log in again.';
        }
        // Generic 401 error
        return 'Invalid credentials. Please check your email and password.';
      }
      
      if (data.status_code === 400 && data.action === 'validation_error') {
        // If there are specific field errors in the response
        if (data.errors) {
          const errorMessages = [];
          
          // Handle email errors
          if (data.errors.email) {
            errorMessages.push(`Email: ${Array.isArray(data.errors.email) ? data.errors.email.join(', ') : data.errors.email}`);
          }
          
          // Handle password errors
          if (data.errors.password) {
            errorMessages.push(`Password: ${Array.isArray(data.errors.password) ? data.errors.password.join(', ') : data.errors.password}`);
          }
          
          // Handle non-field errors
          if (data.errors.non_field_errors) {
            errorMessages.push(Array.isArray(data.errors.non_field_errors) ? data.errors.non_field_errors.join(', ') : data.errors.non_field_errors);
          }
          
          return errorMessages.length > 0 ? errorMessages.join('\n') : 'Validation error occurred';
        }
        return data.message || 'Validation error occurred';
      }
      
      if (data.status_code === 404) {
        return 'Account not found. Please check your credentials or register.';
      }
      
      if (data.status_code === 403) {
        return 'You do not have permission to access this resource.';
      }
      
      if (data.status_code === 500) {
        return 'Server error occurred. Please try again later.';
      }
      
      // If there's a message in the response, use it
      if (data.message) {
        return data.message;
      }
    }
    
    // Default error message
    return 'Login failed. Please check your credentials and try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setFormTouched({
      email: true,
      password: true
    });
    
    if (!isFormValid()) {
      if (!emailValidation.isValid) {
        setError('Please enter a valid email address');
        return;
      }
      
      if (formData.password.length === 0) {
        setError('Please enter your password');
        return;
      }
      
      return;
    }
    
    setError('');
    setLoading(true);

    const attemptLogin = async (retryAttempt = 0) => {
      try {
        const response = await authService.login({
          email: formData.email,
          password: formData.password,
        });

        // Handle successful login
        if (response?.data) {
          setLoading(false);
          setError('');
          // Use navigate with replace to prevent back navigation to login
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (error) {
        // Network or connection errors
        if (!error.response) {
          if (retryAttempt < 2) { // Allow up to 2 retries
            setError('Connection issue. Retrying...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            setRetryCount(retryAttempt + 1);
            return attemptLogin(retryAttempt + 1);
          } else {
            setError('Network error. Please check your internet connection and try again.');
          }
        } else if (error.response?.data) {
          const { status_code, action, errors } = error.response.data;
          
          if (status_code === 400 && action === 'validation_error') {
            if (errors.detail) {
              setError(errors.detail);
            } else if (errors.email) {
              setError(Array.isArray(errors.email) ? errors.email.join(', ') : errors.email);
            } else if (errors.password) {
              setError(Array.isArray(errors.password) ? errors.password.join(', ') : errors.password);
            } else {
              setError('Invalid credentials. Please try again.');
            }
          } else if (status_code === 401) {
            setError('Invalid email or password. Please try again.');
          } else if (status_code === 429) {
            setError('Too many login attempts. Please try again later.');
          } else {
            setError('An unexpected error occurred. Please try again.');
          }
        } else {
          setError('Unable to connect to the server. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    await attemptLogin();
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="form-container">
          <div className="form-header">
            <h2>Welcome back</h2>
            <p className="form-subtitle">Sign in to your Kudos account</p>
          </div>
          
          {error && (
            <div className="alert alert-danger">
              {error.split('\n').map((line, index) => (
                <div key={index}>{line}{retryCount > 0 && line.includes('Retrying') && ` (Attempt ${retryCount}/2)`}</div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="john.doe@example.com"
                required
                className={formTouched.email && !emailValidation.isValid ? "invalid-input" : ""}
              />
              {formTouched.email && !emailValidation.isValid && formData.email && (
                <div className="helper-text invalid">Please enter a valid email address</div>
              )}
            </div>

            <div className="form-group password-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  type={passwordVisible ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  required
                  className={formTouched.password && formData.password.length === 0 ? "invalid-input" : ""}
                />
                <button 
                  type="button" 
                  className="password-toggle" 
                  onClick={togglePasswordVisibility}
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                >
                  {passwordVisible ? "Hide" : "Show"}
                </button>
              </div>
            </div>

          

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  <span>Signing in...</span>
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="form-footer">
              <p>
                Don't have an account? <Link to="/register">Create account</Link>
              </p>
             
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 
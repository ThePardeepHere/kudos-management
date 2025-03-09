import React, { useState, useEffect } from 'react';
import { authService } from '../../services/auth.service';
import { Link } from 'react-router-dom';


const Register = () => {
  // Step 1: Initialize State Variables
  // Form data state for user input
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    organization_name: '',
  });

  // State variables for form handling and validation
  const [error, setError] = useState('');                    // Error messages
  const [success, setSuccess] = useState('');                // Success messages
  const [loading, setLoading] = useState(false);             // Loading state
  const [passwordVisible, setPasswordVisible] = useState(false);  // Toggle password visibility
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  // Password validation criteria tracking
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    hasNumber: false,
    hasSpecial: false,
    hasUppercase: false,
    matches: false
  });

  // Email validation state
  const [emailValidation, setEmailValidation] = useState({
    isValid: false,
    isTouched: false
  });

  // Track which form fields have been interacted with
  const [formTouched, setFormTouched] = useState({
    email: false,
    password: false,
    password_confirm: false
  });

  // Step 2: Set up Effect Hooks for Real-time Validation
  // Password validation effect
  useEffect(() => {
    const { password, password_confirm } = formData;
    setPasswordValidation({
      length: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      matches: password === password_confirm && password_confirm !== ''
    });
  }, [formData.password, formData.password_confirm]);

  // Email validation effect
  useEffect(() => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    setEmailValidation({
      isValid: emailRegex.test(formData.email),
      isTouched: formTouched.email
    });
  }, [formData.email, formTouched.email]);

  // Step 3: Form Event Handlers
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle input blur (when field loses focus)
  const handleBlur = (e) => {
    const { name } = e.target;
    setFormTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  // Toggle password visibility handlers
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  // Step 4: Form Validation
  // Check if all form requirements are met
  const isFormValid = () => {
    const { length, hasNumber, hasSpecial, hasUppercase, matches } = passwordValidation;
    return length && hasNumber && hasSpecial && hasUppercase && matches && emailValidation.isValid;
  };

  // Step 5: Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched when form is submitted
    setFormTouched({
      email: true,
      password: true,
      password_confirm: true
    });
    
    // Validate form before submission
    if (!isFormValid()) {
      if (!emailValidation.isValid) {
        setError('Please enter a valid email address');
        return;
      }
      if (!passwordValidation.matches) {
        setError('Passwords do not match');
        return;
      }
      setError('Password does not meet all requirements');
      return;
    }
    
    // Reset error and success messages, set loading state
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Extract form data for API call
      const { email, password, password_confirm, first_name, last_name, organization_name } = formData;
      
      // Make API call to register user
      const response = await authService.register(
        email,
        password,
        password_confirm,
        first_name,
        last_name,
        organization_name
      );
      
      // Handle successful registration
      if (response.status_code === 201) {
        setSuccess('Registration successful! Please login to your account.');
        // Reset form state
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          password: '',
          password_confirm: '',
          organization_name: '',
        });
        setFormTouched({
          email: false,
          password: false,
          password_confirm: false
        });
      }
    } catch (err) {
      // Handle registration errors
      const errorResponse = err.response?.data;
      
      if (errorResponse?.errors?.detail) {
        const details = errorResponse.errors.detail;
        
        // Display specific error messages based on the error type
        if (details.email) {
          setError(details.email[0]);
        } else if (details.organization_name) {
          setError(details.organization_name[0]);
        } else {
          // Handle any other validation errors
          const firstError = Object.values(details)[0][0];
          setError(firstError);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Render Component
  return (
    <div className="register-page">
      <div className="register-container">
        <div className="form-container">
          <div className="form-header">
            <h2>Create your account</h2>
            <p className="form-subtitle">Join thousands of teams using Kudos</p>
          </div>
          
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

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

            <div className="form-group">
              <label htmlFor="organization_name">Organization Name</label>
              <input
                type="text"
                id="organization_name"
                name="organization_name"
                value={formData.organization_name}
                onChange={handleChange}
                placeholder="Acme Inc."
                required
              />
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
                  placeholder="At least 8 characters"
                  required
                  minLength="8"
                  className={formTouched.password && !passwordValidation.length ? "invalid-input" : ""}
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
              <div className="password-requirements">
                <p>Requirements:</p>
                <ul>
                  <li className={passwordValidation.length ? "valid" : "invalid"}>8+ chars</li>
                  <li className={passwordValidation.hasUppercase ? "valid" : "invalid"}>Uppercase</li>
                  <li className={passwordValidation.hasNumber ? "valid" : "invalid"}>Number</li>
                  <li className={passwordValidation.hasSpecial ? "valid" : "invalid"}>Special char</li>
                </ul>
              </div>
            </div>

            <div className="form-group password-group">
              <label htmlFor="password_confirm">Confirm Password</label>
              <div className="password-input-container">
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  id="password_confirm"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Confirm your password"
                  required
                  minLength="8"
                  className={formTouched.password_confirm && !passwordValidation.matches && formData.password_confirm ? "invalid-input" : ""}
                />
                <button 
                  type="button" 
                  className="password-toggle" 
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={confirmPasswordVisible ? "Hide password" : "Show password"}
                >
                  {confirmPasswordVisible ? "Hide" : "Show"}
                </button>
              </div>
              {formData.password_confirm && (
                <div className="helper-text">
                  {passwordValidation.matches ? (
                    <span className="helper-text valid">Passwords match</span>
                  ) : (
                    <span className="helper-text invalid">Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="give-kudos-btn button button-kudos"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  <span>Creating account...</span>
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="form-footer">
              <p>
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register; 
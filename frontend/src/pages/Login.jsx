import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <h1 className="login-title">I&D Hub</h1>
            <p className="login-subtitle">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img className="login-logo-icon" src="/AAI_logo.jpg" alt="AAI Logo" />
          <h1 className="login-title">I&D Hub</h1>
          <p className="login-subtitle">Innovation & Development Hub</p>
          <p className="login-department">Innovation & Development Department</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label className="login-label">Login Email :</label>
            <input
              type="email"
              className="login-input"
              placeholder="your@idd.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="login-input-group">
            <label className="login-label">Password :</label>
            <div className="login-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn login-btn--admin" disabled={loading}>
            {loading ? 'Processing...' : 'Login'}
          </button>

          <div className="login-secondary-btns">
            <button type="button" className="login-btn login-btn--guest">
              Guest
            </button>
            <button type="button" className="login-btn login-btn--project">
              Project Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, login, guestLogin, projectLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('admin'); // 'admin' or 'project'

  // Project login fields
  const [projectId, setProjectId] = useState('');
  const [projectPassword, setProjectPassword] = useState('');
  const [showProjectPassword, setShowProjectPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (loginMode === 'admin') {
      if (!email.trim() || !password.trim()) {
        setError('Please enter your email and password');
        return;
      }
      setLoading(true);
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
      }
    } else {
      if (!projectId.trim() || !projectPassword.trim()) {
        setError('請輸入 Project ID 和密碼');
        return;
      }
      setLoading(true);
      const result = await projectLogin(projectId.trim(), projectPassword.trim());
      if (!result.success) {
        setError(result.error);
        setLoading(false);
      }
      // On success, will redirect via isAuthenticated effect
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

        {/* Tab switcher */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${loginMode === 'admin' ? 'login-tab--active' : ''}`}
            onClick={() => { setLoginMode('admin'); setError(''); }}
          >
            Admin Login
          </button>
          <button
            type="button"
            className={`login-tab ${loginMode === 'project' ? 'login-tab--active' : ''}`}
            onClick={() => { setLoginMode('project'); setError(''); }}
          >
            Project Login
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>

          {loginMode === 'admin' ? (
            <>
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
                <button type="button" className="login-btn login-btn--guest" onClick={guestLogin}>
                  Guest
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="login-input-group">
                <label className="login-label">Project ID :</label>
                <input
                  type="text"
                  className="login-input"
                  placeholder="e.g. P2025-001"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="login-input-group">
                <label className="login-label">Password :</label>
                <div className="login-password-wrapper">
                  <input
                    type={showProjectPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Enter project password"
                    value={projectPassword}
                    onChange={(e) => setProjectPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="login-toggle-pw"
                    onClick={() => setShowProjectPassword(!showProjectPassword)}
                  >
                    {showProjectPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && <p className="login-error">{error}</p>}

              <button type="submit" className="login-btn login-btn--project" disabled={loading}>
                {loading ? 'Verifying...' : 'Login to Project'}
              </button>

              <p className="login-hint">
                Project ID 和密碼由系統管理員提供
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
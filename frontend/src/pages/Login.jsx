import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, signInWithEmailAndPassword, sendPasswordResetEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from '../firebase';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, login, guestLogin, projectLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('admin'); // 'admin' | 'project' | 'forgot' | 'change-password'

  // Project login fields
  const [projectId, setProjectId] = useState('');
  const [projectPassword, setProjectPassword] = useState('');
  const [showProjectPassword, setShowProjectPassword] = useState(false);

  // Forgot / Change password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [changeEmail, setChangeEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

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
    } else if (loginMode === 'project') {
      if (!projectId.trim() || !projectPassword.trim()) {
        setError('請輸入 Login ID 和密碼');
        return;
      }
      setLoading(true);
      const result = await projectLogin(projectId.trim(), projectPassword.trim());
      if (!result.success) {
        setError(result.error);
        setLoading(false);
      }
      // On success, will redirect via isAuthenticated effect
    } else if (loginMode === 'forgot') {
      handleForgotPassword();
    } else if (loginMode === 'change-password') {
      handleChangePassword();
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setSuccessMsg('重設密碼電郵已發送！請檢查你的收件箱。');
      // Switch back to admin login after success
      setTimeout(() => {
        setLoginMode('admin');
        setSuccessMsg('');
        setLoading(false);
      }, 3000);
    } catch (err) {
      let msg = '發送失敗';
      switch (err.code) {
        case 'auth/user-not-found': msg = '找不到此用戶'; break;
        case 'auth/invalid-email': msg = '無效的電郵地址'; break;
        default: msg = err.message;
      }
      setError(msg);
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!changeEmail.trim() || !oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('請填寫所有欄位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('兩次輸入的新密碼不一致');
      return;
    }
    if (newPassword.length < 6) {
      setError('新密碼最少需要 6 個字元');
      return;
    }
    setLoading(true);
    try {
      // Sign in with old password to verify identity and get current user
      const credential = await signInWithEmailAndPassword(auth, changeEmail.trim(), oldPassword);
      const user = credential.user;

      // Re-authenticate with the credential (required before updatePassword)
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(changeEmail.trim(), oldPassword));

      // Update the password
      await updatePassword(user, newPassword);

      setSuccessMsg('密碼已成功更改！');
      setTimeout(() => {
        setLoginMode('admin');
        setSuccessMsg('');
        setLoading(false);
        setChangeEmail('');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 3000);
    } catch (err) {
      let msg = '更改密碼失敗';
      switch (err.code) {
        case 'auth/user-not-found': msg = '找不到此用戶'; break;
        case 'auth/wrong-password': msg = '舊密碼錯誤'; break;
        case 'auth/invalid-credential': msg = '電郵或舊密碼錯誤'; break;
        case 'auth/too-many-requests': msg = '嘗試次數過多，請稍後再試'; break;
        default: msg = err.message;
      }
      setError(msg);
      setLoading(false);
    }
  };

  const switchMode = (mode) => {
    setLoginMode(mode);
    setError('');
    setSuccessMsg('');
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

        {/* Tab switcher (hidden in forgot/change modes) */}
        {['admin', 'project'].includes(loginMode) && (
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab ${loginMode === 'admin' ? 'login-tab--active' : ''}`}
              onClick={() => switchMode('admin')}
            >
              Admin Login
            </button>
            <button
              type="button"
              className={`login-tab ${loginMode === 'project' ? 'login-tab--active' : ''}`}
              onClick={() => switchMode('project')}
            >
              Project Login
            </button>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>

          {loginMode === 'admin' && (
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

              <div className="login-secondary-links">
                <button type="button" className="login-btn login-btn--link" onClick={() => switchMode('forgot')}>
                  Forgot Password?
                </button>
                <button type="button" className="login-btn login-btn--link" onClick={() => switchMode('change-password')}>
                  Change Password
                </button>
              </div>

              <div className="login-secondary-btns">
                <button type="button" className="login-btn login-btn--guest" onClick={guestLogin}>
                  Guest
                </button>
              </div>
            </>
          )}

          {loginMode === 'project' && (
            <>
              <div className="login-input-group">
                <label className="login-label">Project ID :</label>
                <input
                  type="text"
                  className="login-input"
                  placeholder="e.g. IDND2608002pm / IDND2608002owner"
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
                Login ID（Project ID + pm / owner）和密碼由系統管理員提供
              </p>
            </>
          )}

          {loginMode === 'forgot' && (
            <>
              <h2 className="login-mode-title">🔑 重設密碼</h2>
              <div className="login-input-group">
                <label className="login-label">Login Email :</label>
                <input
                  type="email"
                  className="login-input"
                  placeholder="your@idd.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoFocus
                />
              </div>

              {error && <p className="login-error">{error}</p>}
              {successMsg && <p className="login-success">{successMsg}</p>}

              <button type="submit" className="login-btn login-btn--admin" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="login-secondary-links login-secondary-links--single">
                <button type="button" className="login-btn login-btn--link" onClick={() => switchMode('admin')}>
                  ← Back to Login
                </button>
              </div>
            </>
          )}

          {loginMode === 'change-password' && (
            <>
              <h2 className="login-mode-title">🔒 更改密碼</h2>
              <div className="login-input-group">
                <label className="login-label">Login Email :</label>
                <input
                  type="email"
                  className="login-input"
                  placeholder="your@idd.com"
                  value={changeEmail}
                  onChange={(e) => setChangeEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="login-input-group">
                <label className="login-label">Current Password :</label>
                <input
                  type="password"
                  className="login-input"
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>

              <div className="login-input-group">
                <label className="login-label">New Password :</label>
                <input
                  type="password"
                  className="login-input"
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="login-input-group">
                <label className="login-label">Confirm New Password :</label>
                <input
                  type="password"
                  className="login-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && <p className="login-error">{error}</p>}
              {successMsg && <p className="login-success">{successMsg}</p>}

              <button type="submit" className="login-btn login-btn--admin" disabled={loading}>
                {loading ? 'Updating...' : 'Change Password'}
              </button>

              <div className="login-secondary-links login-secondary-links--single">
                <button type="button" className="login-btn login-btn--link" onClick={() => switchMode('admin')}>
                  ← Back to Login
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './Login.scss';

interface LoginProps {
  onLogin: (loginId: string, password: string) => void;
  error?: string;
  loading?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, error, loading }) => {
  const { setTheme } = useTheme();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Force dark theme for login screen
    setTheme('dark');
  }, [setTheme]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(loginId, password);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <svg viewBox="0 0 24 24" className="logo-icon">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1>CES</h1>
          <p>Please sign in to continue</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginId">Login ID</label>
            <input
              type="text"
              id="loginId"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Enter your login ID"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Demo credentials: presales / presales</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.scss';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="theme-toggle-track">
        <div className={`theme-toggle-thumb ${theme === 'dark' ? 'dark' : 'light'}`}>
          <span className="material-symbols-outlined">
            {theme === 'light' ? 'light_mode' : 'dark_mode'}
          </span>
        </div>
      </div>
    </button>
  );
};

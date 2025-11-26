import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  loginId: string;
  loginTime: Date;
}

interface AuthContextType {
  user: User | null;
  login: (loginId: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Check if session is still valid (24 hours)
        const loginTime = new Date(userData.loginTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          setUser(userData);
        } else {
          localStorage.removeItem('user');
        }
      } catch (err) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (loginId: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple authentication logic for demo
    if (loginId === 'presales' && password === 'presales') {
      const userData: User = {
        loginId,
        loginTime: new Date(),
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setLoading(false);
      return true;
    } else {
      setError('Invalid login credentials');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setError(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

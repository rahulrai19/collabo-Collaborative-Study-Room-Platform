import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

/**
 * Context that provides authentication state throughout the React application.
 * Manages JWT tokens, user data, and the global Socket.io connection instance.
 */
const AuthContext = createContext(null);

/**
 * Provider component that wraps the application to supply AuthContext.
 * Automatically checks for an existing JWT token on mount and fetches user data.
 * 
 * @param {Object} props - React props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          connectSocket(token);
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Logs in a user by saving their token, updating state, and initializing sockets.
   * @param {String} token - JWT authentication token
   * @param {Object} userData - User object containing ID, username, email, etc.
   */
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    connectSocket(token);
  };

  /**
   * Logs out the user, clearing local storage and severing the socket connection.
   */
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    disconnectSocket();
  };

  /**
   * Updates partial fields on the current user object in state (e.g., changing avatar).
   * @param {Object} updates - Object containing fields to update
   */
  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to consume the AuthContext.
 * @returns {{ user: Object|null, loading: Boolean, login: Function, logout: Function, updateUser: Function }}
 */
export const useAuth = () => useContext(AuthContext);

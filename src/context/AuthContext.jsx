import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const res = await api.get('/users/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to restore session', err);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (err) {
        console.error('Logout error', err);
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('eir_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('eir_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate the stored token on load; clears stale sessions automatically.
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUser(res.data))
      .catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('eir_token');
        localStorage.removeItem('eir_user');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem('eir_token', nextToken);
    localStorage.setItem('eir_user', JSON.stringify(nextUser));
  };

  const login = useCallback(async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    persist(res.data.token, res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async ({ full_name, email, password, confirm_password }) => {
    const res = await client.post('/auth/register', { full_name, email, password, confirm_password });
    persist(res.data.token, res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('eir_token');
    localStorage.removeItem('eir_user');
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

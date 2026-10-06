import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const homeFor = (role) =>
  ({ PATIENT: '/patient', DOCTOR: '/doctor', ADMIN: '/admin' })[role] || '/login';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ask the server who we are (uses the saved token)
  async function loadMe() {
    const res = await api.get('/auth/me');
    setUser(res.data.user);
    setProfile(res.data.profile);
    return res.data.user;
  }

  // When the app opens, restore the session if a token exists
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    loadMe()
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  // The API layer fires this when the server rejects our token (401)
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setProfile(null);
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  // Used by both login and register (both return { token, user })
  async function startSession(token) {
    localStorage.setItem('token', token);
    return loadMe();
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    return startSession(res.data.token);
  }

  async function register(form) {
    const res = await api.post('/auth/register', form);
    return startSession(res.data.token);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, register, logout, refresh: loadMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

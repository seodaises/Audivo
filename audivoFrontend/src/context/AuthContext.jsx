import { createContext, useContext, useState } from 'react';
import { api, setToken, clearToken } from '../api/client';
import { ROLES } from '../auth/permissions';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const shapeUser = (u) => {
  const key = (u.role || '').toLowerCase().replace(/\s+/g, '_');
  const role = ROLES[key] || { key, label: u.role || 'Unknown', level: 0, permissions: [] };
  return {
    id: u.id, name: u.displayName, email: u.email,
    role: role.label, roleKey: role.key, level: role.level,
    permissions: role.permissions, isVerified: u.isVerified,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('audivo-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Shared: store token + shaped user. Used by both login and register.
  const applySession = (data) => {
    setToken(data.token);
    const shaped = shapeUser(data.user);
    setUser(shaped);
    localStorage.setItem('audivo-user', JSON.stringify(shaped));
  };

  const login = async (email, password) => {
    setLoading(true); setError(null);
    try {
      const { data } = await api('/auth/login', { method: 'POST', body: { email, password } });
      applySession(data);
      return true;
    } catch (err) { setError(err.message); return false; }
    finally { setLoading(false); }
  };

  // Register, then log straight in. (When you enable email verification later,
  // swap the auto-login for a "check your email" screen instead.)
  const register = async (displayName, email, password) => {
    setLoading(true); setError(null);
    try {
      await api('/auth/register', { method: 'POST', body: { displayName, email, password } });
      const { data } = await api('/auth/login', { method: 'POST', body: { email, password } });
      applySession(data);
      return true;
    } catch (err) { setError(err.message); return false; }
    finally { setLoading(false); }
  };

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* cleared regardless */ }
    clearToken();
    localStorage.removeItem('audivo-user');
    setUser(null);
  };

  const can = (permission) => !!user?.permissions?.includes(permission);

  return (
    <AuthContext.Provider value={{ user, error, loading, login, register, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}
import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.me()
        .then(r => { setUser(r.data); localStorage.setItem('user', JSON.stringify(r.data)); })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await authApi.login(email, password);
    localStorage.setItem('token', r.data.access_token);
    localStorage.setItem('user', JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin      = user?.role === 'admin' || isSuperAdmin;
  const isResident   = user?.role === 'resident';
  const isStaff      = user?.role === 'staff';

  // The society ID this user operates on.
  // SuperAdmin defaults to 1 (can be overridden via header selector).
  // Admin/Resident are locked to their own society.
  const [activeSocietyId, setActiveSocietyId] = useState(
    () => user?.society_id ?? 1
  );

  // When user changes (login/logout), reset activeSocietyId
  useEffect(() => {
    setActiveSocietyId(user?.society_id ?? 1);
  }, [user?.id]);

  const sid = isSuperAdmin ? activeSocietyId : (user?.society_id ?? 1);

  return (
    <AuthContext.Provider value={{
      user, login, logout, loading,
      isSuperAdmin, isAdmin, isResident, isStaff,
      sid,                          // active society id for API calls
      activeSocietyId, setActiveSocietyId,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

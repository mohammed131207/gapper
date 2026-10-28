import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { useI18n } from './i18n.jsx';

const AuthContext = createContext(null);
const EMPTY_META = { programs: [], categories: [], years: [], levels: [] };

export function AuthProvider({ children }) {
  const { lang } = useI18n();
  // undefined = still checking the session, null = signed out.
  const [user, setUser] = useState(undefined);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    api('/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null));
  }, []);

  // Category, program and year names come translated from the server.
  useEffect(() => {
    let alive = true;
    api('/meta').then((m) => alive && setMeta(m)).catch(() => alive && setMeta((m) => m || EMPTY_META));
    return () => { alive = false; };
  }, [lang]);

  const login = useCallback(async (email, password, remember) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password, remember } });
    setUser(d.user);
    return d.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const d = await api('/auth/register', { method: 'POST', body: { name, email, password } });
    setUser(d.user);
    return d.user;
  }, []);

  const startGuest = useCallback(async () => {
    const d = await api('/auth/guest', { method: 'POST' });
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } finally { setUser(null); }
  }, []);

  const updateProfile = useCallback(async (changes) => {
    const d = await api('/me', { method: 'PATCH', body: changes });
    setUser(d.user);
    return d.user;
  }, []);

  const value = useMemo(() => ({
    user, setUser, meta, login, register, startGuest, logout, updateProfile,
  }), [user, meta, login, register, startGuest, logout, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useMeta() {
  const { meta } = useContext(AuthContext);
  return meta || EMPTY_META;
}

// Short category name ("Academic" / "أكاديمية") for a category slug.
export function useCategoryName() {
  const { categories } = useMeta();
  return (slug) => categories.find((c) => c.slug === slug)?.short || slug;
}

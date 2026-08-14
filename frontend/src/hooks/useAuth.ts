import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../services/api';
import type { AgentCapabilities, AuthView } from '../types';
import { useToast } from '../components/Toast';

export function useAuth() {
  const { showToast } = useToast();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem('token'));
  const [capabilities, setCapabilities] = useState<AgentCapabilities | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Restore and sync token on initial mount
  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      setToken(stored);
      setIsLoggedIn(true);
    }
  }, []);

  // Fetch agent capabilities whenever logged in
  useEffect(() => {
    if (!token) return;
    ApiService.getCapabilities(token).then((data) => {
      if (data) {
        setCapabilities(data);
      } else {
        // Stale or expired token
        setToken(null);
        setIsLoggedIn(false);
        localStorage.removeItem('token');
      }
    });
  }, [token]);

  const handleAuthSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      if (authView === 'signup') {
        const { ok, data } = await ApiService.register(signupForm.name, signupForm.email, signupForm.password);
        if (ok) {
          showToast('Account created successfully! Logging in...', 'success');
          // Auto login after registration
          const loginRes = await ApiService.login(signupForm.email, signupForm.password);
          if (loginRes.ok && loginRes.data.token) {
            setToken(loginRes.data.token);
            localStorage.setItem('token', loginRes.data.token);
            setIsLoggedIn(true);
            setLoginForm({ email: '', password: '' });
            setSignupForm({ name: '', email: '', password: '' });
          } else {
            setAuthView('login');
            setLoginForm({ email: signupForm.email, password: '' });
          }
        } else {
          showToast(data.error || data.details || 'Registration failed', 'error');
        }
      } else {
        const { ok, data } = await ApiService.login(loginForm.email, loginForm.password);
        if (ok && data.token) {
          setToken(data.token);
          localStorage.setItem('token', data.token);
          setIsLoggedIn(true);
          setLoginForm({ email: '', password: '' });
          setSignupForm({ name: '', email: '', password: '' });
          showToast('Signed in successfully', 'success');
        } else {
          showToast(data.error || 'Authentication failed', 'error');
        }
      }
    } catch {
      showToast('Network error during authentication', 'error');
    } finally {
      setIsAuthenticating(false);
    }
  }, [authView, loginForm, signupForm, showToast]);

  const logout = useCallback(() => {
    setToken(null);
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    showToast('Signed out', 'info');
  }, [showToast]);

  return {
    token,
    isLoggedIn,
    capabilities,
    authView,
    setAuthView,
    loginForm,
    setLoginForm,
    signupForm,
    setSignupForm,
    isAuthenticating,
    handleAuthSubmit,
    logout,
  };
}

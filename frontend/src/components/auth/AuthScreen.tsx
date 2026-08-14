import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import type { AuthView } from '../../types';

interface AuthScreenProps {
  authView: AuthView;
  setAuthView: (v: AuthView) => void;
  loginForm: { email: string; password: string };
  setLoginForm: React.Dispatch<React.SetStateAction<{ email: string; password: string }>>;
  signupForm: { name: string; email: string; password: string };
  setSignupForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; password: string }>>;
  isAuthenticating: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  authView,
  setAuthView,
  loginForm,
  setLoginForm,
  signupForm,
  setSignupForm,
  isAuthenticating,
  onSubmit,
}) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 text-amber-400">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Construction AI</h1>
          <p className="text-sm text-slate-400 mt-1">Multi-Agent Intelligence Platform</p>
        </div>

        <div className="flex mb-6 bg-slate-900/50 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setAuthView('login')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              authView === 'login'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthView('signup')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              authView === 'signup'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {authView === 'signup' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Full Name</label>
              <input
                type="text"
                value={signupForm.name}
                onChange={(e) => setSignupForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 transition-all"
                placeholder="John Doe"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
            <input
              type="email"
              value={authView === 'login' ? loginForm.email : signupForm.email}
              onChange={(e) =>
                authView === 'login'
                  ? setLoginForm((prev) => ({ ...prev, email: e.target.value }))
                  : setSignupForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full p-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 transition-all"
              placeholder="user@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Password</label>
            <input
              type="password"
              value={authView === 'login' ? loginForm.password : signupForm.password}
              onChange={(e) =>
                authView === 'login'
                  ? setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                  : setSignupForm((prev) => ({ ...prev, password: e.target.value }))
              }
              className="w-full p-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full p-3 bg-amber-400 text-slate-950 font-bold rounded-xl hover:bg-yellow-500 transition-all shadow-lg shadow-amber-400/20 hover:shadow-amber-400/30 disabled:opacity-50"
          >
            {isAuthenticating
              ? 'Processing...'
              : authView === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

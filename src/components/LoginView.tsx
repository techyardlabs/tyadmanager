import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { UserAccount } from '../types.js';
import { TechYardLogo } from './TechYardLogo.js';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Store credentials according to Remember Me
      if (rememberMe) {
        localStorage.setItem('adserver_auth_token', data.token);
        localStorage.setItem('adserver_auth_user', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('adserver_auth_token', data.token);
        sessionStorage.setItem('adserver_auth_user', JSON.stringify(data.user));
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error connecting to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header with TechYard Labs Logo */}
        <div className="text-center mb-8">
          <TechYardLogo variant="full" size="lg" className="mb-3" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-medium text-slate-200">AdServer Pro</span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-slate-400 font-mono text-[11px]">Central Delivery &amp; Tag Engine</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-7 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Portal Sign In</h2>
              <p className="text-xs text-slate-400 mt-0.5">Enter your administrative credentials</p>
            </div>
            <span className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <span className="font-bold text-rose-400">Error:</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="username">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or admin@adserver.io"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 mr-2"
                />
                Remember me on this browser
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500 font-mono">
          <p>TechYard Labs &bull; Empowered by Innovation &bull; Protected Access</p>
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Shield, Smartphone, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2fa, setRequires2fa] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ userId: number } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // Pick up ?redirect=/internship/5 so user lands back where they came from
  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (requires2fa && twoFactorData) {
        // Verify 2FA code
        const response = await api.auth.verify2fa(twoFactorData.userId, twoFactorCode);
        // Store daily reward info for Dashboard toast
        if ((response as any).daily_reward) {
          sessionStorage.setItem('daily_reward', JSON.stringify((response as any).daily_reward));
        }
        if (response.user?.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = redirectTo;
        }
      } else {
        const response = await api.auth.login(email, password);

        if (response.requires_2fa) {
          // Backend requires 2FA — show code input
          setRequires2fa(true);
          setTwoFactorData({ userId: response.user_id! });
          return;
        }

        // Store daily reward info for Dashboard toast
        if ((response as any).daily_reward) {
          sessionStorage.setItem('daily_reward', JSON.stringify((response as any).daily_reward));
        }
        if (response.user?.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = redirectTo;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen friendly-unified-bg relative overflow-hidden flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
      {/* Organic Glows */}
      <div className="absolute top-0 right-0 w-[80%] h-[120%] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[130px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-[60%] h-[80%] bg-rose-500/5 dark:bg-rose-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <div className="p-2.5 bg-gray-900 dark:bg-white rounded-[1rem] shadow-lg transform hover:scale-110 transition-transform duration-500">
              <GraduationCap className="w-7 h-7 text-white dark:text-indigo-700" />
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              FutureIntern
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {requires2fa ? 'Securing Your Session' : 'Welcome'}
          </h2>
          <p className="text-base text-gray-500 dark:text-indigo-100/60 font-medium">
            {requires2fa ? 'Enter the 6-digit code sent to your email' : 'Sign in to continue your journey'}
          </p>
        </div>

        <form
          className="mt-10 space-y-6 bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-white/10 transition-all duration-500"
          onSubmit={handleSubmit}
        >
          {!requires2fa ? (
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-2.5 ml-1">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center transition-colors group-focus-within:bg-indigo-50 dark:group-focus-within:bg-indigo-900/20">
                    <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-16 pr-5 py-4 bg-white/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-indigo-200/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium text-base shadow-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-2.5 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center transition-colors group-focus-within:bg-rose-50 dark:group-focus-within:bg-rose-900/20">
                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-rose-600 dark:group-focus-within:text-rose-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-16 pr-5 py-4 bg-white/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-indigo-200/20 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all font-medium text-base shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center group cursor-pointer">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 dark:text-indigo-400 border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded cursor-pointer focus:ring-indigo-500/20"
                  />
                  <label htmlFor="remember-me" className="ml-2.5 block text-[11px] text-gray-600 dark:text-indigo-100/60 font-semibold uppercase tracking-wider cursor-pointer group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Remember Me
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" className="text-[11px] font-semibold text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all uppercase tracking-wider">
                    Forgot Password?
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                  <Smartphone className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <label htmlFor="2fa-code" className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                  Authentication Code
                </label>
                <div className="relative group">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                  <input
                    id="2fa-code"
                    type="text"
                    required
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-4 bg-white/50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-center tracking-[0.5em] text-xl font-bold"
                    placeholder="000000"
                    autoFocus
                  />
                </div>
                <p className="mt-3 text-xs text-center text-gray-500 dark:text-slate-400">
                  Check your email for the verification code.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRequires2fa(false);
                  setTwoFactorCode('');
                  setError('');
                }}
                className="w-full text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                Back to Login
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 bg-gray-900 dark:bg-white text-white dark:text-indigo-700 rounded-xl transition-all font-bold text-base shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>{requires2fa ? 'Verify Access' : 'Sign in'}</span>
              )}
            </button>
          </div>

          {!requires2fa && (
            <div className="text-center pt-5">
              <p className="text-sm font-semibold text-gray-500 dark:text-indigo-100/40">
                Don't have an account?{' '}
                <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-8 decoration-2 font-bold transition-all">
                  Create Account
                </Link>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}


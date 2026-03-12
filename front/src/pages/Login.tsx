import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Shield, Smartphone, Loader2, Send } from 'lucide-react';
import { api } from '../services/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2fa, setRequires2fa] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ userId: number } | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
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
    } catch (err: any) {
      // Handle email verification required (403)
      if (err?.message?.includes('verify your email')) {
        setNeedsVerification(true);
        setVerificationEmail(email);
        setError('');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage('');
    try {
      const data = await api.auth.resendVerification(verificationEmail);
      setResendMessage(data.message || 'Verification email sent!');
    } catch (err) {
      setResendMessage('Failed to resend. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    const redirectUri = `${window.location.origin}/login`;
    const scope = 'openid email profile';
    const state = encodeURIComponent(redirectTo);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope,
      prompt: 'login',
      max_age: '0',
      state,
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  // Handle Google OAuth redirect callback (access_token in URL hash)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const state = params.get('state');
      const returnTo = state ? decodeURIComponent(state) : '/dashboard';
      if (accessToken) {
        setLoading(true);
        setError('');
        // Clear the hash from the URL
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        api.auth.googleLogin(accessToken)
          .then((response) => {
            if (response.user?.role === 'admin') {
              window.location.href = '/admin';
            } else {
              window.location.href = returnTo;
            }
          })
          .catch((err) => {
            const errorMessage = err instanceof Error ? err.message : 'Google login failed.';
            setError(errorMessage);
            setLoading(false);
          });
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 relative overflow-hidden flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
      {/* Geometric Decorations */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-blue-600 border-4 border-slate-900 rounded-full animate-float pointer-events-none"></div>
      <div className="absolute top-1/3 right-16 w-12 h-12 bg-amber-400 border-4 border-slate-900 rotate-12 animate-float animation-delay-300 pointer-events-none"></div>
      <div className="absolute bottom-32 left-1/4 w-14 h-14 bg-rose-500 border-4 border-slate-900 rounded-2xl -rotate-12 animate-float animation-delay-500 pointer-events-none"></div>

      {/* Dot Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#0f172a 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-3 mb-8 group">
            <div className="p-2.5 bg-slate-900 dark:bg-white rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#f43f5e] transform group-hover:rotate-3 transition-transform">
              <GraduationCap className="w-7 h-7 text-white dark:text-slate-900" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
              Future<span className="text-rose-500">Intern</span>
            </span>
          </Link>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
            {requires2fa ? 'Verify Access' : 'Welcome Back'}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">
            {requires2fa ? 'Enter the 6-digit code sent to your email' : 'Sign in to continue your journey'}
          </p>
        </div>

        <form
          className="mt-10 space-y-6 bg-white dark:bg-slate-900 p-10 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] transition-all"
          onSubmit={handleSubmit}
        >
          {!requires2fa ? (
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-16 pr-5 py-4 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_#3b82f6] transition-all font-bold text-base"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-rose-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-16 pr-5 py-4 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_#f43f5e] transition-all font-bold text-base"
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
                    className="h-5 w-5 text-rose-500 border-[2px] border-slate-900 dark:border-white rounded cursor-pointer focus:ring-rose-500"
                  />
                  <label htmlFor="remember-me" className="ml-2.5 block text-sm text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider cursor-pointer">
                    Remember Me
                  </label>
                </div>

                <Link to="/forgot-password" className="text-sm font-bold text-rose-500 hover:text-rose-600 transition-all uppercase tracking-wider">
                  Forgot?
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a]">
                  <Smartphone className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <div>
                <label htmlFor="2fa-code" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Authentication Code
                </label>
                <div className="relative group">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="2fa-code"
                    type="text"
                    required
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-4 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_#3b82f6] transition-all text-center tracking-[0.5em] text-xl font-black"
                    placeholder="000000"
                    autoFocus
                  />
                </div>
                <p className="mt-3 text-xs text-center text-slate-500 dark:text-slate-400 font-bold">
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
                className="w-full text-sm font-black text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-wider"
              >
                Back to Login
              </button>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border-[3px] border-rose-500 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-sm font-bold">
              {error}
            </div>
          )}

          {needsVerification && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border-[3px] border-amber-500 text-amber-700 dark:text-amber-300 px-4 py-4 rounded-xl text-sm font-bold space-y-3">
              <p>Please verify your email address before logging in. Check your inbox for a verification link.</p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-black text-xs uppercase tracking-wider hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Resend Verification Email
              </button>
              {resendMessage && (
                <p className="text-xs text-amber-600 dark:text-amber-400">{resendMessage}</p>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 bg-rose-500 text-white border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black text-lg uppercase tracking-tighter disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>{requires2fa ? 'Verify Access' : 'Sign In'}</span>
              )}
            </button>
          </div>

          {!requires2fa && (
            <>
              {/* Google OAuth */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-[3px] border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-slate-900 font-black text-slate-400 uppercase tracking-wider text-xs">
                    or continue with
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black text-lg uppercase tracking-tighter disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </button>
              </div>

              <div className="text-center pt-5 border-t-[3px] border-slate-900 dark:border-white">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 pt-5">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-rose-500 font-black hover:text-rose-600 transition-all uppercase tracking-tight">
                    Create Account
                  </Link>
                </p>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}


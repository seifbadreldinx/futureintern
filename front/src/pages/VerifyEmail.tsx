import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GraduationCap, CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import { api } from '../services/api';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    let cancelled = false;

    api.auth.verifyEmail(token)
      .then((data) => {
        if (!cancelled) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error');
          setMessage(err instanceof Error ? err.message : 'Verification failed. The link may have expired.');
        }
      });

    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 relative overflow-hidden flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
      {/* Geometric Decorations */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-blue-600 border-4 border-slate-900 rounded-full animate-float pointer-events-none" />
      <div className="absolute top-1/3 right-16 w-12 h-12 bg-amber-400 border-4 border-slate-900 rotate-12 animate-float animation-delay-300 pointer-events-none" />
      <div className="absolute bottom-32 left-1/4 w-14 h-14 bg-rose-500 border-4 border-slate-900 rounded-2xl -rotate-12 animate-float animation-delay-500 pointer-events-none" />

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
        </div>

        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl border-[3px] border-slate-900 dark:border-white">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                Verifying Email...
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-bold">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl border-[3px] border-slate-900 dark:border-white">
                  <CheckCircle className="w-12 h-12 text-emerald-600" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                Email Verified!
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-bold">
                {message}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-4 px-6 bg-rose-500 text-white border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black text-lg uppercase tracking-tighter"
              >
                Go to Login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-rose-100 dark:bg-rose-900/30 rounded-2xl border-[3px] border-slate-900 dark:border-white">
                  <AlertCircle className="w-12 h-12 text-rose-500" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                Verification Failed
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-bold">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full py-4 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#f43f5e] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#f43f5e] transition-all font-black text-lg uppercase tracking-tighter"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

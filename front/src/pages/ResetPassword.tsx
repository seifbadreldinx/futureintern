
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Lock, CheckCircle, ArrowLeft, Loader2, Check, X, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8,                          label: 'At least 8 characters' },
  { test: (p: string) => /[a-zA-Z]/.test(p),                    label: 'At least one letter' },
  { test: (p: string) => /\d/.test(p),                           label: 'At least one number' },
  { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p),     label: 'At least one special character' },
];

export function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const allRulesMet = PASSWORD_RULES.every(r => r.test(password));
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!allRulesMet) {
            setError('Please meet all password requirements.');
            return;
        }

        if (!passwordsMatch) {
            setError('Passwords do not match');
            return;
        }

        if (!token) {
            setError('Missing reset token');
            return;
        }

        setLoading(true);

        try {
            await api.auth.resetPassword(token, password);
            setSubmitted(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                        Set New Password
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">
                        Please enter your new password below
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-10 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] transition-all">
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-rose-50 dark:bg-rose-900/20 border-[3px] border-rose-500 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-sm font-bold">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-5">
                                {/* New Password */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">
                                        New Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                            <Lock className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-16 pr-12 py-4 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_#3b82f6] transition-all font-bold text-base"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* Password requirements checklist */}
                                    {password.length > 0 && (
                                        <ul className="mt-3 space-y-1">
                                            {PASSWORD_RULES.map(({ test, label }) => {
                                                const ok = test(password);
                                                return (
                                                    <li key={label} className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                        {ok
                                                            ? <Check className="w-3.5 h-3.5 flex-shrink-0" />
                                                            : <X className="w-3.5 h-3.5 flex-shrink-0" />
                                                        }
                                                        {label}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                            <Lock className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full pl-16 pr-12 py-4 bg-white dark:bg-slate-800 border-[3px] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 transition-all font-bold text-base ${
                                                confirmPassword.length > 0
                                                    ? passwordsMatch
                                                        ? 'border-emerald-500 focus:shadow-[4px_4px_0px_0px_#10b981]'
                                                        : 'border-rose-500 focus:shadow-[4px_4px_0px_0px_#f43f5e]'
                                                    : 'border-slate-900 dark:border-white focus:shadow-[4px_4px_0px_0px_#3b82f6]'
                                            }`}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {confirmPassword.length > 0 && (
                                        <p className={`mt-2 text-xs font-bold flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                            {passwordsMatch
                                                ? <><Check className="w-3.5 h-3.5" /> Passwords match</>
                                                : <><X className="w-3.5 h-3.5" /> Passwords do not match</>
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !token || !allRulesMet || !passwordsMatch}
                                className="w-full flex justify-center items-center py-4 px-6 bg-rose-500 text-white border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black text-lg uppercase tracking-tighter disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 border-[3px] border-slate-900 dark:border-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_0px_#0f172a] dark:shadow-[3px_3px_0px_0px_#ffffff]">
                                <CheckCircle className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Password Reset Successful</h3>
                            <p className="text-slate-600 dark:text-slate-400 font-bold mb-6">
                                Your password has been updated. Redirecting to login...
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center w-full px-6 py-4 bg-rose-500 text-white border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black text-lg uppercase tracking-tighter"
                            >
                                Go to Login
                            </Link>
                        </div>
                    )}

                    {!submitted && (
                        <div className="mt-8 text-center border-t-[3px] border-slate-900 dark:border-white pt-6">
                            <Link to="/login" className="inline-flex items-center text-sm font-black text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group uppercase tracking-wider">
                                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                                Back to Sign in
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

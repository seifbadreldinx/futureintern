
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
        }, 1500);
    };

    return (
        <div className="min-h-screen education-bg relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float animation-delay-300"></div>
                <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-float animation-delay-500"></div>
            </div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                <div className="text-center animate-fade-in-up">
                    <div className="flex justify-center items-center space-x-2 mb-4">
                        <div className="p-2 bg-gray-900 rounded-lg shadow-lg transform hover:scale-110 transition-transform duration-300">
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900">
                            FutureIntern
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                    <p className="text-gray-600">Enter your email and we'll send you a reset link</p>
                </div>

                <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20 transform hover:shadow-3xl transition-all duration-300 animate-fade-in-up animation-delay-200">
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email address
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-200"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending link...' : 'Send Reset Link'}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center animate-fade-in-up">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email</h3>
                            <p className="text-gray-600 mb-6">
                                We've sent a password reset link to <span className="font-semibold text-gray-900">{email}</span>.
                            </p>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="text-sm font-semibold text-gray-900 hover:text-gray-700 underline"
                            >
                                Try different email
                            </button>
                        </div>
                    )}

                    <div className="mt-6 text-center border-t border-gray-100 pt-6">
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors group">
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

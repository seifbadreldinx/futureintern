import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, BookOpen, Heart, Upload, FileText, X, ChevronRight, ChevronLeft, Check, Eye, EyeOff, Building2, Globe, Briefcase, CheckCircle, Loader2, Send } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { api } from '../services/api';

const INTEREST_OPTIONS = [
  'Web Development',
  'AI',
  'Cyber Security',
  'Business',
  'Marketing',
  'Data Science',
  'Design',
  'Product Management',
  'Consulting',
  'Research',
  'Healthcare',
  'Education',
  'Media & Communications',
];

const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Marketing & Advertising',
  'Engineering',
  'Design',
  'Non-Profit',
  'Media & Entertainment',
  'Other',
];

type UserType = 'student' | 'company';

type FormData = {
  userType: UserType;
  // Shared
  email: string;
  password: string;
  confirmPassword: string;
  // Student
  name: string;
  university: string;
  major: string;
  interests: string[];
  cv: File | null;
  // Company
  companyName: string;
  industry: string;
  location: string;
  website: string;
  description: string;
  logo: File | null;
};

type StepErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  university?: string;
  interests?: string;
  cv?: string;
  companyName?: string;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  logo?: string;
};

export function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    userType: 'student',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
    major: '',
    interests: [],
    cv: null,
    companyName: '',
    industry: '',
    location: '',
    website: '',
    description: '',
    logo: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<StepErrors>({});
  const [cvError, setCvError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cvLater, setCvLater] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [emailSent, setEmailSent] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const navigate = useNavigate();

  const handleUserTypeChange = (type: UserType) => {
    setFormData({ ...formData, userType: type });
    setCurrentStep(1);
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name as keyof StepErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => {
      const isSelected = prev.interests.includes(interest);
      if (!isSelected && prev.interests.length >= 3) return prev;
      return {
        ...prev,
        interests: isSelected
          ? prev.interests.filter(i => i !== interest)
          : [...prev.interests, interest],
      };
    });
    if (errors.interests) setErrors({ ...errors, interests: undefined });
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCvError('');
    setErrors({ ...errors, cv: undefined });

    if (!file) { setFormData({ ...formData, cv: null }); return; }

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      const msg = 'Please upload a PDF or DOCX file only.';
      setCvError(msg); setErrors({ ...errors, cv: msg }); e.target.value = ''; return;
    }
    if (file.size > 5 * 1024 * 1024) {
      const msg = 'File size must be less than 5MB.';
      setCvError(msg); setErrors({ ...errors, cv: msg }); e.target.value = ''; return;
    }
    setFormData({ ...formData, cv: file });
  };

  const removeCv = () => {
    setFormData({ ...formData, cv: null });
    setCvError(''); setErrors({ ...errors, cv: undefined });
    const fileInput = document.getElementById('cv') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrors({ ...errors, logo: undefined });
    if (!file) { setFormData({ ...formData, logo: null }); return; }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, logo: 'Please upload an image file (JPG, PNG, or WEBP).' });
      e.target.value = ''; return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, logo: 'Logo size must be less than 2MB.' });
      e.target.value = ''; return;
    }
    setFormData({ ...formData, logo: file });
  };

  const removeLogo = () => {
    setFormData({ ...formData, logo: null });
    setErrors({ ...errors, logo: undefined });
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const validateStep1 = (): boolean => {
    const newErrors: StepErrors = {};
    if (formData.userType === 'student') {
      if (!formData.name.trim()) newErrors.name = 'Full name is required';
    } else {
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    }
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters long';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: StepErrors = {};
    if (formData.userType === 'student') {
      if (!formData.university.trim()) newErrors.university = 'University name is required';
      if (formData.interests.length !== 3) newErrors.interests = 'Please select exactly 3 interests';
    } else {
      if (!formData.industry) newErrors.industry = 'Industry is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: StepErrors = {};
    if (formData.userType === 'student') {
      if (!formData.cv && !cvLater) newErrors.cv = 'Please upload your CV or check the box to add it later';
    } else {
      if (!formData.description.trim()) newErrors.description = 'Company description is required';
    }
    setErrors(newErrors);
    if (formData.userType === 'student' && newErrors.cv) setCvError(newErrors.cv);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setSubmitError('');
    setLoading(true);

    try {
      let response: any;
      if (formData.userType === 'student') {
        response = await api.auth.registerStudent({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          university: formData.university || 'Not specified',
          major: formData.major || 'Not specified',
          interests: formData.interests,
          cv: formData.cv || undefined,
        });
      } else {
        response = await api.auth.registerCompany({
          name: formData.companyName,
          email: formData.email,
          password: formData.password,
          company_name: formData.companyName,
        });
        // Upload logo if provided (after auto-login in registerCompany)
        if (formData.logo) {
          try { await api.users.uploadCV(formData.logo); } catch { /* logo upload is best-effort */ }
        }
      }
      // Show "check your email" screen
      setRegisteredEmail(formData.email);
      setEmailSent(response?.email_sent !== false);
      setRegistrationComplete(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      const lowerMsg = errorMessage.toLowerCase();
      if (lowerMsg.includes('password')) {
        setCurrentStep(1);
        setErrors({ password: errorMessage });
      } else {
        setSubmitError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage('');
    try {
      const data = await api.auth.resendVerification(registeredEmail);
      setResendMessage(data.message || 'Verification email sent!');
    } catch {
      setResendMessage('Failed to resend. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignUp = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setSubmitError('');
    try {
      await api.auth.googleLogin(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign-up failed.';
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 3;
  const stepProgress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 relative overflow-hidden flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
      {/* Geometric Decorations */}
      <div className="absolute top-20 right-10 w-16 h-16 bg-blue-600 border-4 border-slate-900 rounded-full animate-float pointer-events-none"></div>
      <div className="absolute top-1/2 left-10 w-12 h-12 bg-amber-400 border-4 border-slate-900 rotate-12 animate-float animation-delay-300 pointer-events-none"></div>
      <div className="absolute bottom-32 right-1/4 w-14 h-14 bg-rose-500 border-4 border-slate-900 rounded-2xl -rotate-12 animate-float animation-delay-500 pointer-events-none"></div>

      {/* Dot Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#0f172a 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="max-w-2xl w-full space-y-8 relative z-10 py-12 px-4 sm:px-6 lg:px-8">
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
            {registrationComplete ? 'Check Your Email' : 'Create Account'}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">
            {registrationComplete ? 'One more step to get started' : 'Start your journey to find the perfect internship'}
          </p>
        </div>

        {registrationComplete ? (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a]">
                  <CheckCircle className="w-16 h-16 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
                  Registration Successful!
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-bold">
                  We've sent a verification link to <span className="text-rose-500">{registeredEmail}</span>.
                  Please check your inbox and click the link to verify your account.
                </p>
              </div>

              {!emailSent && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-[3px] border-amber-500 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-xl text-sm font-bold">
                  We had trouble sending the verification email. Please use the button below to resend it.
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#f43f5e] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#f43f5e] transition-all font-black text-base uppercase tracking-tighter disabled:opacity-50"
                >
                  {resendLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Resend Verification Email
                </button>
                {resendMessage && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">{resendMessage}</p>
                )}
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center py-4 px-6 bg-rose-500 text-white border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black text-base uppercase tracking-tighter"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        ) : (
        <>
        {/* Progress Bar */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)]">
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all duration-300 border-[3px] ${step < currentStep
                      ? 'bg-rose-500 text-white border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a]'
                      : step === currentStep
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#f43f5e] scale-110'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {step < currentStep ? <Check className="w-6 h-6 stroke-[3.5]" /> : step}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider mt-3 font-black hidden sm:block ${step <= currentStep ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {step === 1 ? 'Account' : step === 2 ? (formData.userType === 'student' ? 'Interests' : 'Company') : (formData.userType === 'student' ? 'CV Upload' : 'Profile')}
                  </span>
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1.5 mx-4 rounded-full transition-all duration-500 ${step < currentStep ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden border-[2px] border-slate-900 dark:border-white">
            <div className="bg-rose-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stepProgress}%` }} />
          </div>
        </div>

        <form
          className="mt-10 bg-white dark:bg-slate-900 p-10 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] transition-all"
          onSubmit={handleSubmit}
        >
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* User Type Selection */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button type="button" onClick={() => handleUserTypeChange('student')}
                  className={`p-6 rounded-2xl border-[3px] transition-all duration-300 flex flex-col items-center gap-3 ${formData.userType === 'student'
                    ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[4px_4px_0px_0px_#f43f5e] scale-[1.02]'
                    : 'border-slate-300 dark:border-slate-600 text-slate-400 hover:border-slate-900 dark:hover:border-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border-[2px] ${formData.userType === 'student' ? 'bg-rose-500 text-white border-white dark:border-slate-900' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}>
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="font-black text-[11px] uppercase tracking-wider">Student</span>
                </button>
                <button type="button" onClick={() => handleUserTypeChange('company')}
                  className={`p-6 rounded-2xl border-[3px] transition-all duration-300 flex flex-col items-center gap-3 ${formData.userType === 'company'
                    ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[4px_4px_0px_0px_#3b82f6] scale-[1.02]'
                    : 'border-slate-300 dark:border-slate-600 text-slate-400 hover:border-slate-900 dark:hover:border-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border-[2px] ${formData.userType === 'company' ? 'bg-blue-600 text-white border-white dark:border-slate-900' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="font-black text-[11px] uppercase tracking-wider">Company</span>
                </button>
              </div>

              {/* Name / Company Name */}
              {formData.userType === 'student' ? (
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">Full name</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <input id="name" name="name" type="text" autoComplete="name" required value={formData.name} onChange={handleChange}
                      className={`w-full pl-16 pr-5 py-4 bg-white dark:bg-slate-800 border-[3px] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 transition-all font-bold text-base ${errors.name ? 'border-red-500 shadow-[4px_4px_0px_0px_#ef4444]' : 'border-slate-900 dark:border-white focus:shadow-[4px_4px_0px_0px_#3b82f6]'}`}
                      placeholder="Your Name" />
                  </div>
                  {errors.name && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.name}</p>}
                </div>
              ) : (
                <div>
                  <label htmlFor="companyName" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">Company Name</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-rose-500" />
                    </div>
                    <input id="companyName" name="companyName" type="text" required value={formData.companyName} onChange={handleChange}
                      className={`w-full pl-16 pr-5 py-4 bg-white dark:bg-slate-800 border-[3px] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 transition-all font-bold text-base ${errors.companyName ? 'border-red-500 shadow-[4px_4px_0px_0px_#ef4444]' : 'border-slate-900 dark:border-white focus:shadow-[4px_4px_0px_0px_#f43f5e]'}`}
                      placeholder="e.g. FutureTech Inc." />
                  </div>
                  {errors.companyName && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.companyName}</p>}
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">Email address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange}
                    className={`w-full pl-16 pr-5 py-4 bg-white dark:bg-slate-800 border-[3px] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 transition-all font-bold text-base ${errors.email ? 'border-red-500 shadow-[4px_4px_0px_0px_#ef4444]' : 'border-slate-900 dark:border-white focus:shadow-[4px_4px_0px_0px_#3b82f6]'}`}
                    placeholder="you@example.com" />
                </div>
                {errors.email && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.email}</p>}
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                      <Lock className="w-5 h-5 text-rose-500" />
                    </div>
                    <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={formData.password} onChange={handleChange}
                      className={`w-full pl-16 pr-14 py-4 bg-white dark:bg-slate-800 border-[3px] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 transition-all font-bold text-base ${errors.password ? 'border-red-500' : 'border-slate-900 dark:border-white focus:shadow-[4px_4px_0px_0px_#f43f5e]'}`}
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.password}</p>}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">Confirm password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                      <Lock className="w-5 h-5 text-rose-500" />
                    </div>
                    <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" required value={formData.confirmPassword} onChange={handleChange}
                      className={`w-full pl-16 pr-14 py-4 bg-white dark:bg-slate-800 border-[3px] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 transition-all font-bold text-base ${errors.confirmPassword ? 'border-red-500' : 'border-slate-900 dark:border-white focus:shadow-[4px_4px_0px_0px_#f43f5e]'}`}
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.confirmPassword}</p>}
                </div>
              </div>

              <div className="pt-8">
                <button type="button" onClick={handleNext}
                  className="w-full flex justify-center items-center py-4 px-6 bg-rose-500 text-white border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black text-lg uppercase tracking-tighter group">
                  <span className="mr-3">Next Step</span>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-all">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {formData.userType === 'student' ? (
                <>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 ml-1">
                    <Heart className="inline w-3.5 h-3.5 mr-1.5 text-rose-500 fill-current opacity-50" /> Interests (Pick Exactly 3)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {INTEREST_OPTIONS.map((interest) => (
                      <button key={interest} type="button" onClick={() => handleInterestToggle(interest)}
                        disabled={!formData.interests.includes(interest) && formData.interests.length >= 3}
                        className={`px-3 py-4 rounded-xl border-[3px] transition-all duration-300 text-[13px] font-black tracking-tight disabled:opacity-30 disabled:cursor-not-allowed ${formData.interests.includes(interest)
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#f43f5e] scale-[1.02]'
                          : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white border-slate-300 dark:border-slate-600 hover:border-slate-900 dark:hover:border-white'
                        }`}>
                        {interest}
                      </button>
                    ))}
                  </div>
                  {errors.interests && <p className="mt-3 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.interests}</p>}
                  <div className="mt-5 flex items-center">
                    <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mr-4 border-[2px] border-slate-900 dark:border-white">
                      <div className="h-full bg-rose-500 transition-all duration-700 ease-out" style={{ width: `${(formData.interests.length / 3) * 100}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{formData.interests.length} / 3 Selected</span>
                  </div>

                  <div>
                    <label htmlFor="university" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">University Name</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                      <input id="university" name="university" type="text" required value={formData.university} onChange={handleChange}
                        className={`w-full pl-16 pr-5 py-4 bg-white dark:bg-slate-800 border-[3px] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 transition-all font-bold text-base ${errors.university ? 'border-red-500' : 'border-slate-900 dark:border-white focus:shadow-[4px_4px_0px_0px_#3b82f6]'}`}
                        placeholder="e.g. Stanford University" />
                    </div>
                    {errors.university && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.university}</p>}
                  </div>

                  <div>
                    <label htmlFor="major" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">Academic Major</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-rose-500" />
                      </div>
                      <input id="major" name="major" type="text" value={formData.major} onChange={handleChange}
                        className="w-full pl-16 pr-5 py-4 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_#f43f5e] transition-all font-bold text-base"
                        placeholder="e.g. Computer Science" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="industry" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">Industry</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <select id="industry" name="industry" required value={formData.industry} onChange={handleChange}
                        className={`w-full pl-16 pr-5 py-4 bg-white dark:bg-slate-800 border-[3px] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-0 transition-all font-bold text-base appearance-none cursor-pointer ${errors.industry ? 'border-red-500' : 'border-slate-900 dark:border-white focus:shadow-[4px_4px_0px_0px_#3b82f6]'}`}>
                        <option value="" className="dark:bg-slate-900">Select industry</option>
                        {INDUSTRY_OPTIONS.map((ind) => <option key={ind} value={ind} className="dark:bg-slate-900">{ind}</option>)}
                      </select>
                    </div>
                    {errors.industry && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.industry}</p>}
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">Location</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-rose-500" />
                      </div>
                      <input id="location" name="location" type="text" required value={formData.location} onChange={handleChange}
                        className={`w-full pl-16 pr-5 py-4 bg-white dark:bg-slate-800 border-[3px] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 transition-all font-bold text-base ${errors.location ? 'border-red-500' : 'border-slate-900 dark:border-white focus:shadow-[4px_4px_0px_0px_#f43f5e]'}`}
                        placeholder="e.g. San Francisco, CA" />
                    </div>
                    {errors.location && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.location}</p>}
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">Company Website (Optional)</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <input id="website" name="website" type="url" value={formData.website} onChange={handleChange}
                        className="w-full pl-16 pr-5 py-4 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_#3b82f6] transition-all font-bold text-base"
                        placeholder="https://example.com" />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-8 flex gap-5">
                <button type="button" onClick={handleBack}
                  className="flex-1 flex justify-center items-center py-4 px-6 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all uppercase tracking-wider text-sm">
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back
                </button>
                <button type="button" onClick={handleNext}
                  className="flex-1 flex justify-center items-center py-4 px-6 bg-rose-500 text-white border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black text-base uppercase tracking-tighter group">
                  <span className="mr-3">Continue</span>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-all">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {formData.userType === 'student' ? (
                <div>
                  <label htmlFor="cv" className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                    <Upload className="inline w-4 h-4 mr-1 text-blue-600 dark:text-blue-400" /> Upload CV {!cvLater && <span className="text-red-500">*</span>}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-6 font-medium leading-relaxed">
                    Your CV helps our AI matching system connect you with relevant internship opportunities.
                  </p>
                  <div className="space-y-4">
                    {!formData.cv ? (
                      <div className="relative group">
                        <input id="cv" name="cv" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleCvChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className={`bg-white dark:bg-slate-800 border-[3px] border-dashed rounded-[2rem] p-10 text-center transition-all duration-300 cursor-pointer group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 ${errors.cv ? 'border-red-500' : 'border-slate-900 dark:border-white group-hover:shadow-[4px_4px_0px_0px_#3b82f6]'}`}>
                          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl border-[3px] border-slate-900 dark:border-white flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 shadow-[3px_3px_0px_0px_#0f172a]">
                            <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
                          </div>
                          <p className="text-lg text-slate-600 dark:text-slate-400 font-bold mb-1"><span className="font-black text-slate-900 dark:text-white">Click to upload</span></p>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">PDF or DOCX (Max 5MB)</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 dark:bg-blue-950/40 rounded-[2rem] p-6 flex items-center justify-between border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a]">
                        <div className="flex items-center space-x-5 flex-1 min-w-0">
                          <div className="w-14 h-14 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center shadow-sm">
                            <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-bold text-gray-900 dark:text-white truncate tracking-tight">{formData.cv.name}</p>
                            <p className="text-xs font-bold text-indigo-500/60 uppercase tracking-widest mt-1">{(formData.cv.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button type="button" onClick={removeCv} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors bg-white dark:bg-white/5 rounded-full shadow-sm">
                          <X className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    )}
                    {(cvError || errors.cv) && <p className="mt-3 text-xs font-bold text-rose-500 flex items-center ml-2"><X className="w-3 h-3 mr-2" /> {cvError || errors.cv}</p>}
                  </div>
                  <div className="mt-6 flex items-center bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100/50 dark:border-blue-900/20">
                    <input id="cvLater" type="checkbox" checked={cvLater}
                      onChange={(e) => { setCvLater(e.target.checked); if (e.target.checked) removeCv(); }}
                      className="h-5 w-5 text-blue-600 dark:text-blue-500 focus:ring-blue-500 border-gray-300 dark:border-slate-800 dark:bg-slate-900 rounded cursor-pointer" />
                    <label htmlFor="cvLater" className="ml-3 block text-sm text-gray-700 dark:text-slate-400 font-bold cursor-pointer">I will add my CV later in the profile settings</label>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="description" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 ml-1">Company Description <span className="text-rose-500">*</span></label>
                    <textarea id="description" name="description" rows={5} required value={formData.description} onChange={handleChange}
                      className={`w-full px-6 py-4 bg-white dark:bg-slate-800 border-[3px] rounded-[1.5rem] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 transition-all font-bold text-base resize-none ${errors.description ? 'border-red-500' : 'border-slate-900 dark:border-white focus:shadow-[4px_4px_0px_0px_#3b82f6]'}`}
                      placeholder="Share your company's mission..." />
                    {errors.description && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.description}</p>}
                  </div>
                  <div>
                    <label htmlFor="logo" className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                      <Upload className="inline w-4 h-4 mr-1 text-blue-600 dark:text-blue-400" /> Company Logo (Optional)
                    </label>
                    <div className="space-y-3">
                      {!formData.logo ? (
                        <div className="relative group">
                          <input id="logo" name="logo" type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          <div className={`border-[3px] border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer bg-white dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 ${errors.logo ? 'border-red-500' : 'border-slate-900 dark:border-white group-hover:shadow-[4px_4px_0px_0px_#3b82f6]'}`}>
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl border-[3px] border-slate-900 dark:border-white flex items-center justify-center mx-auto mb-3 shadow-[3px_3px_0px_0px_#0f172a] group-hover:scale-110 transition-transform duration-300">
                              <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1"><span className="font-black text-slate-900 dark:text-white">Upload logo</span></p>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">PNG, JPG or WEBP (MAX. 2MB)</p>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 bg-blue-50/50 dark:bg-blue-900/20 flex items-center justify-between shadow-inner">
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center shadow-md">
                              <img src={URL.createObjectURL(formData.logo)} alt="Logo Preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{formData.logo.name}</p>
                              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 opacity-75">{(formData.logo.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button type="button" onClick={removeLogo} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors bg-white dark:bg-slate-800 rounded-full shadow-sm">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      {errors.logo && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.logo}</p>}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-start bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border-[3px] border-slate-900 dark:border-white">
                <input id="terms" name="terms" type="checkbox" required className="h-5 w-5 text-blue-600 dark:text-blue-500 focus:ring-blue-500 border-gray-300 dark:border-slate-800 dark:bg-slate-900 rounded cursor-pointer mt-0.5" />
                <label htmlFor="terms" className="ml-3 block text-sm text-gray-700 dark:text-slate-400 font-medium cursor-pointer leading-relaxed">
                  I agree to the <Link to="/terms" className="font-bold text-gray-900 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors underline decoration-2 underline-offset-4">Terms of Service</Link>{' '}
                  and <Link to="/privacy" className="font-bold text-gray-900 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors underline decoration-2 underline-offset-4">Privacy Policy</Link>
                </label>
              </div>

              {submitError && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border-[3px] border-rose-500 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-sm font-bold">
                  {submitError}
                </div>
              )}

              <div className="pt-8 flex gap-5">
                <button type="button" onClick={handleBack} disabled={loading}
                  className="flex-1 flex justify-center items-center py-4 px-6 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all uppercase tracking-wider text-sm disabled:opacity-50">
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex justify-center items-center py-4 px-6 bg-rose-500 text-white border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black text-base uppercase tracking-tighter disabled:opacity-50 disabled:cursor-not-allowed group">
                  <span className="mr-3">{loading ? 'Creating...' : 'Create account'}</span>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-all">
                    <Check className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="text-center mt-10 pt-8 border-t-[3px] border-slate-900 dark:border-white">
            {/* Google OAuth */}
            <div className="relative py-4 mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-[3px] border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-900 font-black text-slate-400 uppercase tracking-wider text-xs">
                  or sign up with
                </span>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSignUp}
                onError={() => setSubmitError('Google sign-up failed. Please try again.')}
                theme="outline"
                size="large"
                width={400}
                text="signup_with"
                shape="rectangular"
              />
            </div>

            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-rose-500 font-black hover:text-rose-600 transition-all uppercase tracking-tight">Sign in</Link>
            </p>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  );
}

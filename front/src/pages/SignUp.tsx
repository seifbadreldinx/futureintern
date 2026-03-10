import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, BookOpen, Heart, Upload, FileText, X, ChevronRight, ChevronLeft, Check, Eye, EyeOff, Building2, Globe, Briefcase } from 'lucide-react';
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
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
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
      if (formData.userType === 'student') {
        await api.auth.registerStudent({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          university: formData.university || 'Not specified',
          major: formData.major || 'Not specified',
          interests: formData.interests,
          cv: formData.cv || undefined,
        });
      } else {
        await api.auth.registerCompany({
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
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 3;
  const stepProgress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen friendly-unified-bg relative overflow-hidden flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
      {/* Organic Glows */}
      <div className="absolute top-0 right-0 w-[80%] h-[120%] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[130px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-[60%] h-[80%] bg-rose-500/5 dark:bg-rose-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

      <div className="max-w-2xl w-full space-y-8 relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <div className="p-2.5 bg-gray-900 dark:bg-white rounded-[1rem] shadow-lg transform hover:scale-110 transition-transform duration-500">
              <GraduationCap className="w-7 h-7 text-white dark:text-indigo-700" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              FutureIntern
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Create your account</h2>
          <p className="text-base text-gray-500 dark:text-indigo-100/60 font-medium">Start your journey to find the perfect internship</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/60 dark:bg-indigo-950/20 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-white/10">
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-700 transform ${step < currentStep
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg'
                      : step === currentStep
                        ? 'bg-indigo-600 dark:bg-white text-white dark:text-indigo-700 ring-8 ring-indigo-500/10 shadow-xl scale-110'
                        : 'bg-gray-50 dark:bg-white/5 text-gray-300 dark:text-indigo-200/20'
                    }`}
                  >
                    {step < currentStep ? <Check className="w-6 h-6 stroke-[3.5]" /> : step}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider mt-3 font-bold hidden sm:block ${step <= currentStep ? 'text-gray-900 dark:text-indigo-300' : 'text-gray-300 dark:text-indigo-200/20'}`}>
                    {step === 1 ? 'Account' : step === 2 ? (formData.userType === 'student' ? 'Interests' : 'Company') : (formData.userType === 'student' ? 'CV Upload' : 'Profile')}
                  </span>
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1.5 mx-4 rounded-full transition-all duration-1000 ${step < currentStep ? 'bg-indigo-500/50' : 'bg-gray-100 dark:bg-white/5'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-50 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-rose-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${stepProgress}%` }} />
          </div>
        </div>

        <form
          className="mt-10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-white/10 transition-all duration-500"
          onSubmit={handleSubmit}
        >
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* User Type Selection */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button type="button" onClick={() => handleUserTypeChange('student')}
                  className={`p-6 rounded-3xl border-2 transition-all duration-500 flex flex-col items-center gap-3 ${formData.userType === 'student'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 scale-[1.02] shadow-lg'
                    : 'border-gray-100 dark:border-white/5 text-gray-400 hover:border-indigo-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.userType === 'student' ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-white/5'}`}>
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-[11px] uppercase tracking-wider">Student</span>
                </button>
                <button type="button" onClick={() => handleUserTypeChange('company')}
                  className={`p-6 rounded-3xl border-2 transition-all duration-500 flex flex-col items-center gap-3 ${formData.userType === 'company'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 scale-[1.02] shadow-lg'
                    : 'border-gray-100 dark:border-white/5 text-gray-400 hover:border-indigo-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.userType === 'company' ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-white/5'}`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-[11px] uppercase tracking-wider">Company</span>
                </button>
              </div>

              {/* Name / Company Name */}
              {formData.userType === 'student' ? (
                <div>
                  <label htmlFor="name" className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-2.5 ml-1">Full name</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center transition-colors group-focus-within:bg-indigo-50 dark:group-focus-within:bg-indigo-900/20">
                      <User className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400" />
                    </div>
                    <input id="name" name="name" type="text" autoComplete="name" required value={formData.name} onChange={handleChange}
                      className={`w-full pl-16 pr-5 py-4 bg-white/50 dark:bg-slate-950/40 border rounded-xl text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-indigo-200/20 focus:outline-none focus:ring-2 transition-all font-medium text-base shadow-sm ${errors.name ? 'border-red-500 ring-4 ring-red-500/10' : 'border-gray-100 dark:border-white/5 focus:ring-indigo-500/20 focus:border-indigo-500/50'}`}
                      placeholder="Your Name" />
                  </div>
                  {errors.name && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.name}</p>}
                </div>
              ) : (
                <div>
                  <label htmlFor="companyName" className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-2.5 ml-1">Company Name</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center transition-colors group-focus-within:bg-rose-50 dark:group-focus-within:bg-rose-900/20">
                      <Building2 className="w-5 h-5 text-gray-400 group-focus-within:text-rose-600 dark:group-focus-within:text-rose-400" />
                    </div>
                    <input id="companyName" name="companyName" type="text" required value={formData.companyName} onChange={handleChange}
                      className={`w-full pl-16 pr-5 py-4 bg-white/50 dark:bg-slate-950/40 border rounded-xl text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-indigo-200/20 focus:outline-none focus:ring-2 transition-all font-medium text-base shadow-sm ${errors.companyName ? 'border-red-500 ring-4 ring-red-500/10' : 'border-gray-100 dark:border-white/5 focus:ring-rose-500/20 focus:border-rose-500/50'}`}
                      placeholder="e.g. FutureTech Inc." />
                  </div>
                  {errors.companyName && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.companyName}</p>}
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-2.5 ml-1">Email address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center transition-colors group-focus-within:bg-indigo-50 dark:group-focus-within:bg-indigo-900/20">
                    <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400" />
                  </div>
                  <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange}
                    className={`w-full pl-16 pr-5 py-4 bg-white/50 dark:bg-slate-950/40 border rounded-xl text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-indigo-200/20 focus:outline-none focus:ring-2 transition-all font-medium text-base shadow-sm ${errors.email ? 'border-red-500 ring-4 ring-red-500/10' : 'border-gray-100 dark:border-white/5 focus:ring-indigo-500/20 focus:border-indigo-500/50'}`}
                    placeholder="you@example.com" />
                </div>
                {errors.email && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.email}</p>}
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-2.5 ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center transition-colors group-focus-within:bg-rose-50 dark:group-focus-within:bg-rose-900/20">
                      <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-rose-600 dark:group-focus-within:text-rose-400" />
                    </div>
                    <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={formData.password} onChange={handleChange}
                      className={`w-full pl-16 pr-14 py-4 bg-white/50 dark:bg-slate-950/40 border rounded-xl text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-indigo-200/20 focus:outline-none focus:ring-2 transition-all font-medium text-base shadow-sm ${errors.password ? 'border-red-500' : 'border-gray-100 dark:border-white/5 focus:ring-rose-500/20 focus:border-rose-500/50'}`}
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.password}</p>}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-2.5 ml-1">Confirm password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center transition-colors group-focus-within:bg-rose-50 dark:group-focus-within:bg-rose-900/20">
                      <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-rose-600 dark:group-focus-within:text-rose-400" />
                    </div>
                    <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" required value={formData.confirmPassword} onChange={handleChange}
                      className={`w-full pl-16 pr-14 py-4 bg-white/50 dark:bg-slate-950/40 border rounded-xl text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-indigo-200/20 focus:outline-none focus:ring-2 transition-all font-medium text-base shadow-sm ${errors.confirmPassword ? 'border-red-500' : 'border-gray-100 dark:border-white/5 focus:ring-rose-500/20 focus:border-rose-500/50'}`}
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
                  className="w-full flex justify-center items-center py-4 px-6 bg-gray-900 dark:bg-white text-white dark:text-indigo-700 rounded-xl transition-all font-bold text-base shadow-lg hover:scale-[1.02] active:scale-95 group">
                  <span className="mr-3">Next Step</span>
                  <div className="w-7 h-7 rounded-full bg-white/20 dark:bg-indigo-600/10 flex items-center justify-center group-hover:translate-x-1 transition-all">
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
                  <label className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-3 ml-1">
                    <Heart className="inline w-3.5 h-3.5 mr-1.5 text-rose-500 fill-current opacity-50" /> Interests (Pick Exactly 3)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {INTEREST_OPTIONS.map((interest) => (
                      <button key={interest} type="button" onClick={() => handleInterestToggle(interest)}
                        disabled={!formData.interests.includes(interest) && formData.interests.length >= 3}
                        className={`px-3 py-4 rounded-xl border transition-all duration-500 text-[13px] font-bold tracking-tight disabled:opacity-30 disabled:cursor-not-allowed ${formData.interests.includes(interest)
                          ? 'bg-indigo-600 dark:bg-white text-white dark:text-indigo-700 border-indigo-600 scale-[1.02] shadow-lg'
                          : 'bg-white/40 dark:bg-white/5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 border-gray-100 dark:border-white/5 hover:border-indigo-300'
                        }`}>
                        {interest}
                      </button>
                    ))}
                  </div>
                  {errors.interests && <p className="mt-3 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.interests}</p>}
                  <div className="mt-5 flex items-center">
                    <div className="h-1.5 flex-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mr-4">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 transition-all duration-700 ease-out" style={{ width: `${(formData.interests.length / 3) * 100}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 dark:text-indigo-300 uppercase tracking-widest">{formData.interests.length} / 3 Selected</span>
                  </div>

                  <div>
                    <label htmlFor="university" className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-2.5 ml-1">University Name</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center transition-colors group-focus-within:bg-indigo-50 dark:group-focus-within:bg-indigo-900/20">
                        <GraduationCap className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400" />
                      </div>
                      <input id="university" name="university" type="text" required value={formData.university} onChange={handleChange}
                        className={`w-full pl-16 pr-5 py-4 bg-white/50 dark:bg-slate-950/40 border rounded-xl text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-indigo-200/20 focus:outline-none focus:ring-2 transition-all font-medium text-base shadow-sm ${errors.university ? 'border-red-500' : 'border-gray-100 dark:border-white/5 focus:ring-indigo-500/20 focus:border-indigo-500/50'}`}
                        placeholder="e.g. Stanford University" />
                    </div>
                    {errors.university && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.university}</p>}
                  </div>

                  <div>
                    <label htmlFor="major" className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-2.5 ml-1">Academic Major</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center transition-colors group-focus-within:bg-rose-50 dark:group-focus-within:bg-rose-900/20">
                        <BookOpen className="w-5 h-5 text-gray-400 group-focus-within:text-rose-600 dark:group-focus-within:text-rose-400" />
                      </div>
                      <input id="major" name="major" type="text" value={formData.major} onChange={handleChange}
                        className="w-full pl-16 pr-5 py-4 bg-white/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-indigo-200/20 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all font-medium text-base shadow-sm"
                        placeholder="e.g. Computer Science" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="industry" className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-2.5 ml-1">Industry</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center transition-colors group-focus-within:bg-indigo-50 dark:group-focus-within:bg-indigo-900/20">
                        <Briefcase className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400" />
                      </div>
                      <select id="industry" name="industry" required value={formData.industry} onChange={handleChange}
                        className={`w-full pl-16 pr-5 py-4 bg-white/50 dark:bg-slate-950/40 border rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all font-medium text-base shadow-sm appearance-none cursor-pointer ${errors.industry ? 'border-red-500' : 'border-gray-100 dark:border-white/5 focus:ring-indigo-500/20 focus:border-indigo-500/50'}`}>
                        <option value="" className="dark:bg-slate-900">Select industry</option>
                        {INDUSTRY_OPTIONS.map((ind) => <option key={ind} value={ind} className="dark:bg-slate-900">{ind}</option>)}
                      </select>
                    </div>
                    {errors.industry && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.industry}</p>}
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-2.5 ml-1">Location</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center transition-colors group-focus-within:bg-rose-50 dark:group-focus-within:bg-rose-900/20">
                        <Building2 className="w-5 h-5 text-gray-400 group-focus-within:text-rose-600 dark:group-focus-within:text-rose-400" />
                      </div>
                      <input id="location" name="location" type="text" required value={formData.location} onChange={handleChange}
                        className={`w-full pl-16 pr-5 py-4 bg-white/50 dark:bg-slate-950/40 border rounded-xl text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-indigo-200/20 focus:outline-none focus:ring-2 transition-all font-medium text-base shadow-sm ${errors.location ? 'border-red-500' : 'border-gray-100 dark:border-white/5 focus:ring-rose-500/20 focus:border-rose-500/50'}`}
                        placeholder="e.g. San Francisco, CA" />
                    </div>
                    {errors.location && <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center"><X className="w-3 h-3 mr-1" /> {errors.location}</p>}
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-2.5 ml-1">Company Website (Optional)</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center transition-colors group-focus-within:bg-indigo-50 dark:group-focus-within:bg-indigo-900/20">
                        <Globe className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400" />
                      </div>
                      <input id="website" name="website" type="url" value={formData.website} onChange={handleChange}
                        className="w-full pl-16 pr-5 py-4 bg-white/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-indigo-200/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium text-base shadow-sm"
                        placeholder="https://example.com" />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-8 flex gap-5">
                <button type="button" onClick={handleBack}
                  className="flex-1 flex justify-center items-center py-4 px-6 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[11px] font-bold text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-all uppercase tracking-wider shadow-sm">
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back
                </button>
                <button type="button" onClick={handleNext}
                  className="flex-1 flex justify-center items-center py-4 px-6 bg-gray-900 dark:bg-white text-white dark:text-indigo-700 rounded-xl transition-all font-bold text-base shadow-lg hover:scale-[1.02] active:scale-95 group">
                  <span className="mr-3">Continue</span>
                  <div className="w-7 h-7 rounded-full bg-white/20 dark:bg-indigo-600/10 flex items-center justify-center group-hover:translate-x-1 transition-all">
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
                        <div className={`bg-white/40 dark:bg-white/5 border-2 border-dashed rounded-[2rem] p-10 text-center transition-all duration-500 cursor-pointer group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/10 ${errors.cv ? 'border-red-500' : 'border-gray-200 dark:border-white/10 group-hover:border-indigo-500/50'}`}>
                          <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-500">
                            <Upload className="w-8 h-8 text-gray-300 dark:text-indigo-200/40 group-hover:text-indigo-600" />
                          </div>
                          <p className="text-lg text-gray-600 dark:text-indigo-100/60 font-medium mb-1"><span className="font-bold text-gray-900 dark:text-white">Click to upload</span></p>
                          <p className="text-[10px] text-gray-400 dark:text-indigo-200/20 font-bold uppercase tracking-wider">PDF or DOCX (Max 5MB)</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-indigo-50/50 dark:bg-indigo-950/40 backdrop-blur-3xl rounded-[2rem] p-6 flex items-center justify-between border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
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
                    <label htmlFor="description" className="block text-[11px] font-semibold text-gray-400 dark:text-indigo-200/40 uppercase tracking-wider mb-3 ml-1">Company Description <span className="text-rose-500">*</span></label>
                    <textarea id="description" name="description" rows={5} required value={formData.description} onChange={handleChange}
                      className={`w-full px-6 py-4 bg-white/50 dark:bg-slate-950/40 border rounded-[1.5rem] text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-indigo-200/20 focus:outline-none focus:ring-2 transition-all font-medium text-base shadow-sm resize-none ${errors.description ? 'border-red-500' : 'border-gray-100 dark:border-white/5 focus:ring-indigo-500/20 focus:border-indigo-500/50'}`}
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
                          <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer bg-gray-50/50 dark:bg-slate-900/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 ${errors.logo ? 'border-red-500' : 'border-gray-200 dark:border-slate-800 group-hover:border-blue-500'}`}>
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Upload className="w-6 h-6 text-gray-400 dark:text-blue-400 group-hover:text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1"><span className="font-bold text-gray-900 dark:text-white">Upload logo</span></p>
                            <p className="text-[10px] text-gray-500 dark:text-slate-500 font-bold uppercase tracking-wider">PNG, JPG or WEBP (MAX. 2MB)</p>
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

              <div className="flex items-start bg-gray-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800/50">
                <input id="terms" name="terms" type="checkbox" required className="h-5 w-5 text-blue-600 dark:text-blue-500 focus:ring-blue-500 border-gray-300 dark:border-slate-800 dark:bg-slate-900 rounded cursor-pointer mt-0.5" />
                <label htmlFor="terms" className="ml-3 block text-sm text-gray-700 dark:text-slate-400 font-medium cursor-pointer leading-relaxed">
                  I agree to the <Link to="/terms" className="font-bold text-gray-900 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors underline decoration-2 underline-offset-4">Terms of Service</Link>{' '}
                  and <Link to="/privacy" className="font-bold text-gray-900 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors underline decoration-2 underline-offset-4">Privacy Policy</Link>
                </label>
              </div>

              {submitError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {submitError}
                </div>
              )}

              <div className="pt-8 flex gap-5">
                <button type="button" onClick={handleBack} disabled={loading}
                  className="flex-1 flex justify-center items-center py-4 px-6 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[11px] font-bold text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-all uppercase tracking-wider shadow-sm disabled:opacity-50">
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex justify-center items-center py-4 px-6 bg-gray-900 dark:bg-white text-white dark:text-indigo-700 rounded-xl transition-all font-bold text-base shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group">
                  <span className="mr-3">{loading ? 'Creating...' : 'Create account'}</span>
                  <div className="w-7 h-7 rounded-full bg-white/20 dark:bg-indigo-600/10 flex items-center justify-center group-hover:scale-110 transition-all">
                    <Check className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="text-center mt-10 pt-8 border-t border-gray-100 dark:border-white/5">
            <p className="text-sm font-semibold text-gray-500 dark:text-indigo-100/40">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-8 decoration-2 font-bold transition-all">Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

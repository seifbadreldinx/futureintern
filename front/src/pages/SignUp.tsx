import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, BookOpen, Heart, Upload, FileText, X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
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

const MAJOR_OPTIONS = [
  'Computer Science',
  'Engineering',
  'Business',
  'Economics',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Psychology',
  'Communications',
  'Marketing',
  'Finance',
  'Design',
  'Other',
];

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  university: string;
  major: string;
  interests: string[];
  cv: File | null;
};

type StepErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  university?: string;
  interests?: string;
  cv?: string;
};

export function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
    major: '',
    interests: [],
    cv: null,
  });
  const [errors, setErrors] = useState<StepErrors>({});
  const [cvError, setCvError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
    if (errors[name as keyof StepErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.includes(interest)
        ? formData.interests.filter(i => i !== interest)
        : [...formData.interests, interest],
    });
    // Clear error when user selects an interest
    if (errors.interests) {
      setErrors({
        ...errors,
        interests: undefined,
      });
    }
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCvError('');
    setErrors({
      ...errors,
      cv: undefined,
    });

    if (!file) {
      setFormData({ ...formData, cv: null });
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      const errorMsg = 'Please upload a PDF or DOCX file only.';
      setCvError(errorMsg);
      setErrors({
        ...errors,
        cv: errorMsg,
      });
      e.target.value = '';
      return;
    }

    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = 'File size must be less than 5MB.';
      setCvError(errorMsg);
      setErrors({
        ...errors,
        cv: errorMsg,
      });
      e.target.value = '';
      return;
    }

    setFormData({ ...formData, cv: file });
  };

  const removeCv = () => {
    setFormData({ ...formData, cv: null });
    setCvError('');
    setErrors({
      ...errors,
      cv: undefined,
    });
    const fileInput = document.getElementById('cv') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const validateStep1 = (): boolean => {
    const newErrors: StepErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // University is in Step 2, so don't validate it here
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: StepErrors = {};

    if (formData.interests.length === 0) {
      newErrors.interests = 'Please select at least one interest';
    }

    if (!formData.university.trim()) {
      newErrors.university = 'University is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    // CV is now optional during registration
    return true;
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (currentStep === 1) {
      const isValid = validateStep1();
      console.log('Step 1 validation:', isValid, 'Errors:', errors);
      if (isValid) {
        setStepDirection('forward');
        setCurrentStep(2);
      } else {
        console.log('Step 1 validation failed');
      }
    } else if (currentStep === 2) {
      const isValid = validateStep2();
      console.log('Step 2 validation:', isValid, 'Errors:', errors);
      if (isValid) {
        setStepDirection('forward');
        setCurrentStep(3);
      } else {
        console.log('Step 2 validation failed');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStepDirection('backward');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    setSubmitError('');
    setLoading(true);

    try {
      // Register the user
      const response = await api.auth.registerStudent({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        university: formData.university || 'Not specified', // Use default if empty
        major: formData.major || 'Not specified',
        interests: formData.interests,
        cv: formData.cv || undefined,
      });

      console.log('Registration successful:', response);

      // If CV was provided, upload it separately (after registration)
      if (formData.cv) {
        try {
          await api.users.uploadCV(formData.cv);
          console.log('CV uploaded successfully');
        } catch (cvError) {
          console.warn('CV upload failed, but registration succeeded:', cvError);
          // Don't fail registration if CV upload fails
        }
      }

      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setSubmitError(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 3;
  const stepProgress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen education-bg relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float animation-delay-300"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-float animation-delay-500"></div>
      </div>

      {/* Student and Employee Icons Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-32 left-8 animate-float">
          <GraduationCap className="w-16 h-16 text-gray-700" />
        </div>
        <div className="absolute top-48 left-24 animate-float animation-delay-200">
          <User className="w-12 h-12 text-gray-600" />
        </div>
        <div className="absolute top-64 left-12 animate-float animation-delay-400">
          <FileText className="w-14 h-14 text-gray-700" />
        </div>
        <div className="absolute bottom-32 left-16 animate-float animation-delay-300">
          <BookOpen className="w-12 h-12 text-gray-600" />
        </div>
        <div className="absolute top-28 right-12 animate-float animation-delay-100">
          <GraduationCap className="w-16 h-16 text-gray-700" />
        </div>
        <div className="absolute top-44 right-28 animate-float animation-delay-300">
          <User className="w-14 h-14 text-gray-600" />
        </div>
      </div>

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <div className="text-center animate-fade-in-up">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <div className="p-2 bg-gray-900 rounded-lg shadow-lg transform hover:scale-110 transition-transform duration-300">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">
              FutureIntern
            </span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Create your account</h2>
          <p className="text-gray-600">Start your journey to find the perfect internship</p>
        </div>

        {/* Progress Bar */}
        <div className="glass-effect p-6 rounded-2xl shadow-xl animate-fade-in-up animation-delay-100">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${step < currentStep
                      ? 'bg-gray-900 text-white'
                      : step === currentStep
                        ? 'bg-gray-900 text-white ring-4 ring-gray-900/20'
                        : 'bg-gray-200 text-gray-500'
                      }`}
                  >
                    {step < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium hidden sm:block ${step <= currentStep ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                    {step === 1 ? 'Account' : step === 2 ? 'Interests' : 'CV Upload'}
                  </span>
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${step < currentStep ? 'bg-gray-900' : 'bg-gray-200'
                    }`} />
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gray-900 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${stepProgress}%` }}
            />
          </div>
        </div>

        <form
          className="mt-8 glass-effect p-8 rounded-2xl shadow-2xl transform hover:shadow-3xl transition-all duration-300 animate-fade-in-up animation-delay-200"
          onSubmit={handleSubmit}
        >
          {/* Step 1: Account Information */}
          {currentStep === 1 && (
            <div className={`space-y-5 ${stepDirection === 'backward' ? 'step-enter-left' : 'step-enter-up'}`}>
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full name
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-200 ${errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

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
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-200 ${errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-200 ${errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-200 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext(e);
                  }}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Next
                  <ChevronRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Interests & Background */}
          {currentStep === 2 && (
            <div className={`space-y-5 ${stepDirection === 'forward' ? 'step-enter-right' : 'step-enter-left'}`}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Heart className="inline w-4 h-4 mr-1" />
                  Interests (Select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm font-medium ${formData.interests.includes(interest)
                        ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900 hover:bg-gray-50'
                        }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                {errors.interests && (
                  <p className="mt-2 text-sm text-red-600">{errors.interests}</p>
                )}
                {formData.interests.length > 0 && !errors.interests && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {formData.interests.length} interest{formData.interests.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="university" className="block text-sm font-semibold text-gray-700 mb-2">
                  University <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-900 transition-colors pointer-events-none" />
                  <input
                    id="university"
                    name="university"
                    type="text"
                    required
                    value={formData.university}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-200 ${errors.university ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Your University"
                  />
                </div>
                {errors.university && (
                  <p className="mt-1 text-sm text-red-600">{errors.university}</p>
                )}
              </div>

              <div>
                <label htmlFor="major" className="block text-sm font-semibold text-gray-700 mb-2">
                  Academic Major (Optional)
                </label>
                <div className="relative group">
                  <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-900 transition-colors pointer-events-none" />
                  <select
                    id="major"
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="">Select your major (optional)</option>
                    {MAJOR_OPTIONS.map((major) => (
                      <option key={major} value={major}>
                        {major}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 flex justify-center items-center py-3.5 px-4 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <ChevronLeft className="mr-2 w-5 h-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext(e);
                  }}
                  className="flex-1 flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Next
                  <ChevronRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: CV Upload */}
          {currentStep === 3 && (
            <div className={`space-y-5 ${stepDirection === 'forward' ? 'step-enter-right' : 'step-enter-left'}`}>
              <div>
                <label htmlFor="cv" className="block text-sm font-semibold text-gray-700 mb-2">
                  <Upload className="inline w-4 h-4 mr-1" />
                  Upload CV <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Your CV helps our AI matching system connect you with relevant internship opportunities.
                  <span className="block mt-1 text-amber-600 font-medium text-xs">
                    Note: You must upload a CV later to apply for internships.
                  </span>
                </p>
                <div className="space-y-2">
                  {!formData.cv ? (
                    <div className="relative">
                      <input
                        id="cv"
                        name="cv"
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleCvChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-900 transition-colors cursor-pointer bg-gray-50 ${errors.cv ? 'border-red-500' : 'border-gray-300'
                        }`}>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium text-gray-900">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF or DOCX (MAX. 5MB)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <FileText className="w-8 h-8 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{formData.cv.name}</p>
                          <p className="text-xs text-gray-500">
                            {(formData.cv.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCv}
                        className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  {(cvError || errors.cv) && (
                    <p className="text-sm text-red-600 mt-1">{cvError || errors.cv}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Accepted formats: PDF, DOCX. Maximum file size: 5MB
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded cursor-pointer mt-1"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  I agree to the{' '}
                  <a href="#" className="text-gray-900 hover:text-gray-700 font-medium transition-colors underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-gray-900 hover:text-gray-700 font-medium transition-colors underline">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {submitError}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 flex justify-center items-center py-3.5 px-4 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="mr-2 w-5 h-5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </div>
          )}

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-gray-900 hover:text-gray-700 transition-colors underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

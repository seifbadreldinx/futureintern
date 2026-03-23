import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Heart, BookOpen, Upload, FileText, X,
  ChevronRight, Check, Loader2, Lock, Eye, EyeOff, Gift,
} from 'lucide-react';
import { api } from '../services/api';

const INTEREST_OPTIONS = [
  'Web Development', 'AI', 'Cyber Security', 'Business', 'Marketing',
  'Data Science', 'Design', 'Product Management', 'Consulting',
  'Research', 'Healthcare', 'Education', 'Media & Communications',
];

export function GoogleOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = interests+uni, 2 = CV, 3 = password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [interests, setInterests] = useState<string[]>([]);
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');

  // Step 2
  const [cv, setCv] = useState<File | null>(null);
  const [cvError, setCvError] = useState('');
  const [cvLater, setCvLater] = useState(false);

  // Step 3 — optional password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [skipPassword, setSkipPassword] = useState(false);

  const PASSWORD_RULES = [
    { test: (p: string) => p.length >= 8,                        label: 'At least 8 characters' },
    { test: (p: string) => /[a-zA-Z]/.test(p),                  label: 'At least one letter' },
    { test: (p: string) => /\d/.test(p),                         label: 'At least one number' },
    { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p),   label: 'At least one special character' },
  ];
  const allRulesMet = PASSWORD_RULES.every(r => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const toggleInterest = (i: string) => {
    setInterests(prev => {
      if (prev.includes(i)) return prev.filter(x => x !== i);
      if (prev.length >= 3) return prev;
      return [...prev, i];
    });
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCvError('');
    if (!file) { setCv(null); return; }
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!allowed.includes(file.type) && !['.pdf', '.docx'].includes(ext)) {
      setCvError('Please upload a PDF or DOCX file only.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCvError('File size must be less than 5MB.');
      e.target.value = '';
      return;
    }
    setCv(file);
  };

  const handleStep1Next = () => {
    if (interests.length !== 3) { setError('Please select exactly 3 interests.'); return; }
    if (!university.trim()) { setError('Please enter your university name.'); return; }
    setError('');
    setStep(2);
  };

  const handleFinish = async () => {
    if (!cv && !cvLater) { setCvError('Please upload your CV or check the box to add it later.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.users.updateProfile({
        university: university.trim(),
        major: major.trim() || 'Not specified',
        interests,
      });
      if (cv) {
        try { await api.users.uploadCV(cv); } catch { /* best-effort */ }
      }
      setStep(3); // go to password step
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');
    try {
      if (!skipPassword && password) {
        await api.auth.setPassword(password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 relative overflow-hidden flex items-center justify-center py-20 px-4">
      {/* Decorations */}
      <div className="absolute top-20 right-10 w-16 h-16 bg-blue-600 border-4 border-slate-900 rounded-full animate-float pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-12 h-12 bg-amber-400 border-4 border-slate-900 rotate-12 animate-float animation-delay-300 pointer-events-none" />
      <div className="absolute bottom-32 right-1/4 w-14 h-14 bg-rose-500 border-4 border-slate-900 rounded-2xl -rotate-12 animate-float animation-delay-500 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#0f172a 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="max-w-xl w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 mb-8">
            <div className="p-2.5 bg-slate-900 dark:bg-white rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#f43f5e]">
              <GraduationCap className="w-7 h-7 text-white dark:text-slate-900" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
              Future<span className="text-rose-500">Intern</span>
            </span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
            Complete Your Profile
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">
            {step === 1 ? 'Tell us about yourself to get matched'
              : step === 2 ? 'Upload your CV for better matches'
              : 'Set a password to also login with email'}
          </p>
          {/* Points notice */}
          <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 rounded-xl px-4 py-2">
            <Gift className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-black text-amber-700 dark:text-amber-400">🎉 50 welcome points added to your account!</span>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black border-[3px] transition-all ${
                  s < step ? 'bg-rose-500 text-white border-slate-900'
                    : s === step ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white scale-110'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-600'
                }`}>
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`w-16 h-1.5 rounded-full ${s < step ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
          {error && (
            <div className="mb-6 bg-rose-50 dark:bg-rose-900/20 border-[3px] border-rose-500 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-sm font-bold">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6">
              {/* Interests */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 ml-1">
                  <Heart className="inline w-3.5 h-3.5 mr-1.5 text-rose-500 fill-current opacity-50" />
                  Interests (Pick Exactly 3)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {INTEREST_OPTIONS.map(i => (
                    <button key={i} type="button" onClick={() => toggleInterest(i)}
                      disabled={!interests.includes(i) && interests.length >= 3}
                      className={`px-3 py-3 rounded-xl border-[3px] transition-all text-xs font-black tracking-tight disabled:opacity-30 disabled:cursor-not-allowed ${
                        interests.includes(i)
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#f43f5e] scale-[1.02]'
                          : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white border-slate-300 dark:border-slate-600 hover:border-slate-900 dark:hover:border-white'
                      }`}>
                      {i}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center">
                  <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mr-4 border-[2px] border-slate-900 dark:border-white">
                    <div className="h-full bg-rose-500 transition-all duration-700 ease-out" style={{ width: `${(interests.length / 3) * 100}%` }} />
                  </div>
                  <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{interests.length} / 3 Selected</span>
                </div>
              </div>

              {/* University */}
              <div>
                <label htmlFor="university" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">
                  University Name
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                  </div>
                  <input id="university" type="text" value={university} onChange={e => setUniversity(e.target.value)}
                    className="w-full pl-16 pr-5 py-4 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_#3b82f6] transition-all font-bold text-base"
                    placeholder="e.g. Stanford University" />
                </div>
              </div>

              {/* Major */}
              <div>
                <label htmlFor="major" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">
                  Academic Major <span className="text-slate-400 normal-case font-bold">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-rose-500" />
                  </div>
                  <input id="major" type="text" value={major} onChange={e => setMajor(e.target.value)}
                    className="w-full pl-16 pr-5 py-4 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_#f43f5e] transition-all font-bold text-base"
                    placeholder="e.g. Computer Science" />
                </div>
              </div>

              <button type="button" onClick={handleStep1Next}
                className="w-full flex justify-center items-center py-4 px-6 bg-rose-500 text-white border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black text-lg uppercase tracking-tighter group">
                <span className="mr-3">Next Step</span>
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-all">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          ) : step === 2 ? (
            <div className="space-y-6">
              {/* CV Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 ml-1">
                  <Upload className="inline w-4 h-4 mr-1 text-blue-600" /> Upload CV
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-bold mb-4">
                  Your CV helps our AI match you with relevant internships.
                </p>

                {!cv ? (
                  <div className="relative group">
                    <input type="file" accept=".pdf,.docx" onChange={handleCvChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className={`bg-white dark:bg-slate-800 border-[3px] border-dashed rounded-[2rem] p-10 text-center transition-all cursor-pointer group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 ${cvError ? 'border-rose-500' : 'border-slate-900 dark:border-white group-hover:shadow-[4px_4px_0px_0px_#3b82f6]'}`}>
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl border-[3px] border-slate-900 dark:border-white flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform shadow-[3px_3px_0px_0px_#0f172a]">
                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
                      </div>
                      <p className="text-lg text-slate-600 dark:text-slate-400 font-bold mb-1">
                        <span className="font-black text-slate-900 dark:text-white">Click to upload</span>
                      </p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">PDF or DOCX (Max 5MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-950/40 rounded-[2rem] p-6 flex items-center justify-between border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a]">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="w-14 h-14 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center">
                        <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{cv.name}</p>
                        <p className="text-xs font-bold text-indigo-500/60 uppercase tracking-widest">{(cv.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setCv(null)}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors bg-white dark:bg-white/5 rounded-full">
                      <X className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                )}

                {cvError && <p className="mt-3 text-xs font-bold text-rose-500 flex items-center ml-2"><X className="w-3 h-3 mr-2" />{cvError}</p>}

                <div className="mt-5 flex items-center bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100/50 dark:border-blue-900/20">
                  <input id="cvLater" type="checkbox" checked={cvLater}
                    onChange={e => { setCvLater(e.target.checked); if (e.target.checked) { setCv(null); setCvError(''); } }}
                    className="h-5 w-5 text-blue-600 border-gray-300 dark:border-slate-800 rounded cursor-pointer" />
                  <label htmlFor="cvLater" className="ml-3 text-sm text-gray-700 dark:text-slate-400 font-bold cursor-pointer">
                    I'll add my CV later in profile settings
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-4 px-6 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all uppercase tracking-wider text-sm">
                  Back
                </button>
                <button type="button" onClick={handleFinish} disabled={loading}
                  className="flex-1 flex justify-center items-center py-4 px-6 bg-rose-500 text-white border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black text-lg uppercase tracking-tighter disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <><Check className="w-5 h-5 mr-2" />Next Step</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ── Step 3: Optional password ── */
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border-[3px] border-blue-300 dark:border-blue-700 rounded-xl p-4">
                <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                  <Lock className="inline w-4 h-4 mr-1" />
                  Setting a password lets you log in with <strong>{"email + password"}</strong> in addition to Google.
                  Your Google email will be the login email. This step is optional.
                </p>
              </div>

              {!skipPassword && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">Password</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Lock className="w-5 h-5 text-blue-600" />
                      </div>
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full pl-16 pr-12 py-4 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_#3b82f6] transition-all font-bold text-base"
                        placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {PASSWORD_RULES.map(({ test, label }) => {
                          const ok = test(password);
                          return (
                            <li key={label} className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                              {ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} {label}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 ml-1">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Lock className="w-5 h-5 text-blue-600" />
                      </div>
                      <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        className={`w-full pl-16 pr-12 py-4 bg-white dark:bg-slate-800 border-[3px] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all font-bold text-base ${
                          confirmPassword.length > 0 ? (passwordsMatch ? 'border-emerald-500' : 'border-rose-500') : 'border-slate-900 dark:border-white'
                        }`}
                        placeholder="••••••••" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1">
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && (
                      <p className={`mt-2 text-xs font-bold flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {passwordsMatch ? <><Check className="w-3.5 h-3.5" />Passwords match</> : <><X className="w-3.5 h-3.5" />Passwords do not match</>}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                <input id="skipPwd" type="checkbox" checked={skipPassword} onChange={e => { setSkipPassword(e.target.checked); setPassword(''); setConfirmPassword(''); }}
                  className="h-5 w-5 text-blue-600 rounded cursor-pointer" />
                <label htmlFor="skipPwd" className="text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Skip for now — I'll only use Google to log in</label>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 py-4 px-6 bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white rounded-xl font-bold text-slate-900 dark:text-white hover:bg-slate-100 transition-all uppercase tracking-wider text-sm">
                  Back
                </button>
                <button type="button" onClick={handleComplete}
                  disabled={loading || (!skipPassword && password.length > 0 && (!allRulesMet || !passwordsMatch))}
                  className="flex-1 flex justify-center items-center py-4 px-6 bg-rose-500 text-white border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black text-lg uppercase tracking-tighter disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 mr-2" />Go to Dashboard</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

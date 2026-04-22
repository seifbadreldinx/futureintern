import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, BookOpen, FileText, Settings, LogOut, User, PlusCircle, Users, BarChart, Camera, X, Sparkles, MapPin, Clock, Github, Linkedin, Globe, Calendar, Phone, Award, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveLogoUrl } from '../utils/logoUrl';
import { CreateInternship } from './CreateInternship';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const focusField = searchParams.get('focus') || '';
  const navigate = useNavigate();

  // Redirect admin users to the dedicated Admin Panel
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Please log in to view your dashboard</h2>
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Log In</Link>
        </div>
      </div>
    );
  }

  // Admin users are redirected above; show loading while redirect happens
  if (user.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b-4 border-slate-900 dark:border-white transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
            {user.role === 'company' ? 'Company Dashboard' : 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Welcome, {user.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'company' ? (
          <CompanyDashboard activeTab={activeTab} setActiveTab={setActiveTab} user={user} logout={logout} />
        ) : (
          <StudentDashboard activeTab={activeTab} setActiveTab={setActiveTab} focusField={focusField} user={user} logout={logout} />
        )}
      </div>
    </div>
  );
}

function StudentDashboard({ activeTab, setActiveTab, focusField, user, logout }: any) {
  const { refreshUserData } = useAuth();
  const focusApplied = useRef(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [savedInternships, setSavedInternships] = useState<any[]>([]);
  const [recommendedInternships, setRecommendedInternships] = useState<any[]>([]);
  const [recommendError, setRecommendError] = useState<string | null>(null);
  const [pointsBalance, setPointsBalance] = useState<number>(user?.points ?? 0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationsLoaded, setRecommendationsLoaded] = useState(false);
  const [dailyRewardToast, setDailyRewardToast] = useState<string | null>(null);
  const [profileToast, setProfileToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [cvBuilderData, setCvBuilderData] = useState<{ headline?: string; summary?: string; sections_count: number } | null>(null);
  const [cvBuilderLoading, setCvBuilderLoading] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [deletingCV, setDeletingCV] = useState(false);
  const [exportingBuilderPDF, setExportingBuilderPDF] = useState(false);

  // Auto-focus a profile field when navigated from the profile completion card
  useEffect(() => {
    if (activeTab === 'profile' && focusField && !focusApplied.current) {
      focusApplied.current = true;
      // Wait for the profile tab to fully render before scrolling
      const tryFocus = (attemptsLeft: number) => {
        const el = document.getElementById(focusField) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
          // Add a temporary highlight ring so the field is obvious
          el.classList.add('ring-4', 'ring-indigo-500', 'ring-offset-2');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-2');
          }, 2500);
        } else if (attemptsLeft > 0) {
          setTimeout(() => tryFocus(attemptsLeft - 1), 150);
        }
      };
      setTimeout(() => tryFocus(5), 200);
    }
  }, [activeTab, focusField]);

  // Load CV Builder status when profile tab is opened
  useEffect(() => {
    if (activeTab !== 'profile') return;
    setCvBuilderLoading(true);
    api.cv.get()
      .then(res => {
        if (res.cv) {
          setCvBuilderData({
            headline: res.cv.headline ?? '',
            summary: res.cv.summary ?? '',
            sections_count: res.cv.sections?.length ?? 0,
          });
        } else {
          setCvBuilderData(null);
        }
      })
      .catch(() => setCvBuilderData(null))
      .finally(() => setCvBuilderLoading(false));
  }, [activeTab]);

  // Check for daily reward toast from login
  useEffect(() => {
    const stored = sessionStorage.getItem('daily_reward');
    if (stored) {
      sessionStorage.removeItem('daily_reward');
      try {
        const info = JSON.parse(stored);
        let msg = `🎉 +${info.daily_reward} daily login points!`;
        if (info.streak_bonus > 0) {
          msg += ` +${info.streak_bonus} streak bonus (${info.streak}-day streak)! 🔥`;
        } else if (info.streak > 1) {
          msg += ` (${info.streak}-day streak 🔥)`;
        }
        setDailyRewardToast(msg);
        setTimeout(() => setDailyRewardToast(null), 6000);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [apps, saved, balRes] = await Promise.all([
          api.applications.myApplications(),
          api.internships.listSaved(),
          api.points.getBalance().catch(() => ({ balance: 0 })),
        ]);
        setApplications(Array.isArray(apps) ? apps : []);
        setSavedInternships(Array.isArray(saved) ? saved : []);
        setPointsBalance(balRes.balance ?? 0);
        refreshUserData();
      } catch (err: any) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Load recommendations only when user clicks the tab (costs points)
  const loadRecommendations = async () => {
    if (recommendationsLoaded || isLoadingRecommendations) return;
    setIsLoadingRecommendations(true);
    setRecommendError(null);
    try {
      const recommended = await api.internships.listRecommendations();
      setRecommendedInternships(Array.isArray(recommended) ? recommended : []);
      setRecommendationsLoaded(true);
      // Refresh balance after charge
      const balRes = await api.points.getBalance().catch(() => ({ balance: 0 }));
      setPointsBalance(balRes.balance ?? 0);
      refreshUserData();
    } catch (err: any) {
      setRecommendedInternships([]);
      setRecommendError(
        err?.message || 'Could not load recommendations. Please try again later.'
      );
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleExportBuilderPDF = async () => {
    setExportingBuilderPDF(true);
    try {
      const response = await api.cv.exportPDF();
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        alert(json.error ?? 'PDF export failed. Please try again.');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV_${user.name?.replace(/\s+/g, '_') || 'CV'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('PDF export failed. Check your connection.');
    } finally {
      setExportingBuilderPDF(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
      case 'pending': return 'bg-blue-100 text-blue-700';
      case 'under_review':
      case 'under review': return 'bg-yellow-100 text-yellow-700';
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6 pb-6 border-b-[3px] border-slate-900 dark:border-white">
            <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-2xl border-[3px] border-slate-900 dark:border-white flex items-center justify-center shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
              {user.profile_image ? (
                <img src={resolveLogoUrl(user.profile_image)} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-900 dark:text-white text-lg truncate">{user.name}</p>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: Briefcase },
              { id: 'recommended', label: 'Recommended', icon: Sparkles },
              { id: 'applications', label: 'Applications', icon: FileText },
              { id: 'saved', label: 'Saved', icon: BookOpen },
              { id: 'profile', label: 'Profile', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-blue-600 text-white border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border-[3px] border-transparent font-medium'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-3">
            <Link
              to="/cv-builder"
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border-[3px] border-transparent font-medium"
            >
              <FileText className="w-5 h-5" />
              <span>CV Builder</span>
            </Link>
          </div>

          <div className="mt-3 pt-6 border-t-[3px] border-slate-900 dark:border-white">
            <Link to="/points" className="w-full flex items-center justify-between px-4 py-3 bg-amber-400 dark:bg-amber-500 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all group">
              <div className="flex items-center space-x-3">
                <Coins className="w-5 h-5 text-slate-900" />
                <span className="font-black text-slate-900">Points</span>
              </div>
              <span className="font-black text-slate-900">{pointsBalance}</span>
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t-[3px] border-slate-900 dark:border-white">
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-white bg-rose-500 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        {/* Daily Reward Toast */}
        {dailyRewardToast && (
          <div className="mb-4 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-5 py-3 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="font-medium">{dailyRewardToast}</span>
            </div>
            <button onClick={() => setDailyRewardToast(null)} className="text-amber-600 dark:text-amber-400 hover:text-amber-800">✕</button>
          </div>
        )}
        {/* Profile Update Toast */}
        {profileToast && createPortal(
          <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex items-center justify-between gap-4 px-6 py-3 rounded-xl border-[3px] shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] whitespace-nowrap ${
            profileToast.ok
              ? 'bg-green-50 dark:bg-green-900/20 border-green-600 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-600 text-red-800 dark:text-red-300'
          }`}>
            <span className="font-bold">{profileToast.msg}</span>
            <button onClick={() => setProfileToast(null)} className="font-bold opacity-60 hover:opacity-100">✕</button>
          </div>
        , document.body)}

        {activeTab === 'overview' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] transition-all overflow-hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-slate-600 dark:text-slate-400 text-xs mb-1 font-bold uppercase tracking-wider">Total Applications</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{applications.length}</p>
                  </div>
                  <div className="p-2.5 bg-blue-600 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a] shrink-0">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] transition-all overflow-hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-slate-600 dark:text-slate-400 text-xs mb-1 font-bold uppercase tracking-wider">Saved Internships</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{savedInternships.length}</p>
                  </div>
                  <div className="p-2.5 bg-green-500 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a] shrink-0">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] transition-all overflow-hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-slate-600 dark:text-slate-400 text-xs mb-1 font-bold uppercase tracking-wider">Under Review</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {applications.filter((a) => a.status === 'Under Review').length}
                    </p>
                  </div>
                  <div className="p-2.5 bg-amber-400 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a] shrink-0">
                    <Briefcase className="w-6 h-6 text-slate-900" />
                  </div>
                </div>
              </div>
              <Link to="/points" className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] transition-all block overflow-hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-slate-600 dark:text-slate-400 text-xs mb-1 font-bold uppercase tracking-wider">Points Balance</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{pointsBalance}</p>
                  </div>
                  <div className="p-2.5 bg-amber-400 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a] shrink-0">
                    <Coins className="w-6 h-6 text-slate-900" />
                  </div>
                </div>
              </Link>
            </div>

            <Link
              to="/cv-builder"
              className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a] shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-base uppercase tracking-tight">CV Builder</p>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Build your professional CV with ATS scoring &amp; 3 templates</p>
                </div>
              </div>
              <span className="text-rose-500 font-black text-lg hidden sm:block">Build Now →</span>
            </Link>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Recent Applications</h2>
              <div className="space-y-4">
                {applications.slice(0, 3).map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between p-4 border-[3px] border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/30 rounded-xl shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{app.title}</h3>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{app.company_name || 'Company'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border-[2px] border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 font-medium">{new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/browse" className="mt-6 inline-block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition-colors">
                Browse more internships →
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'recommended' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Recommended for You</h2>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Based on your skills, major, and interests</p>
                </div>
                <div className="p-2 bg-blue-600 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a]">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>

              {!recommendationsLoaded && !isLoadingRecommendations && !recommendError ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-blue-200 dark:text-blue-900 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-slate-400 mb-4">AI recommendations cost 10 points per request.</p>
                  <button
                    onClick={loadRecommendations}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Get AI Recommendations
                  </button>
                </div>
              ) : isLoadingRecommendations ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-slate-400 font-medium">Finding your best matches…</p>
                  <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">This may take up to 30 seconds while the AI processes your profile.</p>
                </div>
              ) : recommendError ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                  {recommendError.toLowerCase().includes('complete your profile') ? (
                    <>
                      <p className="text-gray-900 dark:text-white font-bold text-lg mb-2">Profile Incomplete</p>
                      <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">{recommendError}</p>
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-bold"
                      >
                        Complete Profile
                      </button>
                    </>
                  ) : recommendError?.toLowerCase().includes('insufficient points') ? (
                    <>
                      <p className="text-gray-900 dark:text-white font-bold text-lg mb-2">Not Enough Points</p>
                      <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">You need 10 points to get AI recommendations. Earn points by completing your profile, applying to internships, and daily logins.</p>
                      <Link
                        to="/points"
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-bold"
                      >
                        Earn Points
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-red-600 dark:text-red-400 mb-6">{recommendError}</p>
                      <button
                        onClick={() => { setRecommendError(null); loadRecommendations(); }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-bold"
                      >
                        Try Again
                      </button>
                    </>
                  )}
                </div>
              ) : recommendedInternships.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-slate-400">No specific recommendations yet. Try updating your profile or uploading a CV!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {(recommendedInternships || []).map((rec: any) => (
                    <div key={rec.internship.id} className="group border-[3px] border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/20 rounded-xl p-6 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {rec.internship.company?.profile_image ? (
                              <img
                                src={resolveLogoUrl(rec.internship.company.profile_image)}
                                alt={rec.internship.company?.name || 'Company'}
                                className="w-10 h-10 rounded-lg object-contain border-[2px] border-slate-200 dark:border-slate-600 bg-white flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg border-[2px] border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <Briefcase className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {rec.internship.title}
                            </h3>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-400 rounded-full border-[2px] border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
                              <span className="text-[11px] font-black text-slate-900">{Math.round(rec.score)}% Match</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-slate-400 mb-4 font-medium">
                            {rec.internship.company?.name && (
                              <div className="flex items-center gap-1.5">
                                <Briefcase className="w-4 h-4" />
                                <span className="font-semibold">{rec.internship.company.name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              <span>{rec.internship.location}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Why we recommend this:</p>
                            <div className="flex flex-wrap gap-2">
                              {rec.match_details && (
                                <>
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold border-[2px] border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
                                    Semantic: {rec.match_details.sbert_score?.toFixed(1)}%
                                  </span>
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-700 text-white text-[11px] font-bold border-[2px] border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
                                    Keyword: {rec.match_details.tfidf_score?.toFixed(1)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 md:flex-col lg:flex-row">
                          <Link
                            to={`/internship/${rec.internship.id}`}
                            className="flex-1 md:w-full lg:flex-1 px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white text-sm font-bold rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all text-center"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">My Applications</h2>
            {applications.length === 0 && isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-400 mb-4">You haven't applied to any internships yet.</p>
                <Link to="/browse" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-bold">
                  Browse Internships
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app: any) => (
                  <div key={app.id} className="border-[3px] border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/20 rounded-xl p-6 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{app.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">{app.company_name || 'Company'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border-[2px] border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 dark:text-slate-400">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                      <Link to={`/internship/${app.internship_id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Saved Internships</h2>
            {savedInternships.length === 0 && isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : savedInternships.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-400 mb-4">You haven't saved any internships yet.</p>
                <Link to="/browse" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-bold">
                  Browse Internships
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedInternships.map((internship) => (
                  <Link
                    key={internship.id}
                    to={`/internship/${internship.id}`}
                    className="border-[3px] border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/20 rounded-xl p-6 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all"
                  >
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{internship.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">{internship.company}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Profile Settings</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);

              // Helper to parse comma separated strings into arrays
              const parseList = (val: any) => val ? val.split(',').map((s: string) => s.trim()).filter(Boolean).join(', ') : '';

              try {
                await api.auth.updateProfile({
                  name: formData.get('full_name'),
                  university: formData.get('university_name'),
                  major: formData.get('major'),
                  bio: formData.get('bio'),
                  phone: formData.get('phone_number'),
                  skills: parseList(formData.get('skills')),
                  location: parseList(formData.get('preferred_locations')),
                  interests: parseList(formData.get('interests')),
                });
                await refreshUserData();
                setProfileToast({ msg: 'Profile updated successfully!', ok: true });
                setTimeout(() => setProfileToast(null), 4000);
              } catch (err) {
                setProfileToast({ msg: 'Failed to update profile. Please try again.', ok: false });
                setTimeout(() => setProfileToast(null), 4000);
              }
            }} className="space-y-6">
              <div className="flex items-center space-x-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                    {user.profile_image ? (
                      <img src={resolveLogoUrl(user.profile_image)} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-xl border-[2px] border-slate-900 cursor-pointer hover:bg-blue-700 transition-colors shadow-[2px_2px_0px_0px_#0f172a]">
                    <Camera className="w-4 h-4" />
                    <input type="file" id="profile_image_upload" name="profile_image_upload" className="hidden" accept="image/*" onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        try {
                          await api.auth.uploadProfileImage(e.target.files[0]);
                          await refreshUserData();
                        } catch (err) {
                          alert('Failed to upload image');
                        }
                      }
                    }} />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Photo</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Click the camera icon to upload a new photo.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Full Name</label>
                  <input id="full_name" name="full_name" type="text" defaultValue={user.name} className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                </div>
                <div>
                  <label htmlFor="university_name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">University Name</label>
                  <input id="university_name" name="university_name" type="text" defaultValue={user.university_name} className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="major" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Academic Major</label>
                  <input id="major" name="major" type="text" defaultValue={user.major} placeholder="e.g. Computer Science" className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                </div>
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="phone_number" name="phone_number" type="tel" defaultValue={user.phone_number} placeholder="+1234567890" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="graduation_date" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Graduation Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="graduation_date" name="graduation_date" type="date" defaultValue={user.graduation_date ? new Date(user.graduation_date).toISOString().split('T')[0] : ''} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                  </div>
                </div>
                <div>
                  <label htmlFor="interests" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Top 3 Interests</label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="interests" name="interests" type="text" defaultValue={Array.isArray(user.interests) ? user.interests.join(', ') : (user.interests || '')} placeholder="AI, UI/UX, Backend (Select exactly 3)" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 italic">Note: Separate with commas. Exactly 3 required for matching.</p>
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium text-blue-600 dark:text-blue-400">Professional Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  defaultValue={user.bio}
                  placeholder="Tell us about yourself, your skills, and what you're looking for..."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Technical Skills</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="skills" name="skills" type="text" defaultValue={Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || '')} placeholder="React, Python, SQL (comma-separated)" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                  </div>
                </div>
                <div>
                  <label htmlFor="preferred_locations" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Preferred Locations</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="preferred_locations" name="preferred_locations" type="text" defaultValue={Array.isArray(user.preferred_locations) ? user.preferred_locations.join(', ') : (user.location || '')} placeholder="Egypt, Remote (comma-separated)" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t-[3px] border-slate-900 dark:border-white">
                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Online Presence</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input name="github_url" type="url" defaultValue={user.github_url} placeholder="GitHub URL" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                  </div>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input name="linkedin_url" type="url" defaultValue={user.linkedin_url} placeholder="LinkedIn URL" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input name="portfolio_url" type="url" defaultValue={user.portfolio_url} placeholder="Portfolio/Website" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black uppercase tracking-tight">
                  Save All Changes
                </button>
              </div>
            </form>

            {/* ── Your CV Section ── */}
            <div className="mt-8 pt-6 border-t-[3px] border-slate-900 dark:border-white">
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Your CV</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Uploaded CV */}
                <div className="rounded-xl border-[3px] border-slate-900 dark:border-white p-4 space-y-3 bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Uploaded CV</h4>
                  </div>
                  {user.resume_url ? (
                    <>
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                        ✓ PDF file attached
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={resolveLogoUrl(user.resume_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Download
                        </a>
                        <label className={`text-xs px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors ${uploadingCV ? 'opacity-60 pointer-events-none' : ''}`}>
                          {uploadingCV ? 'Uploading…' : 'Replace'}
                          <input type="file" className="hidden" accept=".pdf" onChange={async (e) => {
                            if (!e.target.files?.[0]) return;
                            setUploadingCV(true);
                            try {
                              await api.users.uploadCV(e.target.files[0]);
                              await refreshUserData();
                            } catch { alert('Upload failed. Please try again.'); }
                            finally { setUploadingCV(false); }
                          }} />
                        </label>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm('Remove your uploaded CV?')) return;
                            setDeletingCV(true);
                            try {
                              await api.users.deleteCV();
                              await refreshUserData();
                            } catch { alert('Delete failed.'); }
                            finally { setDeletingCV(false); }
                          }}
                          disabled={deletingCV}
                          className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-100 dark:hover:bg-red-900 disabled:opacity-60 transition-colors"
                        >
                          {deletingCV ? '…' : 'Remove'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500 dark:text-slate-400">No CV uploaded yet. Upload a PDF file.</p>
                      <label className={`inline-flex items-center gap-2 text-xs px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-blue-700 transition-colors ${uploadingCV ? 'opacity-60 pointer-events-none' : ''}`}>
                        {uploadingCV ? 'Uploading…' : '↑ Upload PDF'}
                        <input type="file" className="hidden" accept=".pdf" onChange={async (e) => {
                          if (!e.target.files?.[0]) return;
                          setUploadingCV(true);
                          try {
                            await api.users.uploadCV(e.target.files[0]);
                            await refreshUserData();
                          } catch { alert('Upload failed. Please try again.'); }
                          finally { setUploadingCV(false); }
                        }} />
                      </label>
                    </>
                  )}
                </div>

                {/* CV Builder */}
                <div className="rounded-xl border-[3px] border-slate-900 dark:border-white p-4 space-y-3 bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">CV Builder</h4>
                  </div>
                  {cvBuilderLoading ? (
                    <p className="text-xs text-slate-400">Loading…</p>
                  ) : cvBuilderData && (cvBuilderData.headline || cvBuilderData.summary || cvBuilderData.sections_count > 0) ? (
                    <>
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                        ✓ CV built — {cvBuilderData.sections_count} section{cvBuilderData.sections_count !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to="/cv-builder"
                          className="text-xs px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={handleExportBuilderPDF}
                          disabled={exportingBuilderPDF}
                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-1.5"
                        >
                          {exportingBuilderPDF && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          Download PDF
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500 dark:text-slate-400">No CV built yet. Use our builder to create an ATS-optimised CV.</p>
                      <Link
                        to="/cv-builder"
                        className="inline-flex items-center gap-2 text-xs px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Build CV
                      </Link>
                    </>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompanyDashboard({ activeTab, setActiveTab, user, logout }: any) {
  const { refreshUserData } = useAuth();
  const [postedInternships, setPostedInternships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [profileToast, setProfileToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
      case 'pending': return 'bg-blue-100 text-blue-700';
      case 'under_review':
      case 'under review': return 'bg-yellow-100 text-yellow-700';
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [internships, apps] = await Promise.all([
          api.internships.listMy(),
          api.applications.listCompany(),
        ]);
        setPostedInternships(Array.isArray(internships) ? internships : []);
        setApplications(Array.isArray(apps) ? apps : []);
      } catch (err) {
        console.error('Error fetching company dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6 pb-6 border-b-[3px] border-slate-900 dark:border-white">
            <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-2xl border-[3px] border-slate-900 dark:border-white flex items-center justify-center shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
              {user.profile_image ? (
                <img src={resolveLogoUrl(user.profile_image)} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <PlusCircle className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-900 dark:text-white text-lg truncate">{user.companyName || user.name}</p>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 truncate">Company Portal</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Company Overview', icon: BarChart },
              { id: 'my-internships', label: 'My Internships', icon: Briefcase },
              { id: 'create-internship', label: 'Post New Internship', icon: PlusCircle },
              { id: 'applications', label: 'All Applications', icon: Users },
              { id: 'profile', label: 'Company Profile', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-blue-600 text-white border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border-[3px] border-transparent font-medium'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t-[3px] border-slate-900 dark:border-white">
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-white bg-rose-500 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        {/* Profile Update Toast (Company) */}
        {profileToast && createPortal(
          <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex items-center justify-between gap-4 px-6 py-3 rounded-xl border-[3px] shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] whitespace-nowrap ${
            profileToast.ok
              ? 'bg-green-50 dark:bg-green-900/20 border-green-600 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-600 text-red-800 dark:text-red-300'
          }`}>
            <span className="font-bold">{profileToast.msg}</span>
            <button onClick={() => setProfileToast(null)} className="font-bold opacity-60 hover:opacity-100">✕</button>
          </div>
        , document.body)}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-1 font-bold uppercase tracking-wider">Active Postings</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{postedInternships.length}</p>
                  </div>
                  <div className="p-3 bg-blue-600 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a] shrink-0">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-1 font-bold uppercase tracking-wider">Total Applications</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{applications.length}</p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a] shrink-0">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-1 font-bold uppercase tracking-wider">Views This week</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">124</p>
                  </div>
                  <div className="p-3 bg-amber-400 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_#0f172a] shrink-0">
                    <BarChart className="w-8 h-8 text-slate-900" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Recent Postings</h2>
              <div className="space-y-4">
                {postedInternships.map((internship) => (
                  <div key={internship.id} className="flex items-center justify-between p-4 border-[3px] border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/30 rounded-xl shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{internship.title}</h3>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{internship.applications} applications</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-400 text-slate-900 border-[2px] border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] capitalize">
                        {internship.status}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Posted on {new Date(internship.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('create-internship')}
                className="mt-6 inline-block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Post a new opportunity →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'my-internships' && (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/50 p-6 border border-transparent dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Posted Internships</h2>
              <button
                onClick={() => setActiveTab('create-internship')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post New</span>
              </button>
            </div>
            <div className="space-y-4">
              {postedInternships.map((internship) => (
                <div key={internship.id} className="border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 rounded-xl p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{internship.title}</h3>
                      <p className="text-gray-600 dark:text-slate-400">
                        {applications.filter(a => a.internship_id === internship.id).length} Students Applied
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-400 text-slate-900 border-[2px] border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] capitalize">
                      {internship.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t-[3px] border-slate-900 dark:border-white pt-4 mt-4">
                    <p className="text-sm text-gray-500">Posted on {new Date(internship.created_at).toLocaleDateString()}</p>
                    <div className="flex space-x-3">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</button>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this internship?')) {
                            try {
                              await api.internships.delete(internship.id);
                              setPostedInternships(prev => prev.filter(i => i.id !== internship.id));
                            } catch (err) {
                              alert('Failed to delete internship');
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'create-internship' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-transparent dark:border-slate-800 overflow-hidden">
            <CreateInternship isDashboardTab={true} onCancel={() => setActiveTab('my-internships')} />
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Candidate Applications</h2>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-400">No applications received yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app: any) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApplication(app)}
                    className="flex items-center justify-between p-4 border-[3px] border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/20 rounded-xl shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] cursor-pointer transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 dark:text-white">{app.student_name || 'Unknown Student'}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border-[2px] border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-500">{app.student_email}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">Applied to: <span className="text-gray-800 dark:text-slate-200">{app.internship_title || `Internship #${app.internship_id}`}</span></p>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-900/30">
                          <BarChart className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">Match: {Math.round(app.matching_score)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-right">
                      <div className="hidden sm:block">
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-1">Status</p>
                        <select
                          value={app.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={async (e) => {
                            try {
                              await api.applications.updateStatus(app.id, e.target.value);
                              setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: e.target.value } : a));
                            } catch (err) {
                              alert('Failed to update status');
                            }
                          }}
                          className="bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded px-2 py-1 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="pending">Pending</option>
                          <option value="under_review">Reviewing</option>
                          <option value="accepted">Accept</option>
                          <option value="rejected">Reject</option>
                        </select>
                      </div>
                      <div className="text-gray-400 dark:text-slate-500">
                        <FileText className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Student Profile Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedApplication(null)}>
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {selectedApplication.student_name?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Student Profile</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{selectedApplication.student_email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Professional Info</h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-slate-500 mb-1">Full Name</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{selectedApplication.student_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-slate-500 mb-1">University</p>
                          <p className="text-base font-medium text-gray-800 dark:text-slate-200">{selectedApplication.student_university || 'Not Specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-slate-500 mb-1">Major</p>
                          <p className="text-base font-medium text-gray-800 dark:text-slate-200">{selectedApplication.student_major || 'Not Specified'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(selectedApplication.student_interests) && selectedApplication.student_interests.length > 0 ? (
                          selectedApplication.student_interests.map((interest: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-medium rounded-full border border-gray-200 dark:border-slate-700">
                              {interest}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-slate-500 italic">No interests listed</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">AI Comparison Analysis</h4>
                      <div className="bg-gray-50 dark:bg-slate-800/40 rounded-xl p-6 space-y-4 border border-gray-100 dark:border-slate-800">
                        <div>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-gray-600 dark:text-slate-400 font-medium">Overall Match</span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold">{Math.round(selectedApplication.matching_score)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                              style={{ width: `${selectedApplication.matching_score}%` }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-gray-500 dark:text-slate-500 font-bold uppercase mb-1">Skills</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(selectedApplication.skills_score)}%</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 dark:text-slate-500 font-bold uppercase mb-1">CV Relevance</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(selectedApplication.cv_relevance_score)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Application Assets</h4>
                      <a
                        href={selectedApplication.student_cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selectedApplication.student_cv_url
                          ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 border-transparent cursor-not-allowed'
                          }`}
                        onClick={(e) => !selectedApplication.student_cv_url && e.preventDefault()}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5" />
                          <span className="font-bold">View Student CV</span>
                        </div>
                        <LogOut className="w-4 h-4 rotate-[-45deg]" />
                      </a>
                      {!selectedApplication.student_cv_url && (
                        <p className="text-xs text-red-500 mt-2 font-medium">Student hasn't uploaded a CV yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="px-6 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Company Profile Settings</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              try {
                await api.auth.updateProfile({
                  full_name: formData.get('company_name'),
                  // Industry support could be added if backend supports it in updateProfile
                });
                await refreshUserData();
                setProfileToast({ msg: 'Profile updated successfully!', ok: true });
                setTimeout(() => setProfileToast(null), 4000);
              } catch (err) {
                setProfileToast({ msg: 'Failed to update profile. Please try again.', ok: false });
                setTimeout(() => setProfileToast(null), 4000);
              }
            }} className="space-y-6">
              <div className="flex items-center space-x-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                    {user.profile_image ? (
                      <img src={resolveLogoUrl(user.profile_image)} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <Briefcase className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-xl border-[2px] border-slate-900 cursor-pointer hover:bg-blue-700 transition-colors shadow-[2px_2px_0px_0px_#0f172a]">
                    <Camera className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        try {
                          await api.auth.uploadProfileImage(e.target.files[0]);
                          await refreshUserData();
                        } catch (err) {
                          alert('Failed to upload image');
                        }
                      }
                    }} />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Company Logo</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">This logo will be displayed on your internship postings.</p>
                </div>
              </div>

              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Company Name</label>
                <input id="company_name" name="company_name" type="text" defaultValue={user.companyName || user.name} className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
              </div>
              <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-black uppercase tracking-tight">
                Save Changes
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

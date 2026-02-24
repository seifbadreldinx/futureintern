import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, BookOpen, FileText, Settings, LogOut, User, PlusCircle, Users, BarChart, Camera, X, Sparkles, MapPin, Clock, Github, Linkedin, Globe, Calendar, Phone, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CreateInternship } from './CreateInternship';
import { api } from '../services/api';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

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

  return (
    <div className="min-h-screen">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {user.role === 'company' ? 'Company Dashboard' : 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-slate-400">Welcome, {user.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'company' ? (
          <CompanyDashboard activeTab={activeTab} setActiveTab={setActiveTab} user={user} logout={logout} />
        ) : (
          <StudentDashboard activeTab={activeTab} setActiveTab={setActiveTab} user={user} logout={logout} />
        )}
      </div>
    </div>
  );
}

function StudentDashboard({ activeTab, setActiveTab, user, logout }: any) {
  const { refreshUserData } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [savedInternships, setSavedInternships] = useState<any[]>([]);
  const [recommendedInternships, setRecommendedInternships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [apps, saved, recommended] = await Promise.all([
          api.applications.myApplications(),
          api.internships.listSaved(),
          api.internships.listRecommendations(),
        ]);
        setApplications(apps);
        setSavedInternships(saved);
        setRecommendedInternships(recommended);
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/50 p-6 mb-6 border border-transparent dark:border-slate-800">
          <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              {user.profile_image_url ? (
                <img src={user.profile_image_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-lg truncate">{user.name}</p>
              <p className="text-sm text-gray-600 dark:text-slate-400 truncate">{user.email}</p>
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
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/30'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-800">
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/20 p-6 border border-transparent dark:border-slate-800 hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm mb-1 font-medium">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{applications.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/20 p-6 border border-transparent dark:border-slate-800 hover:border-green-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm mb-1 font-medium">Saved Internships</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{savedInternships.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl">
                    <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/20 p-6 border border-transparent dark:border-slate-800 hover:border-yellow-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm mb-1 font-medium">Under Review</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {applications.filter((a) => a.status === 'Under Review').length}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl">
                    <Briefcase className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/50 p-6 border border-transparent dark:border-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Applications</h2>
              <div className="space-y-4">
                {applications.slice(0, 3).map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{app.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">{app.company_name || 'Company'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)} dark:bg-opacity-20`}>
                        {app.status}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/browse" className="mt-6 inline-block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                Browse more internships →
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'recommended' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/50 p-6 border border-transparent dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recommended for You</h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Based on your skills, major, and interests</p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              {recommendedInternships.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-slate-400">No specific recommendations yet. Try updating your profile or uploading a CV!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {recommendedInternships.map((rec: any) => (
                    <div key={rec.internship.id} className="group border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 rounded-xl p-6 hover:shadow-xl hover:border-blue-500/30 transition-all duration-300">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {rec.internship.title}
                            </h3>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 dark:bg-green-900/30 rounded-full border border-green-100 dark:border-green-900/50">
                              <span className="text-[11px] font-black text-green-700 dark:text-green-400">{Math.round(rec.match_score)}% Match</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-slate-400 mb-4 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-4 h-4" />
                              <span>{rec.internship.company_name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              <span>{rec.internship.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              <span>{rec.internship.type}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Why we recommend this:</p>
                            <div className="flex flex-wrap gap-2">
                              {rec.matching_reasons.map((reason: string, i: number) => (
                                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[11px] font-bold border border-blue-100 dark:border-blue-900/30">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 md:flex-col lg:flex-row">
                          <Link
                            to={`/internship/${rec.internship.id}`}
                            className="flex-1 md:w-full lg:flex-1 px-6 py-2.5 bg-gray-900 dark:bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-gray-800 dark:hover:bg-blue-700 transition-all text-center shadow-lg shadow-blue-500/10"
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
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/50 p-6 border border-transparent dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">My Applications</h2>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-400 mb-4">You haven't applied to any internships yet.</p>
                <Link to="/browse" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                  Browse Internships
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app: any) => (
                  <div key={app.id} className="border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 rounded-xl p-6 hover:shadow-md dark:hover:bg-slate-800 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{app.title}</h3>
                        <p className="text-gray-600 dark:text-slate-400">{app.company_name || 'Company'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)} dark:bg-opacity-20`}>
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
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/50 p-6 border border-transparent dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Saved Internships</h2>
            {savedInternships.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-400 mb-4">You haven't saved any internships yet.</p>
                <Link to="/browse" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                  Browse Internships
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedInternships.map((internship) => (
                  <Link
                    key={internship.id}
                    to={`/internship/${internship.id}`}
                    className="border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 rounded-xl p-6 hover:shadow-md dark:hover:bg-slate-800 transition-all border border-transparent dark:hover:border-blue-500/20"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{internship.title}</h3>
                    <p className="text-gray-600 dark:text-slate-400">{internship.company}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/50 p-6 border border-transparent dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Settings</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);

              // Helper to parse comma separated strings into arrays
              const parseList = (val: any) => val ? val.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

              try {
                await api.auth.updateProfile({
                  full_name: formData.get('full_name'),
                  university_name: formData.get('university_name'),
                  major: formData.get('major'),
                  bio: formData.get('bio'),
                  phone_number: formData.get('phone_number'),
                  graduation_date: formData.get('graduation_date') || null,
                  skills: parseList(formData.get('skills')),
                  preferred_locations: parseList(formData.get('preferred_locations')),
                  github_url: formData.get('github_url'),
                  linkedin_url: formData.get('linkedin_url'),
                  portfolio_url: formData.get('portfolio_url'),
                  interests: parseList(formData.get('interests')),
                });
                await refreshUserData();
                alert('Profile updated successfully!');
              } catch (err) {
                alert('Failed to update profile');
              }
            }} className="space-y-6">
              <div className="flex items-center space-x-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-900 shadow-lg">
                    {user.profile_image_url ? (
                      <img src={user.profile_image_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-400 dark:text-slate-500" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
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
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Photo</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Click the camera icon to upload a new photo.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Full Name</label>
                  <input name="full_name" type="text" defaultValue={user.name} className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">University Name</label>
                  <input name="university_name" type="text" defaultValue={user.university_name} className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Academic Major</label>
                  <input name="major" type="text" defaultValue={user.major} placeholder="e.g. Computer Science" className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input name="phone_number" type="tel" defaultValue={user.phone_number} placeholder="+1234567890" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Graduation Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input name="graduation_date" type="date" defaultValue={user.graduation_date ? new Date(user.graduation_date).toISOString().split('T')[0] : ''} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Top 3 Interests</label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input name="interests" type="text" defaultValue={user.interests?.join(', ')} placeholder="AI, UI/UX, Backend (Select exactly 3)" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 italic">Note: Separate with commas. Exactly 3 required for matching.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium text-blue-600 dark:text-blue-400">Professional Bio</label>
                <textarea
                  name="bio"
                  rows={4}
                  defaultValue={user.bio}
                  placeholder="Tell us about yourself, your skills, and what you're looking for..."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Technical Skills</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input name="skills" type="text" defaultValue={user.skills?.join(', ')} placeholder="React, Python, SQL (comma-separated)" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 font-medium">Preferred Locations</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input name="preferred_locations" type="text" defaultValue={user.preferred_locations?.join(', ')} placeholder="Egypt, Remote (comma-separated)" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Online Presence</h4>
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
                <button type="submit" className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/20 font-bold">
                  Save All Changes
                </button>
              </div>
            </form>
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
        setPostedInternships(internships);
        setApplications(apps);
      } catch (err) {
        console.error('Error fetching company dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/50 p-6 mb-6 border border-transparent dark:border-slate-800">
          <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              {user.profile_image_url || user.logo_url ? (
                <img src={user.profile_image_url || user.logo_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <PlusCircle className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-lg truncate">{user.companyName || user.name}</p>
              <p className="text-sm text-gray-600 dark:text-slate-400 truncate">Company Portal</p>
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
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/30'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-800">
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/20 p-6 border border-transparent dark:border-slate-800 hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm mb-1 font-medium">Active Postings</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{postedInternships.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                    <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/20 p-6 border border-transparent dark:border-slate-800 hover:border-green-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm mb-1 font-medium">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{applications.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl">
                    <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/20 p-6 border border-transparent dark:border-slate-800 hover:border-yellow-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm mb-1 font-medium">Views This week</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">124</p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl">
                    <BarChart className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-slate-950/50 p-6 border border-transparent dark:border-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Postings</h2>
              <div className="space-y-4">
                {postedInternships.map((internship) => (
                  <div key={internship.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{internship.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">{internship.applications} applications</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-opacity-20 capitalize">
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
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-opacity-20 capitalize">
                      {internship.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-4 mt-4">
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
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 border border-transparent dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Candidate Applications</h2>
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
                    className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 cursor-pointer transition-all hover:shadow-sm"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{app.student_name || 'Unknown Student'}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(app.status)} dark:bg-opacity-20`}>
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
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 border border-transparent dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Company Profile Settings</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              try {
                await api.auth.updateProfile({
                  full_name: formData.get('company_name'),
                  // Industry support could be added if backend supports it in updateProfile
                });
                await refreshUserData();
                alert('Profile updated successfully!');
              } catch (err) {
                alert('Failed to update profile');
              }
            }} className="space-y-6">
              <div className="flex items-center space-x-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-900 shadow-lg">
                    {user.profile_image_url || user.logo_url ? (
                      <img src={user.profile_image_url || user.logo_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <Briefcase className="w-12 h-12 text-gray-400 dark:text-slate-500" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Company Name</label>
                <input name="company_name" type="text" defaultValue={user.companyName || user.name} className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors" />
              </div>
              <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md font-medium">
                Save Changes
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, BookOpen, FileText, Settings, LogOut, User, MapPin, CheckCircle, AlertCircle, X } from 'lucide-react';
import { api } from '../services/api';
import { SaveButton } from '../components/SaveButton';
import { logout } from '../utils/auth';

export function Dashboard() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'saved' | 'profile' | 'recommended' | 'post-internship' | 'my-internships'>((searchParams.get('tab') as any) || 'overview');
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]); // New state
  const [savedInternships, setSavedInternships] = useState<any[]>([]); // Saved internships
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingInternship, setEditingInternship] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user data and applications
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userData, applicationsData, savedData] = await Promise.all([
          api.auth.getCurrentUser().catch(() => null),
          api.applications.getAll().catch(() => ({ applications: [] })),
          api.users.getSavedInternships().catch(() => ({ saved_internships: [] }))
        ]);

        if (userData) {
          setUser(userData.user || userData);
        }

        // Set saved internships
        if (savedData && savedData.saved_internships) {
          setSavedInternships(savedData.saved_internships);
        }

        // Try to fetch recommendations if student
        try {
          const recData = await api.recommendations.getRecommendations();
          if (recData && recData.recommendations) {
            setRecommendations(recData.recommendations);
          }
        } catch (e) {
          console.log("Recommendations fetch failed (likely not student role):", e);
        }

        // Transform applications data to match expected format
        // Backend returns: { applications: [...], total: number }
        const appsArray = applicationsData?.applications || (Array.isArray(applicationsData) ? applicationsData : []);
        const formattedApplications = appsArray.map((app: any) => ({
          id: app.id,
          internshipId: app.internship?.id,
          title: app.internship?.title || 'Unknown Internship',
          company: app.internship?.company_name || app.internship?.company || 'Unknown Company',
          status: app.status === 'pending' ? 'Under Review' :
            app.status === 'accepted' ? 'Accepted' :
              app.status === 'rejected' ? 'Rejected' :
                app.status || 'Applied',
          date: app.applied_at ? new Date(app.applied_at).toLocaleDateString() :
            app.created_at ? new Date(app.created_at).toLocaleDateString() :
              new Date().toLocaleDateString()
        }));

        setApplications(formattedApplications);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // If unauthorized, redirect to login
        if (error instanceof Error && error.message.includes('401')) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    logout();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-100 text-blue-700';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-700';
      case 'Accepted':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                  {user?.profile_image ? (
                    <img
                      src={`${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '')}${user.profile_image}`}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
                      }}
                    />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user?.name || 'Loading...'}</p>
                  <p className="text-sm text-gray-600">{user?.email || 'Loading...'}</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Briefcase className="w-5 h-5" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab('recommended')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'recommended'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Recommended</span>
                </button>
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'applications'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Applications</span>
                </button>
                {user?.role !== 'company' && (
                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'saved'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Saved</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Profile</span>
                </button>
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading dashboard...</p>
              </div>
            ) : (
              <>
                {/* Company Dashboard Logic */}
                {user?.role === 'company' && (
                  <>
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome, {user.company_name || user.name}!</h2>
                          <p className="text-gray-600">Manage your internships and applications here.</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <button
                              onClick={() => {
                                setEditingInternship(null);
                                setActiveTab('post-internship' as any);
                              }}
                              className="flex items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors group"
                            >
                              <div className="text-center">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <Briefcase className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Post a New Internship</h3>
                                <p className="text-sm text-gray-500 mt-1">Add a new opportunity for students</p>
                              </div>
                            </button>

                            <button
                              onClick={() => setActiveTab('my-internships' as any)}
                              className="flex items-center justify-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                            >
                              <div className="text-center">
                                <p className="text-3xl font-bold text-gray-900 mb-1">
                                  {/* We might filter applications to only show ones for this company, but for now just showing button */}
                                  View Listings
                                </p>
                                <p className="text-sm text-gray-500">Check your active internships</p>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Recent Applications for Company could go here */}
                      </div>
                    )}

                    {activeTab === ('post-internship' as any) && (
                      <div className="bg-white rounded-lg shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">{editingInternship ? 'Edit Internship' : 'Post a New Internship'}</h2>
                        <PostInternshipForm
                          internship={editingInternship}
                          onSuccess={() => {
                            setEditingInternship(null);
                            setActiveTab('my-internships' as any);
                          }}
                        />
                      </div>
                    )}


                    {activeTab === ('my-internships' as any) && (
                      <MyInternshipsList onEdit={(internship) => {
                        setEditingInternship(internship);
                        setActiveTab('post-internship' as any);
                      }} />
                    )}

                    {activeTab === 'profile' && (
                      <ProfileSettings user={user} onUpdate={(updatedUser) => setUser(updatedUser)} />
                    )}
                  </>
                )}

                {/* Student Dashboard Logic (Default) */}
                {user?.role !== 'company' && (
                  <>
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-600 text-sm mb-1">Total Applications</p>
                                <p className="text-3xl font-bold text-gray-900">{applications.length}</p>
                              </div>
                              <FileText className="w-12 h-12 text-blue-600 opacity-20" />
                            </div>
                          </div>

                          <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-600 text-sm mb-1">Saved Internships</p>
                                <p className="text-3xl font-bold text-gray-900">{savedInternships.length}</p>
                              </div>
                              <BookOpen className="w-12 h-12 text-green-600 opacity-20" />
                            </div>
                          </div>

                          <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-600 text-sm mb-1">Top Match</p>
                                <p className={`text-3xl font-bold ${recommendations.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                  {recommendations.length > 0 ? `${recommendations[0].score}%` : 'N/A'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {recommendations.length > 0 ? 'Best fit based on skills' : 'Add skills to see matches'}
                                </p>
                              </div>
                              <Briefcase className="w-12 h-12 text-yellow-600 opacity-20" />
                            </div>
                          </div>
                        </div>

                        {/* Top Recommendations Preview */}
                        <div className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${recommendations.length > 0 ? 'border-green-500' : 'border-gray-300'}`}>
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                              {recommendations.length > 0 ? `Recommended for You (${recommendations.length})` : 'Get Matched!'}
                            </h2>
                            <button
                              onClick={() => setActiveTab('recommended')}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              {recommendations.length > 0 ? 'View All' : 'How it works?'}
                            </button>
                          </div>

                          {recommendations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {recommendations.slice(0, 2).map((item: any, idx: number) => (
                                <div key={idx} className="border border-gray-100 p-4 rounded-lg bg-gray-50 flex justify-between items-start">
                                  <div>
                                    <h3 className="font-semibold text-gray-900">{item.internship.title}</h3>
                                    <p className="text-sm text-gray-600">{item.internship.company?.name || 'Company'}</p>
                                  </div>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">
                                    {item.score}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                              <p className="text-gray-600 mb-2">We can't find perfect matches for you yet.</p>
                              <p className="text-sm text-gray-500 mb-4">Update your profile with your skills (e.g., Python, React, Design) to get personalized recommendations instantly.</p>
                              <button onClick={() => setActiveTab('profile')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                                Update Profile Skills
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="bg-white rounded-lg shadow-lg p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Applications</h2>
                          <div className="space-y-4">
                            {applications.slice(0, 3).map((app) => (
                              <div key={app.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                  <h3 className="font-semibold text-gray-900">{app.title}</h3>
                                  <p className="text-sm text-gray-600">{app.company}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                    {app.status}
                                  </span>
                                  <p className="text-xs text-gray-500 mt-1">{app.date}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <Link
                            to="/browse"
                            className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Browse more internships →
                          </Link>
                        </div>
                      </div>
                    )}

                    {activeTab === 'applications' && (
                      <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">My Applications</h2>
                        {applications.length === 0 ? (
                          <div className="text-center py-12">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">You haven't applied to any internships yet.</p>
                            <Link
                              to="/browse"
                              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Browse Internships
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {applications.map((app) => (
                              <div key={app.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{app.title}</h3>
                                    <p className="text-gray-600">{app.company}</p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                    {app.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-gray-500">Applied on {app.date}</p>
                                  <Link
                                    to={`/internship/${app.internshipId}`}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                  >
                                    View Details →
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recommended Tab Content */}
                    {activeTab === 'recommended' && (
                      <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Recommended for You</h2>
                        <p className="text-gray-500 mb-4">Based on your major and skills.</p>

                        {recommendations.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-600">No specific recommendations yet. Update your profile skills!</p>
                            <Link to="/browse" className="text-blue-600 hover:underline mt-2 inline-block">Browse All</Link>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommendations.map((item: any, idx: number) => {
                              const internship = item.internship;
                              return (
                                <div key={idx} className="border border-green-200 bg-green-50 rounded-lg p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                                    {item.score}% Match
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{internship.title}</h3>
                                  <p className="text-gray-600 text-sm mb-2">{internship.company?.name || 'Company'}</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {item.match_details?.skills > 0 && <span className="text-xs bg-white border border-green-200 px-2 py-1 rounded text-green-700">Skills Match</span>}
                                    {item.match_details?.location > 0 && <span className="text-xs bg-white border border-blue-200 px-2 py-1 rounded text-blue-700">Location</span>}
                                  </div>
                                  <Link
                                    to={`/internship/${internship.id}`}
                                    className="mt-4 inline-block text-sm font-medium text-green-700 hover:text-green-800"
                                  >
                                    View Details →
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'saved' && (
                      <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Saved Internships</h2>
                        {savedInternships.length === 0 ? (
                          <div className="text-center py-12">
                            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">You haven't saved any internships yet.</p>
                            <Link
                              to="/browse"
                              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Browse Internships
                            </Link>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedInternships.map((internship) => {
                              const companyName = internship.company?.name || internship.company || internship.company_name || 'Company';
                              return (
                                <div key={internship.id} className="relative bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all">
                                  <div className="absolute top-4 right-4 z-10">
                                    <SaveButton internshipId={internship.id} />
                                  </div>
                                  <Link to={`/internship/${internship.id}`} className="block">
                                    <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm border border-gray-100 overflow-hidden">
                                      {internship.company?.profile_image ? (
                                        <img
                                          src={internship.company.profile_image.startsWith('http')
                                            ? internship.company.profile_image
                                            : `${(import.meta.env.VITE_API_BASE_URL || 'https://futureintern-production.up.railway.app/api').replace(/\/api\/?$/, '')}${internship.company.profile_image}`}
                                          alt={companyName}
                                          className="w-full h-full object-contain p-2"
                                          onError={(e) => {
                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=eff6ff&color=2563eb&size=128`;
                                          }}
                                        />
                                      ) : (
                                        <img
                                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=eff6ff&color=2563eb&size=128`}
                                          alt={companyName}
                                          className="w-full h-full object-contain p-2"
                                        />
                                      )}
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                      {internship.title}
                                    </h3>

                                    <div className="flex items-center text-gray-600 mb-3">
                                      <span className="font-medium">{companyName}</span>
                                    </div>

                                    <div className="flex items-center text-gray-500 text-sm mb-4">
                                      <MapPin className="w-4 h-4 mr-1" />
                                      {internship.location}
                                    </div>

                                    {internship.type && (
                                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        {internship.type}
                                      </span>
                                    )}
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}


                    {activeTab === 'profile' && (
                      <ProfileSettings user={user} onUpdate={(updatedUser) => setUser(updatedUser)} />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// Helper Component for Profile Settings
function ProfileSettings({ user, onUpdate }: { user: any, onUpdate: (user: any) => void }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    skills: user?.skills || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  // Local state for resume URL to ensure immediate UI update
  const [resumeUrl, setResumeUrl] = useState(user?.resume_url);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        skills: user.skills || ''
      });
      setResumeUrl(user.resume_url);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.users.updateProfile(formData);
      showToast('Profile updated successfully!', 'success');
      if (onUpdate) onUpdate({ ...user, ...formData, resume_url: resumeUrl });
    } catch (err) {
      showToast('Failed to update profile', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type/size
    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB", 'error');
      return;
    }

    try {
      setUploadingCv(true);
      const res = await api.users.uploadCV(file);
      showToast('CV uploaded successfully!', 'success');

      // Update local UI immediately
      setResumeUrl(res.resume_url);

      // Update form data with new skills if found
      if (res.skills) {
        setFormData(prev => ({ ...prev, skills: res.skills }));
      }

      if (onUpdate) {
        onUpdate({
          ...user,
          resume_url: res.resume_url,
          skills: res.skills || user.skills
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload CV', 'error');
    } finally {
      setUploadingCv(false);
      // Clear input
      e.target.value = '';
    }
  };

  const handleCvDelete = async () => {
    if (!confirm('Are you sure you want to delete your CV? This action cannot be undone.')) {
      return;
    }

    try {
      setUploadingCv(true);
      await api.users.deleteCV();
      showToast('CV deleted successfully!', 'success');

      // Update local UI immediately
      setResumeUrl(null);

      if (onUpdate) {
        onUpdate({
          ...user,
          resume_url: null
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete CV', 'error');
    } finally {
      setUploadingCv(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 relative">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h2>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 flex items-center p-4 rounded-xl shadow-2xl z-[9999] animate-in slide-in-from-top-4 duration-300 border backdrop-blur-sm ${toast.type === 'success'
          ? 'bg-white/90 border-green-200 text-green-800'
          : 'bg-white/90 border-red-200 text-red-800'
          }`}>
          <div className={`p-2 rounded-full mr-3 ${toast.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
          </div>
          <span className="font-semibold">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            value={formData.email}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input
            type="text"
            placeholder="City, State"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            rows={4}
            placeholder="Tell us about yourself..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={formData.bio}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
          />
        </div>
        {user?.role === 'company' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
            <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className={`p-3 rounded-full ${user?.profile_image ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.profile_image ? 'Logo Uploaded' : 'No Logo Uploaded'}
                </p>
                {user?.profile_image && (
                  <div className="mt-2 w-20 h-20 border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <img
                      src={user.profile_image.startsWith('http') ? user.profile_image : `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '')}${user.profile_image}`}
                      alt="Company Logo"
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.company_name || user.name || 'C')}&background=eff6ff&color=2563eb&size=128`;
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (file.size > 2 * 1024 * 1024) {
                        showToast("File size must be less than 2MB", 'error');
                        return;
                      }

                      try {
                        setUploadingCv(true);
                        const res = await api.users.uploadLogo(file);
                        showToast('Logo uploaded successfully!', 'success');
                        if (onUpdate) {
                          onUpdate({ ...user, profile_image: res.profile_image });
                        }
                      } catch (err: any) {
                        showToast(err.message || 'Failed to upload logo', 'error');
                      } finally {
                        setUploadingCv(false);
                        e.target.value = '';
                      }
                    }}
                    disabled={uploadingCv}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${user?.profile_image
                      ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                      }`}
                    disabled={uploadingCv}
                  >
                    {uploadingCv ? 'Uploading...' : user?.profile_image ? 'Replace' : 'Upload'}
                  </button>
                </div>
                {user?.profile_image && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('Are you sure you want to delete your logo? This action cannot be undone.')) {
                        return;
                      }

                      try {
                        setUploadingCv(true);
                        await api.users.deleteLogo();
                        showToast('Logo deleted successfully!', 'success');
                        if (onUpdate) {
                          onUpdate({ ...user, profile_image: null });
                        }
                      } catch (err: any) {
                        showToast(err.message || 'Failed to delete logo', 'error');
                      } finally {
                        setUploadingCv(false);
                      }
                    }}
                    disabled={uploadingCv}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {user?.role === 'student' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills (Comma separated)</label>
              <input
                type="text"
                placeholder="Python, React, Design..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.skills}
                onChange={e => setFormData({ ...formData, skills: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resume / CV</label>
              <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className={`p-3 rounded-full ${resumeUrl ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {resumeUrl ? 'Resume Uploaded' : 'No Resume Uploaded'}
                  </p>
                  {resumeUrl && (
                    <a
                      href={`${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '')}${resumeUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline truncate block max-w-[200px]"
                    >
                      View current resume
                    </a>
                  )}
                </div>
                <div className="flex space-x-2">
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleCvUpload}
                      disabled={uploadingCv}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${resumeUrl
                        ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                        }`}
                      disabled={uploadingCv}
                    >
                      {uploadingCv ? 'Uploading...' : resumeUrl ? 'Replace' : 'Upload'}
                    </button>
                  </div>
                  {resumeUrl && (
                    <button
                      type="button"
                      onClick={handleCvDelete}
                      disabled={uploadingCv}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

// Helper Component for My Internships List
function MyInternshipsList({ onEdit }: { onEdit: (internship: any) => void }) {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const response = await api.internships.getMyInternships();
      setInternships(response?.internships || []);
    } catch (error) {
      console.error('Failed to fetch internships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(id);
      await api.internships.delete(id);
      // Remove from list
      setInternships(internships.filter(i => i.id !== id));
      alert('Internship deleted successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to delete internship');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your internships...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">My Internships</h2>
        <span className="text-sm text-gray-600">{internships.length} total</span>
      </div>

      {internships.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">You haven't posted any internships yet.</p>
          <button
            onClick={() => onEdit(null as any)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Post Your First Internship
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {internships.map((internship) => (
            <div key={internship.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{internship.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {internship.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {internship.location}
                      </div>
                    )}
                    {internship.duration && <span>• {internship.duration}</span>}
                    {internship.stipend && <span>• {internship.stipend}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${internship.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {internship.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{internship.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Posted on {internship.created_at ? new Date(internship.created_at).toLocaleDateString() : 'N/A'}
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/internship/${internship.id}`}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => onEdit(internship)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(internship.id, internship.title)}
                    disabled={deleting === internship.id}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleting === internship.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper Component for Post Internship Form
function PostInternshipForm({ internship, onSuccess }: { internship?: any, onSuccess: () => void }) {
  console.log('PostInternshipForm render. Internship prop:', internship);

  const [formData, setFormData] = useState({
    title: internship?.title || '',
    description: internship?.description || '',
    requirements: internship?.requirements || '',
    location: internship?.location || '',
    duration: internship?.duration || '',
    stipend: internship?.stipend || '',
    major: internship?.major || 'General'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('PostInternshipForm useEffect. Internship:', internship);
    if (internship) {
      setFormData({
        title: internship.title || '',
        description: internship.description || '',
        requirements: internship.requirements || '',
        location: internship.location || '',
        duration: internship.duration || '',
        stipend: internship.stipend || '',
        major: internship.major || 'General'
      });
    } else {
      // Create mode - reset form
      setFormData({
        title: '',
        description: '',
        requirements: '',
        location: '',
        duration: '',
        stipend: '',
        major: 'General'
      });
    }
  }, [internship]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (internship?.id) {
        await api.internships.update(internship.id, formData);
        alert('Internship updated successfully!');
      } else {
        await api.internships.create(formData);
        alert('Internship posted successfully!');
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(internship?.id ? 'Failed to update internship' : 'Failed to post internship');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Internship Title</label>
          <input required type="text" className="w-full border rounded-lg p-2"
            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Major (Category)</label>
          <select className="w-full border rounded-lg p-2"
            value={formData.major} onChange={e => setFormData({ ...formData, major: e.target.value })}
          >
            <option value="General">General</option>
            <option value="Computer Science">Computer Science / IT</option>
            <option value="Design">Design / Creative</option>
            <option value="Marketing">Marketing / Business</option>
            <option value="Data Science">Data Science / AI</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input required type="text" className="w-full border rounded-lg p-2" placeholder="e.g. Cairo (Remote)"
            value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <input type="text" className="w-full border rounded-lg p-2" placeholder="e.g. 3 Months"
            value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stipend (Optional)</label>
          <input type="text" className="w-full border rounded-lg p-2" placeholder="e.g. 3000 EGP"
            value={formData.stipend} onChange={e => setFormData({ ...formData, stipend: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea required rows={4} className="w-full border rounded-lg p-2"
          value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
        <textarea required rows={3} className="w-full border rounded-lg p-2" placeholder="List skills separated by commas..."
          value={formData.requirements} onChange={e => setFormData({ ...formData, requirements: e.target.value })} />
      </div>

      <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
        {loading ? 'Posting...' : 'Post Internship'}
      </button>
    </form>
  );
}


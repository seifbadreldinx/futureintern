import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Briefcase, ArrowLeft, Send, X, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { isAuthenticated } from '../utils/auth';

export function InternshipDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [internship, setInternship] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCvModal, setShowCvModal] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const intId = Number(id);
      try {
        const res = await api.internships.getById(intId);
        const data = res?.internship || res;
        if (data) {
          setInternship(data);

          if (isAuthenticated()) {
            try {
              const userData = await api.auth.getCurrentUser();
              setUser(userData.user || userData);
            } catch (e) {
              console.error("Failed to fetch user:", e);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch internship from API', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading internship...</p>
        </div>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Internship not found</h2>
          <p className="text-gray-600 mb-6">The internship you are looking for does not exist or has been removed.</p>
          <Link to="/browse" className="text-blue-600 hover:text-blue-700 font-medium">
            Browse all internships
          </Link>
        </div>
      </div>
    );
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Full-time':
        return 'bg-blue-100 text-blue-700';
      case 'Part-time':
        return 'bg-green-100 text-green-700';
      case 'Remote':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleApply = async () => {
    // If internship has an external application link, open it
    if (internship.application_link) {
      window.open(internship.application_link, '_blank');
      return;
    }

    // Otherwise, use the internal application system
    if (!isAuthenticated()) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    if (user && !user.resume_url) {
      setShowCvModal(true);
      return;
    }

    try {
      await api.applications.create(internship.id);
      // Provide immediate feedback — in a real app show a toast instead
      alert('Application submitted successfully.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Apply error:', err);
      const message = err instanceof Error ? err.message : 'Unable to apply at this time.';
      alert(`Failed to apply: ${message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 relative shadow-sm">
                {internship.company?.profile_image ? (
                  <img
                    src={(() => {
                      const logoUrl = internship.company.profile_image;
                      if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
                        const pathMatch = logoUrl.match(/\/uploads\/logos\/(.+)$/);
                        if (pathMatch) {
                          return `${import.meta.env.VITE_API_URL || 'https://futureintern-backend-production.up.railway.app'}/uploads/logos/${pathMatch[1]}`;
                        }
                        return logoUrl;
                      }
                      return `${import.meta.env.VITE_API_URL || 'https://futureintern-backend-production.up.railway.app'}${logoUrl}`;
                    })()}
                    alt={internship.company?.name}
                    onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${internship.company?.name || 'C'}&background=eff6ff&color=2563eb&size=256`}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <img src={`https://ui-avatars.com/api/?name=${internship.company?.name || 'Company'}&background=eff6ff&color=2563eb&size=256`} alt="Company Logo" className="w-full h-full object-contain p-2" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{internship.title}</h1>
                <p className="text-xl text-gray-600 mb-4">{internship.company?.name || internship.company || 'Unknown Company'}</p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-2" />
                    {internship.location}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor(internship.type || '')}`}>
                    {internship.type || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            {user?.role !== 'company' && (
              <button onClick={handleApply} className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                Apply Now
              </button>
            )}
            {user?.role === 'company' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                Companies cannot apply to internships. You can only post internships for students to apply to.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Role</h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p>
              We are looking for a motivated {internship.title} to join our team at {internship.company?.name || internship.company || internship.company_name || 'the company'}.
              This is an excellent opportunity to gain hands-on experience in a fast-paced environment
              and work alongside industry professionals.
            </p>
            <p>
              As an intern, you will have the chance to contribute to real projects, learn from experienced
              mentors, and develop skills that will set you up for success in your career.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
              Responsibilities
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Assist with day-to-day tasks and projects</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Collaborate with team members on assignments</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Participate in team meetings and discussions</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Learn and apply industry best practices</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Requirements
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Currently enrolled in a relevant degree program</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Strong communication and teamwork skills</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Passion for learning and professional growth</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Basic knowledge in relevant field</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About {internship.company?.name || internship.company || internship.company_name || 'Company'}</h2>
          <p className="text-gray-700 leading-relaxed">
            {internship.company?.name || internship.company || internship.company_name || 'The company'} is a leading company in the industry, committed to innovation and excellence.
            We provide a supportive environment where interns can learn, grow, and make meaningful contributions
            to our team. Join us and be part of something great!
          </p>
        </div>
      </div>

      {/* CV Requirement Modal */}
      {showCvModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200 border border-gray-100">
            <button
              onClick={() => setShowCvModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 ring-4 ring-amber-50">
                <FileText className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">CV Upload Required</h3>
              <p className="text-gray-600 leading-relaxed">
                To apply for this internship, you need to upload your CV/Resume to your profile first.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCvModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/dashboard?tab=profile')}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                Go to Upload
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

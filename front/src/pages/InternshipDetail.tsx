import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Calendar, Briefcase, ArrowLeft, Send, X, FileText } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { resolveLogoUrl } from '../utils/logoUrl';
import { isAuthenticated } from '../utils/auth';

export function InternshipDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [internship, setInternship] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCvModal, setShowCvModal] = useState(false);
  const autoApply = new URLSearchParams(location.search).get('autoApply') === 'true';

  const handleApply = useCallback(async () => {
    // ── Auth gate: must be logged in to apply ──
    if (!isAuthenticated()) {
      navigate(`/login?redirect=/internship/${id}?autoApply=true`);
      return;
    }

    // Only students can apply
    if (user && user.role !== 'student') {
      alert(`Only students can apply for internships. Your current role is ${user.role}.`);
      return;
    }

    // If internship has an external application link, record the application then open the link
    if (internship?.application_link) {
      try {
        await api.applications.create(internship.id);
      } catch (err) {
        // Ignore duplicate application errors so the link still opens
        const message = err instanceof Error ? err.message : '';
        if (!message.toLowerCase().includes('already')) {
          console.error('Apply error:', err);
        }
      }
      window.open(internship.application_link, '_blank');
      navigate('/dashboard?tab=applications');
      return;
    }

    // CV required for internal applications
    if (user && !user.resume_url) {
      setShowCvModal(true);
      return;
    }

    try {
      await api.applications.create(internship.id);
      alert('Application submitted successfully.');
      navigate('/dashboard?tab=applications');
    } catch (err) {
      console.error('Apply error:', err);
      const message = err instanceof Error ? err.message : 'Unable to apply at this time.';
      alert(`Failed to apply: ${message}`);
    }
  }, [internship, user, id, navigate]);

  // Auto-trigger apply if user just returned from login with ?autoApply=true
  useEffect(() => {
    if (autoApply && !loading && user && internship && user.role === 'student') {
      handleApply();
    }
  }, [autoApply, loading, user, internship, handleApply]);

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

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Full-time':
        return 'bg-blue-600 text-white border-[2px] border-slate-900';
      case 'Part-time':
        return 'bg-amber-400 text-slate-900 border-[2px] border-slate-900';
      case 'Remote':
        return 'bg-rose-500 text-white border-[2px] border-slate-900';
      default:
        return 'bg-slate-200 text-slate-700 border-[2px] border-slate-900';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rose-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-bold">Loading internship...</p>
        </div>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Internship not found</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">The internship you are looking for does not exist or has been removed.</p>
          <Link to="/browse" className="text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold">
            Browse all internships
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="border-b-4 border-slate-900 dark:border-white bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors font-bold"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border-[3px] border-slate-900 dark:border-white relative">
                {internship.company?.profile_image ? (
                  <img
                    src={resolveLogoUrl(internship.company.profile_image)}
                    alt={internship.company?.name}
                    onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${internship.company?.name || 'C'}&background=eff6ff&color=2563eb&size=256`}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <img src={`https://ui-avatars.com/api/?name=${internship.company?.name || 'Company'}&background=eff6ff&color=2563eb&size=256`} alt="Company Logo" className="w-full h-full object-contain p-2" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{internship.title}</h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 mb-4 font-bold">{internship.company?.name || internship.company || 'Unknown Company'}</p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center text-slate-600 dark:text-slate-400">
                    <MapPin className="w-5 h-5 mr-2" />
                    {internship.location}
                  </div>
                  {(() => {
                    const badge = (internship.type && internship.type.toLowerCase() !== (internship.location || '').toLowerCase())
                      ? internship.type
                      : 'Full-time';
                    return (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor(badge)}`}>
                        {badge}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t-[3px] border-slate-900 dark:border-white pt-6">
            {!user && (
              <button
                onClick={handleApply}
                className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-bold flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Login to Apply
              </button>
            )}
            {user && user.role === 'student' && (
              <button onClick={handleApply} className="w-full sm:w-auto px-8 py-3 bg-rose-500 text-white rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-bold flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                Apply Now
              </button>
            )}
            {user?.role === 'company' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-[3px] border-blue-600 rounded-2xl p-4 text-sm text-blue-700 dark:text-blue-300 font-bold">
                Companies cannot apply to internships. You can only post internships for students to apply to.
              </div>
            )}
            {user?.role === 'admin' && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border-[3px] border-purple-600 rounded-2xl p-4 text-sm text-purple-700 dark:text-purple-300 font-bold">
                You are logged in as an <strong>Admin</strong>. Admins cannot apply for internships, but you can manage them from the admin panel.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] p-8 mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">About the Role</h2>
          <div className="prose max-w-none text-slate-700 dark:text-slate-400 space-y-4">
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
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] p-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-rose-500" />
              Responsibilities
            </h3>
            <ul className="space-y-2 text-slate-700 dark:text-slate-400">
              <li className="flex items-start">
                <span className="text-rose-500 mr-2 font-bold">•</span>
                <span>Assist with day-to-day tasks and projects</span>
              </li>
              <li className="flex items-start">
                <span className="text-rose-500 mr-2 font-bold">•</span>
                <span>Collaborate with team members on assignments</span>
              </li>
              <li className="flex items-start">
                <span className="text-rose-500 mr-2 font-bold">•</span>
                <span>Participate in team meetings and discussions</span>
              </li>
              <li className="flex items-start">
                <span className="text-rose-500 mr-2 font-bold">•</span>
                <span>Learn and apply industry best practices</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] p-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Requirements
            </h3>
            <ul className="space-y-2 text-slate-700 dark:text-slate-400">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">•</span>
                <span>Currently enrolled in a relevant degree program</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">•</span>
                <span>Strong communication and teamwork skills</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">•</span>
                <span>Passion for learning and professional growth</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">•</span>
                <span>Basic knowledge in relevant field</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] p-8">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">About {internship.company?.name || internship.company || internship.company_name || 'Company'}</h2>
          <p className="text-slate-700 dark:text-slate-400 leading-relaxed">
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

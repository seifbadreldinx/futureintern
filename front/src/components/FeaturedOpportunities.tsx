import { Link } from 'react-router-dom';
import { MapPin, GraduationCap, Briefcase, User, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function FeaturedOpportunities() {
  const sectionRef = useScrollReveal();
  const [internships, setInternships] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.internships.getAll();
        if (res.internships) {
          setInternships(res.internships.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to load featured opportunities", error);
      }
    })();
  }, []);

  if (internships.length === 0) return null; // Don't show empty section

  // Temporarily disabled to fix layout issues
  return null;

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Full-time':
        return 'bg-blue-100 text-blue-800';
      case 'Part-time':
        return 'bg-green-100 text-green-800';
      case 'Remote':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <section
      ref={sectionRef.elementRef}
      className={`pt-4 pb-0 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/30 to-white relative overflow-hidden ${sectionRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Background icons - students and employees */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-16 left-8 animate-float">
          <GraduationCap className="w-20 h-20 text-gray-600" />
        </div>
        <div className="absolute top-32 right-12 animate-float animation-delay-200">
          <Briefcase className="w-16 h-16 text-gray-600" />
        </div>
        <div className="absolute bottom-24 left-24 animate-float animation-delay-400">
          <User className="w-18 h-18 text-gray-600" />
        </div>
        <div className="absolute bottom-16 right-24 animate-float animation-delay-300">
          <FileText className="w-20 h-20 text-gray-600" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Featured Opportunities
          </h2>
          <Link
            to="/browse"
            className="text-gray-700 hover:text-gray-900 font-medium hidden sm:block transition-all hover:translate-x-1"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {internships.map((internship, index) => (
            <Link
              key={internship.id}
              to={`/internship/${internship.id}`}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer transform hover:-translate-y-2 duration-300 animate-fade-in-up"
              style={{
                animationDelay: `${(index + 1) * 0.1}s`
              }}
            >
              <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm border border-gray-100 overflow-hidden">
                {internship.company?.profile_image ? (
                  <img
                    src={internship.company.profile_image}
                    alt={internship.company?.name}
                    onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${internship.company?.name || 'C'}&background=eff6ff&color=2563eb&size=128&font-size=0.5`}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${internship.company?.name || 'C'}&background=eff6ff&color=2563eb&size=128&font-size=0.5`}
                    alt={internship.company?.name}
                    className="w-full h-full object-contain p-1"
                  />
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                {internship.title}
              </h3>

              <div className="flex items-center text-gray-600 mb-3 text-sm">
                <span className="font-medium truncate">{internship.company?.name || internship.company || 'Company'}</span>
              </div>

              <div className="flex items-center text-gray-500 text-sm mb-4">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">{internship.location}</span>
              </div>

              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getBadgeColor(internship.type)}`}>
                {internship.type || 'Full-time'}
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden animate-fade-in-up animation-delay-500">
          <Link
            to="/browse"
            className="text-gray-700 hover:text-gray-900 font-medium transition-all"
          >
            View All Internships →
          </Link>
        </div>
      </div>
    </section>
  );
}



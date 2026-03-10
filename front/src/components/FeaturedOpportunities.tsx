import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { resolveLogoUrl } from '../utils/logoUrl';

export const FeaturedOpportunities = memo(function FeaturedOpportunities() {
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

  if (internships.length === 0) return null;

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'Full-time':
        return 'bg-rose-500 text-white';
      case 'Part-time':
        return 'bg-blue-600 text-white';
      case 'Remote':
        return 'bg-amber-400 text-slate-900';
      default:
        return 'bg-amber-400 text-slate-900';
    }
  };

  return (
    <section
      ref={sectionRef.elementRef}
      className={`py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-transparent ${sectionRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
    >
      {/* Bold Geometric Shapes */}
      <div className="absolute top-1/4 left-10 w-16 h-16 bg-blue-600 border-4 border-slate-900 rounded-full animate-float pointer-events-none"></div>
      <div className="absolute top-1/2 right-10 w-12 h-12 bg-amber-400 border-4 border-slate-900 rotate-12 animate-float animation-delay-300 pointer-events-none"></div>
      <div className="absolute bottom-20 left-1/4 w-14 h-14 bg-rose-500 border-4 border-slate-900 -rotate-12 animate-float animation-delay-500 pointer-events-none"></div>

      <div className="absolute inset-0 opacity-[0.05]">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `radial-gradient(#0f172a 1.5px, transparent 1.5px)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-end mb-16 animate-fade-in-up">
          <div>
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-4">
              Featured <br /><span className="text-rose-500">Internships</span>
            </h2>
            <div className="h-2 w-32 bg-blue-600 rounded-full"></div>
          </div>
          <Link
            to="/browse"
            className="px-8 py-4 bg-amber-400 dark:bg-amber-500 text-slate-900 dark:text-white border-4 border-slate-900 dark:border-white rounded-2xl font-black text-xl shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all hidden sm:flex items-center"
          >
            Find Internships <ArrowRight className="ml-2 w-6 h-6" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {internships.map((internship, index) => (
            <Link
              key={internship.id}
              to={`/internship/${internship.id}`}
              className="group bg-white dark:bg-slate-900 border-4 border-slate-900 dark:border-white rounded-[2rem] p-8 shadow-[12px_12px_0px_0px_#0f172a] dark:shadow-[12px_12px_0px_0px_var(--primary)] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all duration-300 animate-fade-in-up opacity-0"
              style={{
                animationDelay: `${(index + 1) * 0.1}s`,
                animationFillMode: 'forwards'
              }}
            >
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-3 transition-transform overflow-hidden border-4 border-slate-900 shadow-[4px_4px_0px_0px_#f43f5e]">
                {internship.company?.profile_image ? (
                  <img
                    src={resolveLogoUrl(internship.company.profile_image)}
                    alt={internship.company?.name}
                    onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${internship.company?.name || 'C'}&background=0f172a&color=ffffff&size=128&font-size=0.5`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-black text-2xl">{(internship.company?.name || 'C').charAt(0)}</span>
                )}
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 line-clamp-1 uppercase tracking-tight">
                {internship.title}
              </h3>

              <div className="flex items-center mb-4">
                <span className="font-black text-sm text-rose-500 uppercase tracking-widest">{internship.company?.name || internship.company || 'Company'}</span>
              </div>

              <div className="flex items-center text-slate-600 dark:text-slate-200 font-bold text-sm mb-6">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                {internship.location}
              </div>

              <span className={`inline-block px-5 py-2 border-4 border-slate-900 dark:border-white rounded-xl text-sm font-black tracking-wider uppercase shadow-[3px_3px_0px_0px_#0f172a] dark:shadow-[3px_3px_0px_0px_#ffffff] ${getBadgeStyle(internship.type)}`}>
                {internship.type || 'Full-time'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
});



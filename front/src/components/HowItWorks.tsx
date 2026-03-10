import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Send, Briefcase, MapPin, ArrowRight } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const HowItWorks = memo(function HowItWorks() {
  const sectionRef = useScrollReveal();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    navigate(`/browse?${params.toString()}`);
  };

  const steps = [
    {
      icon: Search,
      title: 'Search',
      description: 'Browse through hundreds of internship opportunities from top companies tailored to your interests and skills.',
    },
    {
      icon: Send,
      title: 'Apply',
      description: 'Submit your applications easily with our streamlined process. Track your applications all in one place.',
    },
    {
      icon: Briefcase,
      title: 'Get Hired',
      description: 'Connect with recruiters, ace your interviews, and start your dream career with leading organizations.',
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={sectionRef.elementRef}
      className={`py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-amber-400/10 dark:bg-transparent ${sectionRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
    >
      {/* Bold Geometric Shapes */}
      <div className="absolute top-10 right-[20%] w-10 h-10 bg-amber-400 border-4 border-slate-900 rounded-full animate-float pointer-events-none"></div>
      <div className="absolute top-1/2 left-10 w-14 h-14 bg-rose-500 border-4 border-slate-900 rotate-12 animate-float animation-delay-300 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-12 h-12 bg-blue-600 border-4 border-slate-900 -rotate-12 animate-float animation-delay-500 pointer-events-none"></div>

      {/* Decorative Glows */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-sky-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className={`text-center mb-16 transition-all duration-700 ${sectionRef.isRevealed ? 'reveal-up active' : 'reveal-up'}`}>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            FutureIntern: Your Gateway to Professional Excellence
          </h2>
          <p className="text-gray-600 dark:text-slate-400 max-w-3xl mx-auto text-lg sm:text-xl font-medium leading-relaxed">
            We bridge the gap between ambitious students and world-class companies, helping you launch your career with confidence and ease.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative mb-20">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-1 bg-slate-900 dark:bg-slate-700"></div>

          {steps.map((step, index) => (
            <div
              key={index}
              className={`text-center group relative transition-all duration-700 delay-${(index + 1) * 100} ${sectionRef.isRevealed ? 'reveal-up active' : 'reveal-up'}`}
            >
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] relative z-10 ${index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-rose-500' : 'bg-amber-400'}`}>
                <step.icon className={`w-12 h-12 ${index === 2 ? 'text-slate-900' : 'text-white'}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed font-medium">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className={`transition-all duration-1000 delay-500 ${sectionRef.isRevealed ? 'reveal-up active' : 'reveal-up'}`}>
          <form
            onSubmit={handleSearch}
            className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 p-3 rounded-[2.5rem] shadow-[12px_12px_0px_0px_#0f172a] dark:shadow-[12px_12px_0px_0px_var(--primary)] border-4 border-slate-900 dark:border-white flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1 flex items-center px-5 gap-3 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-white/10 py-3 sm:py-0">
              <Search className="w-6 h-6 text-sky-500 dark:text-sky-300" />
              <input
                type="text"
                placeholder="Job title or keyword"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-indigo-200/50 font-medium text-lg"
              />
            </div>
            <div className="flex-1 flex items-center px-5 gap-3 py-3 sm:py-0">
              <MapPin className="w-6 h-6 text-rose-500 dark:text-rose-300" />
              <input
                type="text"
                placeholder="Where?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-indigo-200/50 font-medium text-lg"
              />
            </div>
            <button
              type="submit"
              className="px-12 py-5 bg-blue-600 text-white border-4 border-slate-900 dark:border-white rounded-2xl transition-all font-black text-xl shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:scale-95 flex items-center justify-center gap-2"
            >
              Search <ArrowRight className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
});

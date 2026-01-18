import { Search, Send, Briefcase, GraduationCap, User } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function HowItWorks() {
  const sectionRef = useScrollReveal();
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
      ref={sectionRef.elementRef}
      className={`pt-4 pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden ${sectionRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-gray-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gray-300/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      {/* Background icons - students and employees */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-20 left-16 animate-float">
          <GraduationCap className="w-24 h-24 text-gray-600" />
        </div>
        <div className="absolute bottom-20 right-16 animate-float animation-delay-300">
          <Briefcase className="w-20 h-20 text-gray-600" />
        </div>
        <div className="absolute top-1/2 left-8 animate-float animation-delay-200">
          <User className="w-16 h-16 text-gray-600" />
        </div>
        <div className="absolute top-1/2 right-8 animate-float animation-delay-400">
          <User className="w-18 h-18 text-gray-600" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
          Find Your Internship in Three Easy Steps
        </h2>
        <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
          Our simple process makes it easy for students to discover and apply to internships.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

          {steps.map((step, index) => (
            <div
              key={index}
              className="text-center group relative"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-xl relative z-10">
                <step.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

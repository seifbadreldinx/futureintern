import { memo } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const Testimonials = memo(function Testimonials() {
  const sectionRef = useScrollReveal();

  return (
    <section
      ref={sectionRef.elementRef}
      className={`py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-transparent ${sectionRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
    >
      {/* Bold Geometric Shapes */}
      <div className="absolute top-20 left-[5%] w-10 h-10 bg-amber-400 border-4 border-slate-900 rounded-full animate-float pointer-events-none"></div>
      <div className="absolute bottom-20 right-[5%] w-12 h-12 bg-rose-500 border-4 border-slate-900 rotate-12 animate-float animation-delay-300 pointer-events-none"></div>

      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className={`text-center mb-16 transition-all duration-700 ${sectionRef.isRevealed ? 'reveal-up active' : 'reveal-up'}`}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight uppercase">
            Success <span className="text-rose-500">Stories</span>
          </h2>
          <p className="text-slate-900/60 dark:text-slate-200/70 max-w-2xl mx-auto text-xl font-black uppercase tracking-tight">
            Join thousands of students who have launched <br /> their careers through <span className="text-blue-600 underline decoration-4 decoration-amber-400">FutureIntern</span>.
          </p>
        </div>

        <div className="text-center py-16">
          <p className="text-slate-500 dark:text-slate-400 font-bold text-lg uppercase tracking-wider">Coming soon — real stories from our community!</p>
        </div>
      </div>
    </section>
  );
});

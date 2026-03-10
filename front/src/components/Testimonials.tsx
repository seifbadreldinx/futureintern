import { memo } from 'react';
import { Quote } from 'lucide-react';
import { testimonials } from '../data';
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

        {/* Infinite Scrolling Marquee */}
        <div className="relative w-full overflow-hidden py-10">
          <div className="animate-infinite-scroll flex gap-8">
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={`${testimonial.id}-${index}`}
                className="w-[350px] flex-shrink-0 bg-white dark:bg-slate-900 rounded-[2rem] border-4 border-slate-900 dark:border-white p-8 relative shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_var(--primary)] group hover:-translate-y-2 hover:shadow-none transition-all duration-300"
              >
                <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Quote className="w-12 h-12 text-rose-500 rotate-180" />
                </div>

                <p className="text-slate-900 dark:text-slate-200 text-lg font-bold mb-8 leading-snug relative z-10 line-clamp-3">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center">
                  <div className="w-14 h-14 bg-amber-400 border-4 border-slate-900 dark:border-white rounded-xl flex items-center justify-center mr-4 shadow-[3px_3px_0px_0px_#0f172a] dark:shadow-[3px_3px_0px_0px_#ffffff] transform group-hover:rotate-6 transition-transform">
                    <span className="text-white font-black text-lg">{testimonial.avatar}</span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-black text-gray-900 dark:text-white text-base truncate">{testimonial.name}</p>
                    <p className="text-rose-500 dark:text-rose-400 font-bold text-xs uppercase tracking-wider truncate">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Faders for marquee */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white dark:from-[#020617] to-transparent z-20 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white dark:from-[#020617] to-transparent z-20 pointer-events-none"></div>
        </div>
      </div>
    </section>
  );
});

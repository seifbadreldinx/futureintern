import { GraduationCap, Briefcase, User, FileText, Globe, ArrowRight } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function Hero() {
  const { elementRef, isRevealed } = useScrollReveal();

  const scrollToHow = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={elementRef}
      className="relative overflow-hidden py-32 sm:py-48 px-4 sm:px-6 lg:px-8 min-h-[85vh] flex items-center bg-transparent"
    >
      {/* Bold Geometric Shapes */}
      <div className="absolute top-20 left-[10%] w-12 h-12 bg-amber-400 border-4 border-slate-900 rounded-full animate-float pointer-events-none"></div>
      <div className="absolute top-40 right-[15%] w-16 h-16 bg-rose-500 border-4 border-slate-900 rotate-12 animate-float animation-delay-300 pointer-events-none"></div>
      <div className="absolute bottom-20 left-[20%] w-14 h-14 bg-blue-600 border-4 border-slate-900 -rotate-12 animate-float animation-delay-500 pointer-events-none"></div>
      <div className="absolute bottom-40 right-[5%] w-10 h-10 bg-amber-400 border-4 border-slate-900 rounded-full animate-float animation-delay-200 pointer-events-none"></div>
      <div className="absolute top-1/2 left-[5%] w-8 h-8 bg-rose-500 border-4 border-slate-900 rotate-45 animate-float pointer-events-none"></div>

      {/* Organic Vibrant Glows */}
      <div className="absolute top-0 right-0 w-[70%] h-[100%] bg-rose-500/10 dark:bg-rose-500/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-[60%] h-[80%] bg-blue-500/10 dark:bg-blue-500/20 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

      {/* Decorative icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] dark:opacity-[0.1]">
        <div className="absolute top-24 left-[10%] animate-float">
          <GraduationCap className="w-24 h-24 text-indigo-600 dark:text-white" />
        </div>
        <div className="absolute top-1/2 left-[5%] animate-float animation-delay-200">
          <User className="w-16 h-16 text-rose-600 dark:text-white" />
        </div>
        <div className="absolute bottom-32 left-[12%] animate-float animation-delay-300">
          <FileText className="w-20 h-20 text-amber-600 dark:text-white" />
        </div>
        <div className="absolute top-32 right-[8%] animate-float animation-delay-100">
          <Briefcase className="w-20 h-20 text-indigo-600 dark:text-white" />
        </div>
        <div className="absolute top-[60%] right-[5%] animate-float animation-delay-500">
          <Globe className="w-24 h-24 text-rose-600 dark:text-white" />
        </div>
        <div className="absolute bottom-40 right-[15%] animate-float animation-delay-400">
          <GraduationCap className="w-16 h-16 text-indigo-600 dark:text-white" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
        <h1 className={`text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 transition-all duration-1000 drop-shadow-sm tracking-tight leading-[1.1] ${isRevealed ? 'reveal-up active' : 'reveal-up'}`}>
          Opportunities Are Waiting <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-500 to-blue-600 dark:from-rose-400 dark:via-amber-300 dark:to-blue-400">
            Start Your Journey
          </span>
        </h1>

        <p className={`text-lg sm:text-xl text-gray-600 dark:text-indigo-50/90 mb-12 max-w-2xl mx-auto font-medium transition-all duration-1000 delay-200 ${isRevealed ? 'reveal-up active' : 'reveal-up'}`}>
          Explore internships, connect with companies, and grow your professional path. Your career doesn't wait for graduation.
        </p>

        <div className={`flex flex-col items-center gap-10 mb-16 transition-all duration-1000 delay-300 ${isRevealed ? 'reveal-up active' : 'reveal-up'}`}>
          <button
            onClick={scrollToHow}
            className="px-12 py-6 bg-rose-500 text-white border-4 border-slate-900 dark:border-white rounded-[2rem] transition-all font-black text-2xl shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:scale-95 flex items-center justify-center gap-3 group"
          >
            Get Started Free
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
          </button>

          <button
            onClick={scrollToHow}
            className="text-gray-500 dark:text-gray-400 font-bold flex items-center gap-2 hover:text-indigo-600 dark:hover:text-white transition-colors"
          >
            Learn How it Works <ArrowRight className="w-4 h-4 rotate-90" />
          </button>
        </div>

        {/* Scroll indicator */}
        <div className={`mt-12 animate-bounce transition-all duration-1000 delay-500 hidden sm:block ${isRevealed ? 'reveal-up active' : 'reveal-up'}`}>
          <div className="w-1.5 h-24 bg-gradient-to-b from-slate-900 dark:from-white to-transparent mx-auto rounded-full"></div>
          <span className="text-sm text-slate-900 dark:text-white font-black uppercase tracking-[0.4em] mt-6 block">SCROLL DOWN</span>
        </div>
      </div>
    </section>
  );
}

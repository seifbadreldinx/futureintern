import { memo } from 'react';
import { ClipboardCheck, Trophy, MessagesSquare, Headphones, MessageCircleQuestion, Route, Sparkles } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const WhyFutureIntern = memo(function WhyFutureIntern() {
    const sectionRef = useScrollReveal();

    const features = [
        {
            icon: ClipboardCheck,
            title: 'Curated Roles',
            description: 'Access exclusive internship opportunities and top-tier organizations.',
            color: 'bg-rose-500',
            iconBg: 'bg-white',
            shadowColor: 'shadow-[6px_6px_0px_0px_#0f172a]'
        },
        {
            icon: Trophy,
            title: 'Skill Building',
            description: 'Learn innovative techniques and master professional skill building.',
            color: 'bg-amber-400',
            iconBg: 'bg-white',
            shadowColor: 'shadow-[6px_6px_0px_0px_#0f172a]'
        },
        {
            icon: MessagesSquare,
            title: 'Expert Support',
            description: 'Ensure support and access one-on-one working partnerships.',
            color: 'bg-blue-600',
            iconBg: 'bg-white',
            shadowColor: 'shadow-[6px_6px_0px_0px_#0f172a]'
        },
        {
            icon: Headphones,
            title: 'Dedicated Help',
            description: 'Access experts and professional details for your career growth.',
            color: 'bg-blue-600',
            iconBg: 'bg-white',
            shadowColor: 'shadow-[6px_6px_0px_0px_#0f172a]'
        },
        {
            icon: MessageCircleQuestion,
            title: 'Networking',
            description: 'Maximize your growth and start networking with industry leaders.',
            color: 'bg-rose-500',
            iconBg: 'bg-white',
            shadowColor: 'shadow-[6px_6px_0px_0px_#0f172a]'
        },
        {
            icon: Route,
            title: 'Career Path',
            description: 'Communicate your brand and build your unique career path.',
            color: 'bg-blue-600',
            iconBg: 'bg-white',
            shadowColor: 'shadow-[6px_6px_0px_0px_#0f172a]'
        }
    ];

    return (
        <section
            ref={sectionRef.elementRef}
            className={`py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-transparent ${sectionRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
        >
            {/* Geometric Shapes */}
            <div className="absolute top-10 right-[10%] w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[50px] border-b-amber-400 rotate-[35deg] animate-float pointer-events-none hidden sm:block"></div>
            <div className="absolute top-5 right-[15%] w-10 h-10 bg-rose-500 border-4 border-slate-900 rotate-12 animate-float animation-delay-300 pointer-events-none hidden sm:block"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600 rounded-full border-[10px] border-slate-900 animate-float animation-delay-500 pointer-events-none hidden sm:block"></div>

            <div className="absolute top-1/4 -left-10 w-24 h-24 rounded-full border-8 border-blue-600 animate-float pointer-events-none opacity-20"></div>
            <div className="absolute bottom-10 right-10 w-12 h-12 bg-rose-500 border-4 border-slate-900 rounded-full animate-float animation-delay-200 pointer-events-none"></div>
            <div className="absolute bottom-20 right-[15%] w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-blue-600 -rotate-12 animate-float animation-delay-700 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className={`mb-20 transition-all duration-700 ${sectionRef.isRevealed ? 'reveal-up active' : 'reveal-up'}`}>
                    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-amber-400 border-4 border-slate-900 text-slate-900 text-xs font-black uppercase tracking-widest mb-6 shadow-[4px_4px_0px_0px_#0f172a]">
                        <Sparkles className="w-4 h-4" />
                        <span>Excellence Guaranteed</span>
                    </div>
                    <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-4">
                        Why <span className="text-rose-500 underline decoration-8 decoration-amber-400/50">FutureIntern?</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`group transition-all duration-700 delay-${(index + 1) * 100} ${sectionRef.isRevealed ? 'reveal-up active' : 'reveal-up'}`}
                        >
                            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 border-4 border-slate-900 dark:border-white ${feature.shadowColor} relative z-10 ${feature.color}`}>
                                <div className={`w-16 h-16 ${feature.iconBg} border-4 border-slate-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#0f172a]`}>
                                    <feature.icon className="w-8 h-8 text-slate-900" />
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors uppercase tracking-tight">
                                {feature.title}
                            </h3>

                            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-bold">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
});

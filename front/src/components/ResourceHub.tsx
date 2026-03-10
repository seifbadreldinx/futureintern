import { memo } from 'react';
import { FileText, GraduationCap, Map, Users, Layout, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const ResourceHub = memo(function ResourceHub() {
    const sectionRef = useScrollReveal();

    const resources = [
        {
            title: 'Resume Vault',
            description: 'Master the ATS with high-conversion CV templates and AI-ready layouts.',
            icon: FileText,
            color: 'bg-rose-500',
            tag: 'Most Popular',
            linkText: 'Download Templates'
        },
        {
            title: 'Interview Prep',
            description: 'The "Top 50" question bank with expert behavioral and technical answers.',
            icon: GraduationCap,
            color: 'bg-amber-400',
            tag: 'Essential',
            linkText: 'Start Practicing'
        },
        {
            title: 'Career Roadmaps',
            description: 'Step-by-step visual guides for Engineering, Design, and Marketing roles.',
            icon: Map,
            color: 'bg-blue-600',
            tag: 'New',
            linkText: 'View Roadmaps'
        },
        {
            title: 'Network Toolkit',
            description: 'Proven cold email templates and LinkedIn profile optimization guides.',
            icon: Users,
            color: 'bg-indigo-500',
            tag: 'Premium',
            linkText: 'Get Templates'
        },
        {
            title: 'Portfolio Lab',
            description: 'Project ideas that actually impress hiring managers and case study tips.',
            icon: Layout,
            color: 'bg-emerald-500',
            tag: 'Featured',
            linkText: 'Browse Ideas'
        },
        {
            title: 'Intern Survival',
            description: 'How to turn your internship into a full-time offer in just 90 days.',
            icon: Lightbulb,
            color: 'bg-purple-500',
            tag: 'Guide',
            linkText: 'Read Survival Guide'
        }
    ];

    return (
        <section
            ref={sectionRef.elementRef}
            id="resources"
            className={`py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-transparent ${sectionRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
        >
            {/* Decorative Elements */}
            <div className="absolute top-1/4 right-[5%] w-64 h-64 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 left-[5%] w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className={`mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8 transition-all duration-700 ${sectionRef.isRevealed ? 'reveal-up active' : 'reveal-up'}`}>
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-600 border-4 border-slate-900 text-white text-xs font-black uppercase tracking-widest mb-6 shadow-[4px_4px_0px_0px_#0f172a]">
                            <Sparkles className="w-4 h-4" />
                            <span>Career Toolkit</span>
                        </div>
                        <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-6">
                            The <span className="text-rose-500 underline decoration-8 decoration-amber-400/50">Resource</span> Hub
                        </h2>
                        <p className="text-xl font-bold text-slate-600 dark:text-slate-400">
                            Everything you need to go from "Student" to "Hired" at your dream company.
                            <br className="hidden sm:block" /> Curated templates, guides, and tools.
                        </p>
                    </div>

                    <button className="self-start md:self-auto group flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-4 border-slate-900 dark:border-white rounded-2xl font-black text-xl shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-tighter">
                        Explore All
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {resources.map((res, index) => (
                        <div
                            key={res.title}
                            className={`group bg-white dark:bg-slate-900 border-4 border-slate-900 dark:border-white p-8 rounded-[2.5rem] shadow-[10px_10px_0px_0px_#0f172a] dark:shadow-[10px_10px_0px_0px_#ffffff] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 transition-all duration-300 delay-${(index + 1) * 100} ${sectionRef.isRevealed ? 'reveal-up active' : 'reveal-up'}`}
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className={`w-16 h-16 ${res.color} border-4 border-slate-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#0f172a]`}>
                                    <res.icon className="w-8 h-8 text-slate-900" />
                                </div>
                                <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-2 border-slate-900 dark:border-white rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                    {res.tag}
                                </span>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter group-hover:text-rose-500 transition-colors">
                                {res.title}
                            </h3>

                            <p className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed mb-8 h-18 line-clamp-2">
                                {res.description}
                            </p>

                            <button className="flex items-center gap-2 text-rose-500 font-black uppercase tracking-widest text-sm group/link">
                                {res.linkText}
                                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
});

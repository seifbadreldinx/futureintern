import { Briefcase } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { Link } from 'react-router-dom';

export function Careers() {
    const heroRef = useScrollReveal();

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <div
                ref={heroRef.elementRef}
                className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 ${heroRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
            >
                <div className="text-center">
                    <div className="flex justify-center mb-6 animate-float">
                        <div className="bg-rose-500 p-4 rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]">
                            <Briefcase className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-6">Join Our Mission</h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 font-medium">
                        We're building the future of internship matching. While we don't have any open positions right now, we're always looking for passionate individuals to join our community.
                    </p>
                    <Link
                        to="/contact"
                        className="inline-flex items-center px-8 py-3 bg-rose-500 text-white rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all font-bold"
                    >
                        Contact Us
                    </Link>
                </div>
            </div>
        </div>
    );
}

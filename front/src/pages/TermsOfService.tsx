import { FileText } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function TermsOfService() {
    const heroRef = useScrollReveal();

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <div
                ref={heroRef.elementRef}
                className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 ${heroRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
            >
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="bg-slate-900 dark:bg-white p-4 rounded-2xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a]">
                            <FileText className="w-12 h-12 text-white dark:text-slate-900" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">Terms of Service</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold">Last Updated: January 2025</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] prose prose-blue max-w-none">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">1. Acceptance of Terms</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        By accessing or using FutureIntern, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                    </p>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">2. Use License</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Permission is granted to temporarily view the materials (information or software) on FutureIntern's website for personal, non-commercial transitory viewing only.
                    </p>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">3. User Accounts</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                    </p>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">4. Accuracy of Materials</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        The materials appearing on FutureIntern's website could include technical, typographical, or photographic errors. FutureIntern does not warrant that any of the materials on its website are accurate, complete, or current.
                    </p>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">5. Governing Law</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        These terms and conditions are governed by and construed in accordance with the laws of Egypt and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                    </p>
                </div>
            </div>
        </div>
    );
}

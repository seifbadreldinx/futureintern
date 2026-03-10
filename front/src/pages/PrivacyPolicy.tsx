import { Shield } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function PrivacyPolicy() {
    const heroRef = useScrollReveal();

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <div
                ref={heroRef.elementRef}
                className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 ${heroRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
            >
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-500 p-4 rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]">
                            <Shield className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">Privacy Policy</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold">Last Updated: January 2025</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] prose prose-blue max-w-none">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">1. Information We Collect</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        We collect information you provide directly to us, such as when you create an account, update your profile, apply for internships, or communicate with us. This includes your name, email address, educational background, and resume/CV.
                    </p>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">2. How We Use Your Information</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        We use the information we collect to provide and maintain our services, match you with internships, communicate with you about opportunities, and improve our platform.
                    </p>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">3. Information Sharing</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        We share your profile information and resumes with companies when you apply for their internships. We do not sell your personal data to third parties.
                    </p>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">4. Data Security</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        We implement reasonable security measures to protect your personal information. However, no security system is impenetrable and we cannot guarantee the security of our systems 100%.
                    </p>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">5. Contact Us</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        If you have any questions about this Privacy Policy, please contact us.
                    </p>
                </div>
            </div>
        </div>
    );
}

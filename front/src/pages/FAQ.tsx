import { HelpCircle } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function FAQ() {
    const heroRef = useScrollReveal();

    const faqs = [
        {
            question: "How do I apply for an internship?",
            answer: "Create an account, complete your profile, browse available internships, and click the 'Apply' button on the internship details page."
        },
        {
            question: "Is FutureIntern free for students?",
            answer: "Yes, FutureIntern is completely free for students to search and apply for internships."
        },
        {
            question: "How can companies post internships?",
            answer: "Companies can register for an employer account. Once verified, they can access the dashboard to post and manage internship listings."
        },
        {
            question: "What happens after I apply?",
            answer: "The company will review your application. You can track the status of your applications in your student dashboard."
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <div
                ref={heroRef.elementRef}
                className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 ${heroRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
            >
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="bg-amber-400 p-4 rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]">
                            <HelpCircle className="w-12 h-12 text-slate-900" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
                        Find answers to common questions about FutureIntern.
                    </p>
                </div>

                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)]">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{faq.question}</h3>
                            <p className="text-slate-600 dark:text-slate-400">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

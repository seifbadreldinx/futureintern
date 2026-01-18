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
        <div className="min-h-screen bg-gray-50">
            <div
                ref={heroRef.elementRef}
                className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 ${heroRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
            >
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="bg-blue-100 p-4 rounded-full">
                            <HelpCircle className="w-12 h-12 text-blue-600" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
                    <p className="text-xl text-gray-600">
                        Find answers to common questions about FutureIntern.
                    </p>
                </div>

                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                            <p className="text-gray-600">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

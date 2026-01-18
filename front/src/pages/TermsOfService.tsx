import { FileText } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function TermsOfService() {
    const heroRef = useScrollReveal();

    return (
        <div className="min-h-screen bg-gray-50">
            <div
                ref={heroRef.elementRef}
                className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 ${heroRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
            >
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-200 p-4 rounded-full">
                            <FileText className="w-12 h-12 text-gray-700" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
                    <p className="text-gray-500">Last Updated: January 2025</p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 prose prose-blue max-w-none">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h3>
                    <p className="text-gray-600 mb-6">
                        By accessing or using FutureIntern, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                    </p>

                    <h3 className="text-xl font-bold text-gray-900 mb-4">2. Use License</h3>
                    <p className="text-gray-600 mb-6">
                        Permission is granted to temporarily view the materials (information or software) on FutureIntern's website for personal, non-commercial transitory viewing only.
                    </p>

                    <h3 className="text-xl font-bold text-gray-900 mb-4">3. User Accounts</h3>
                    <p className="text-gray-600 mb-6">
                        You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                    </p>

                    <h3 className="text-xl font-bold text-gray-900 mb-4">4. Accuracy of Materials</h3>
                    <p className="text-gray-600 mb-6">
                        The materials appearing on FutureIntern's website could include technical, typographical, or photographic errors. FutureIntern does not warrant that any of the materials on its website are accurate, complete, or current.
                    </p>

                    <h3 className="text-xl font-bold text-gray-900 mb-4">5. Governing Law</h3>
                    <p className="text-gray-600">
                        These terms and conditions are governed by and construed in accordance with the laws of Egypt and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                    </p>
                </div>
            </div>
        </div>
    );
}

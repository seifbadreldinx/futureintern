import { Briefcase } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { Link } from 'react-router-dom';

export function Careers() {
    const heroRef = useScrollReveal();

    return (
        <div className="min-h-screen bg-gray-50 from-gray-50 via-white to-gray-50">
            <div
                ref={heroRef.elementRef}
                className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 ${heroRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
            >
                <div className="text-center">
                    <div className="flex justify-center mb-6 animate-float">
                        <div className="bg-blue-100 p-4 rounded-full">
                            <Briefcase className="w-12 h-12 text-blue-600" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-6">Join Our Mission</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
                        We're building the future of internship matching. While we don't have any open positions right now, we're always looking for passionate individuals to join our community.
                    </p>
                    <Link
                        to="/contact"
                        className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Contact Us
                    </Link>
                </div>
            </div>
        </div>
    );
}

import { Newspaper } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { Link } from 'react-router-dom';

export function Press() {
    const heroRef = useScrollReveal();

    return (
        <div className="min-h-screen bg-gray-50">
            <div
                ref={heroRef.elementRef}
                className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 ${heroRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
            >
                <div className="text-center">
                    <div className="flex justify-center mb-6 animate-float">
                        <div className="bg-purple-100 p-4 rounded-full">
                            <Newspaper className="w-12 h-12 text-purple-600" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-6">Press & Media</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
                        For press inquiries, brand assets, and media resources, please reach out to our media team.
                    </p>
                    <Link
                        to="/contact"
                        className="inline-flex items-center px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                    >
                        Get in Touch
                    </Link>
                </div>
            </div>
        </div>
    );
}

import { Mail, MessageCircle, Send, Phone } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function ContactUs() {
  const heroRef = useScrollReveal();
  const contactRef = useScrollReveal();

  const handleEmailClick = () => {
    window.location.href = 'mailto:mohamedsaad@gmail.com';
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/0100000000', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section
        ref={heroRef.elementRef}
        className={`education-bg relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8 ${heroRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float animation-delay-300"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 animate-fade-in-up drop-shadow-lg">
            Get in Touch
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-8 animate-fade-in-up animation-delay-200 drop-shadow-md">
            We're here to help! Reach out to us through any of the channels below.
          </p>
        </div>
      </section>

      {/* Contact Methods Section */}
      <section
        ref={contactRef.elementRef}
        className={`py-20 px-4 sm:px-6 lg:px-8 ${contactRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Email Card */}
            <div className="glass-effect rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Email Us</h3>
                <p className="text-gray-600 mb-6">
                  Send us an email and we'll get back to you as soon as possible.
                </p>
                <a
                  href="mailto:mohamedsaad@gmail.com"
                  onClick={handleEmailClick}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <Send className="w-5 h-5" />
                  <span className="font-medium">mohamedsaad@gmail.com</span>
                </a>
              </div>
            </div>

            {/* WhatsApp Card */}
            <div className="glass-effect rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">WhatsApp</h3>
                <p className="text-gray-600 mb-6">
                  Chat with us on WhatsApp for instant support and quick responses.
                </p>
                <a
                  href="https://wa.me/0100000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsAppClick}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <Phone className="w-5 h-5" />
                  <span className="font-medium">0100000000</span>
                </a>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 glass-effect rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Response Time</h3>
              <p className="text-gray-600 mb-4">
                We typically respond to emails within 24-48 hours during business days.
              </p>
              <p className="text-gray-600">
                For urgent matters, please use WhatsApp for faster assistance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


import { Mail, Phone } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function ContactUs() {
  const heroRef = useScrollReveal();
  const contactRef = useScrollReveal();

  const handleEmailClick = () => {
    window.location.href = 'mailto:mohamedsaad@gmail.com';
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
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">mohamedsaad@gmail.com</span>
                </a>
              </div>
            </div>

            {/* WhatsApp Card */}
            <div className="glass-effect rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-white"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.48 2 2 6.48 2 12c0 2.17.66 4.19 1.83 5.89L2.3 22l4.28-1.45A9.96 9.96 0 0 0 12 22a10 10 0 0 0 0-20Zm0 18.5a8.5 8.5 0 0 1-4.34-1.19l-.31-.19-3.23.85.86-3.15-.19-.3A8.5 8.5 0 1 1 12 20.5Zm4.85-6.17c-.27-.13-1.6-.79-1.84-.88-.25-.09-.43-.14-.6.14-.18.27-.69.87-.85 1.05-.15.17-.3.19-.57.05-.27-.13-1.14-.42-2.17-1.34-.8-.71-1.33-1.58-1.49-1.85-.15-.27-.01-.41.12-.54.12-.12.27-.31.4-.47.14-.17.18-.28.27-.46.09-.18.04-.34-.02-.48-.06-.13-.54-1.3-.74-1.78-.19-.47-.38-.41-.52-.41-.13 0-.28 0-.42 0-.15 0-.39.05-.59.27-.2.22-.77.75-.77 1.84 0 1.07.78 2.11.89 2.22.1.13 1.54 2.35 3.73 3.3.52.23.93.36 1.25.46.53.17 1.01.14 1.39.09.43-.06 1.6-.65 1.82-1.28.23-.63.23-1.17.16-1.29-.07-.11-.25-.18-.52-.31Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">WhatsApp</h3>
                <p className="text-gray-600 mb-6">
                  Chat with us on WhatsApp for instant support and quick responses.
                </p>
                <a
                  href="https://wa.me/201102930350"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <Phone className="w-5 h-5" />
                  <span className="font-medium">+20 11 02930350</span>
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


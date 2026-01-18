import { Quote } from 'lucide-react';
import { testimonials } from '../data';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function Testimonials() {
  const sectionRef = useScrollReveal();

  return (
    <section
      ref={sectionRef.elementRef}
      className={`py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/20 to-white relative overflow-hidden ${sectionRef.isRevealed ? 'scroll-reveal revealed' : 'scroll-reveal'}`}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-gray-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-gray-300 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
          Success Stories from Students Like You
        </h2>
        <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
          Hear from students who found their dream internships through FutureIntern.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-xl p-8 relative hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200"
            >
              <Quote className="w-10 h-10 text-gray-600 mb-4 opacity-50 transform rotate-180" />

              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center mr-4 shadow-lg transform hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-semibold">{testimonial.avatar}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

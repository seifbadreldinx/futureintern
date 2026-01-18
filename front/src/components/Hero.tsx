import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, GraduationCap, Briefcase, User, FileText, Send, Users } from 'lucide-react';

export function Hero() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to browse page with search params
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    navigate(`/browse?${params.toString()}`);
  };

  return (
    <section className="education-bg relative overflow-hidden pt-8 pb-0 px-4 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float animation-delay-300"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-float animation-delay-500"></div>
      </div>

      {/* Student and Employee Icons Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {/* Student icons - left side */}
        <div className="absolute top-32 left-8 animate-float">
          <GraduationCap className="w-16 h-16 text-gray-700" />
        </div>
        <div className="absolute top-48 left-24 animate-float animation-delay-200">
          <User className="w-12 h-12 text-gray-600" />
        </div>
        <div className="absolute top-64 left-12 animate-float animation-delay-400">
          <FileText className="w-14 h-14 text-gray-700" />
        </div>
        <div className="absolute bottom-32 left-16 animate-float animation-delay-300">
          <Send className="w-12 h-12 text-gray-600" />
        </div>
        <div className="absolute bottom-48 left-32 animate-float animation-delay-500">
          <GraduationCap className="w-14 h-14 text-gray-700" />
        </div>

        {/* Employee/Company icons - right side */}
        <div className="absolute top-28 right-12 animate-float animation-delay-100">
          <Briefcase className="w-16 h-16 text-gray-700" />
        </div>
        <div className="absolute top-44 right-28 animate-float animation-delay-300">
          <Users className="w-14 h-14 text-gray-600" />
        </div>
        <div className="absolute top-60 right-16 animate-float animation-delay-500">
          <Briefcase className="w-12 h-12 text-gray-700" />
        </div>
        <div className="absolute bottom-36 right-24 animate-float animation-delay-200">
          <User className="w-14 h-14 text-gray-600" />
        </div>
        <div className="absolute bottom-52 right-12 animate-float animation-delay-400">
          <FileText className="w-16 h-16 text-gray-700" />
        </div>

        {/* Center icons - applying/job search */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-float animation-delay-300">
          <Send className="w-20 h-20 text-gray-600" />
        </div>
        <div className="absolute top-1/2 left-[45%] transform -translate-y-1/2 animate-float animation-delay-100">
          <GraduationCap className="w-14 h-14 text-gray-700" />
        </div>
        <div className="absolute top-1/2 left-[55%] transform -translate-y-1/2 animate-float animation-delay-500">
          <Briefcase className="w-14 h-14 text-gray-700" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 animate-fade-in-up drop-shadow-lg">
          Your Journey to a Dream Internship Starts Here.
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 mb-6 animate-fade-in-up animation-delay-200 drop-shadow-md">
          Connecting students with top companies to launch their careers.
        </p>

        <form onSubmit={handleSearch} className="glass-effect rounded-2xl shadow-2xl p-4 sm:p-6 max-w-3xl mx-auto animate-fade-in-up animation-delay-300 hover:shadow-3xl transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Keyword or Title"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
              />
            </div>

            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
              />
            </div>

            <button
              type="submit"
              className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
            >
              Search
            </button>
          </div>
        </form>

        {/* Branded Logo Section */}
        <div className="mt-6 mb-8 animate-fade-in-up">
          <img
            src="/futureintern-logo.jpg"
            alt="FutureIntern - Ignite Your Passion"
            className="mx-auto w-full max-w-3xl h-auto max-h-[300px] object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>
    </section>
  );
}

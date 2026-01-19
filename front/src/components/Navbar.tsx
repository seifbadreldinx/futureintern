import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X, User } from 'lucide-react';
import { isAuthenticated, logout as doLogout } from '../utils/auth';

export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isHome = location.pathname === '/';
  const [isAuth, setIsAuth] = useState<boolean>(isAuthenticated());

  useEffect(() => {
    const onStorage = () => setIsAuth(isAuthenticated());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Don't show navbar on auth pages
  if (isAuthPage) {
    return null;
  }

  const navLinks = [
    { to: '/browse', label: 'Internships', isAnchor: false },
    { to: '/companies', label: 'Companies', isAnchor: false },
    { to: '/about', label: 'About Us', isAnchor: false },
    { to: '/get-help', label: 'Get Help', isAnchor: false },
    { to: '/contact', label: 'Contact Us', isAnchor: false },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${isHome
        ? 'bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm'
        : 'bg-white border-b border-gray-200 shadow-sm'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-3 group animate-fade-in-up"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <GraduationCap className="relative w-9 h-9 text-gray-700 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-all">
              FutureIntern
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link, index) => (
              <Link
                key={link.label}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative group ${location.pathname === link.to
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuth ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Dashboard</span>
                </Link>
                <button
                  onClick={() => { doLogout(); setIsAuth(false); }}
                  className="px-5 py-2.5 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 font-medium transition-all duration-200"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register-company"
                  className="px-5 py-2.5 text-gray-700 hover:text-indigo-600 font-medium transition-all duration-200"
                >
                  For Companies
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-gray-700 border-2 border-gray-700 rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 font-medium transition-all duration-200 hover:scale-105 hover:shadow-md"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-md"
                >
                  Get Intern
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-y-auto transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="py-3 space-y-1.5 border-t border-gray-200 mt-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-base font-medium transition-all ${location.pathname === link.to
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-200 space-y-2">
              {isAuth ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => { doLogout(); setMobileMenuOpen(false); setIsAuth(false); }}
                    className="block w-full text-left px-4 py-2.5 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/register-company"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-center text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-all"
                  >
                    For Companies
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-center text-gray-700 border-2 border-gray-700 rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 font-medium transition-all"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-center bg-gray-900 text-white rounded-lg font-medium transition-all hover:bg-gray-800"
                  >
                    Get Intern
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

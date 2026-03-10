import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Shield, Coins, LogOut } from 'lucide-react';
import { isAuthenticated, logout as doLogout } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const [isAuth, setIsAuth] = useState<boolean>(isAuthenticated());
  const isAdmin = user?.role === 'admin';
  const dashboardPath = isAdmin ? '/admin' : '/dashboard';
  const dashboardLabel = isAdmin ? 'Admin' : 'Dashboard';

  useEffect(() => {
    const onStorage = () => setIsAuth(isAuthenticated());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (isAuthPage) {
    return null;
  }

  const navLinks = [
    { to: '/browse', label: 'Internships' },
    { to: '/companies', label: 'Companies' },
    { to: '/#resources', label: 'Resources' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="absolute top-6 left-0 right-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo + Nav Links */}
        <div className="flex items-center gap-10">
          <Link to="/" className="group relative">
            <span className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none relative">
              Future<span className="text-rose-500">Intern</span>
              <div className="absolute -bottom-1.5 left-0 w-full h-1.5 bg-amber-400 -rotate-1 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl text-lg font-black transition-all uppercase tracking-tighter ${location.pathname === link.to
                  ? 'text-rose-500'
                  : 'text-slate-900 dark:text-slate-200 hover:text-rose-500 dark:hover:text-amber-400'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block scale-90">
            <ThemeToggle />
          </div>

          {isAuth ? (
            <div className="hidden md:flex items-center space-x-3">
              {user?.role === 'student' && user.points !== undefined && (
                <Link to="/points-store" className="flex items-center space-x-1.5 px-4 py-2 bg-amber-400 text-slate-900 border-[3px] border-slate-900 dark:border-white rounded-xl font-black shadow-[3px_3px_0px_0px_#0f172a] dark:shadow-[3px_3px_0px_0px_#ffffff] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-sm uppercase tracking-tighter" title="View Points History">
                  <Coins className="w-4 h-4" />
                  <span>{user.points}</span>
                </Link>
              )}
              <Link
                to={dashboardPath}
                className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white border-[3px] border-slate-900 dark:border-white rounded-xl font-black shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-lg uppercase tracking-tighter"
              >
                {isAdmin ? <Shield className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
                <span className="hidden lg:inline">{dashboardLabel}</span>
              </Link>
              <button
                onClick={() => { doLogout(); setIsAuth(false); }}
                className="flex items-center space-x-2 px-5 py-2.5 text-rose-500 border-[3px] border-rose-500 rounded-xl font-black hover:bg-rose-500 hover:text-white transition-all text-sm uppercase tracking-tighter"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 text-lg font-black text-slate-900 dark:text-slate-200 hover:text-rose-500 transition-all uppercase tracking-tighter"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-8 py-2.5 bg-rose-500 text-white border-[3px] border-slate-900 dark:border-white rounded-xl text-lg font-black shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-tighter"
              >
                Join Now
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-900 dark:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-b-4 border-slate-900 dark:border-white">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter hover:text-rose-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t-4 border-slate-900 dark:border-white space-y-3">
              {isAuth ? (
                <>
                  {user?.role === 'student' && user.points !== undefined && (
                    <Link to="/points-store" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-4 py-2.5 bg-amber-400 text-slate-900 border-[3px] border-slate-900 rounded-xl font-black">
                      <Coins className="w-5 h-5" />
                      <span>Points: {user.points}</span>
                    </Link>
                  )}
                  <Link
                    to={dashboardPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white border-[3px] border-slate-900 rounded-xl font-black text-lg uppercase tracking-tighter"
                  >
                    {isAdmin ? <Shield className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
                    <span>{dashboardLabel}</span>
                  </Link>
                  <button
                    onClick={() => { doLogout(); setMobileMenuOpen(false); setIsAuth(false); }}
                    className="w-full text-left px-4 py-2.5 text-rose-500 font-black text-lg uppercase tracking-tighter hover:text-rose-600"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-center text-slate-900 dark:text-white font-black text-lg uppercase tracking-tighter"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-center bg-rose-500 text-white border-[3px] border-slate-900 rounded-xl font-black text-lg uppercase tracking-tighter"
                  >
                    Join Now
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

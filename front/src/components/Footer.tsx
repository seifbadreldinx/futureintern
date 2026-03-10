import { Link } from 'react-router-dom';

export function Footer() {
  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
    ],
    support: [
      { name: 'Contact Us', href: '/contact' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Help Center', href: '/get-help' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
  };

  return (
    <footer className="bg-white dark:bg-slate-950 border-t-8 border-slate-900 dark:border-white text-slate-900 dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          <div className="col-span-1">
            <div className="flex items-center space-x-3 mb-8 group">
              <div className="w-14 h-14 bg-rose-500 border-4 border-slate-900 dark:border-white rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] transform group-hover:rotate-6 transition-transform">
                <span className="text-2xl font-black text-white leading-none">FI</span>
              </div>
              <span className="text-3xl font-black tracking-tighter uppercase">
                Future<span className="text-rose-500">Intern</span>
              </span>
            </div>
            <p className="text-xl font-bold leading-tight">
              LAUNCHING THE <span className="text-blue-600 dark:text-blue-400">NEXT GENERATION</span> OF WORLD-CLASS TALENT.
            </p>
          </div>

          <div>
            <h3 className="text-slate-900 dark:text-white font-black text-xl mb-8 uppercase underline decoration-4 decoration-amber-400">Company</h3>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="hover:text-rose-500 dark:hover:text-rose-400 transition-colors font-black text-lg uppercase tracking-tight">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 dark:text-white font-black text-xl mb-8 uppercase underline decoration-4 decoration-rose-500">Support</h3>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-black text-lg uppercase tracking-tight">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 dark:text-white font-black text-xl mb-8 uppercase underline decoration-4 decoration-blue-600 dark:decoration-blue-400">Legal</h3>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors font-black text-lg uppercase tracking-tight">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t-4 border-slate-900 dark:border-white pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="font-black text-lg uppercase tracking-widest text-slate-900 dark:text-white">
            &copy; 2026 FUTUREINTERN. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-10">
            <Link to="/privacy" className="text-slate-900 dark:text-white uppercase tracking-widest text-sm font-black hover:text-rose-500 dark:hover:text-rose-400 transition-colors">Privacy</Link>
            <Link to="/terms" className="text-slate-900 dark:text-white uppercase tracking-widest text-sm font-black hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

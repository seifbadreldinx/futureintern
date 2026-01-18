import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '#careers' },
      { name: 'Press', href: '#press' },
    ],
    support: [
      { name: 'Contact Us', href: '/contact' },
      { name: 'FAQ', href: '#faq' },
      { name: 'Help Center', href: '/get-help' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '#privacy' },
      { name: 'Terms of Service', href: '#terms' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <GraduationCap className="w-8 h-8 text-gray-300" />
              <span className="text-xl font-bold text-white">FutureIntern</span>
            </div>
            <p className="text-gray-400 text-sm">
              Connecting students with top companies to launch their careers.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('#') ? (
                    <a href={link.href} className="hover:text-blue-400 transition-colors text-sm">
                      {link.name}
                    </a>
                  ) : (
                    <Link to={link.href} className="hover:text-blue-400 transition-colors text-sm">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('#') ? (
                    <a href={link.href} className="hover:text-blue-400 transition-colors text-sm">
                      {link.name}
                    </a>
                  ) : (
                    <Link to={link.href} className="hover:text-blue-400 transition-colors text-sm">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('#') ? (
                    <a href={link.href} className="hover:text-blue-400 transition-colors text-sm">
                      {link.name}
                    </a>
                  ) : (
                    <Link to={link.href} className="hover:text-blue-400 transition-colors text-sm">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-gray-400 text-sm">
            © 2025 FutureIntern. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
